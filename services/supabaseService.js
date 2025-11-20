import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { generatePracticePromptFromAction } from './geminiService.js';

const supabaseUrl = process.env.SUPABASE_URL;
// Support both naming conventions
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_API_KEY; // Service role key for backend

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase credentials not found. Database features will be disabled.');
} else {
  // Check if using anon key (which won't work for writes)
  if (supabaseServiceKey.includes('anon') || supabaseServiceKey.startsWith('eyJ')) {
    // Try to detect if it's anon key by checking the JWT payload
    try {
      const parts = supabaseServiceKey.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload.role === 'anon') {
          console.error('⚠️  WARNING: You are using the ANON key instead of SERVICE_ROLE key!');
          console.error('⚠️  The anon key cannot write to the database. Analyses will NOT be saved.');
          console.error('⚠️  Please update SUPABASE_SERVICE_ROLE_KEY in your .env file with the service_role key from Supabase Dashboard.');
        }
      }
    } catch (e) {
      // Couldn't parse JWT, continue
    }
  }
}

// Create Supabase client with service role key (bypasses RLS for backend operations)
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Get or create user by Clerk user ID
 */
export const getOrCreateUser = async (clerkUserId, email = null) => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  // Try to find existing user
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (existingUser) {
    return existingUser.id;
  }

  // Create new user if not found (default: free subscription)
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      clerk_user_id: clerkUserId,
      email: email,
      subscription_type: 'free',
      subscription_status: 'active',
      free_analysis_used: false,
      primary_goal: null,
      confidence_level: null
    })
    .select('id')
    .single();

  if (createError) {
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  return newUser.id;
};

const GOAL_LABELS = {
  confidence: 'Build Self-Confidence',
  interview: 'Job Interview Preparation',
  presentation: 'Improve Presentations',
  communication: 'Better Communication',
  leadership: 'Leadership Presence',
  dating: 'Dating & Romantic',
  social: 'Social Confidence',
  general: 'General Improvement'
};

const buildJourneyPayload = (userId, journeyData = {}) => {
  const focusSlug = journeyData.focusSlug || journeyData.primaryGoal || 'general';
  const consentVersion = journeyData.consentVersion || journeyData.consent?.version || null;
  const consentAcceptedAt = journeyData.consentAcceptedAt || journeyData.consent?.acceptedAt || null;
  const commitmentLevel = journeyData.commitmentLevel || journeyData.practiceCommitment || null;

  return {
    user_id: userId,
    focus_slug: focusSlug,
    focus_label: journeyData.focusLabel || GOAL_LABELS[focusSlug] || journeyData.displayName || 'Custom Journey',
    display_name: journeyData.displayName || null,
    confidence_level: journeyData.confidenceLevel || journeyData.confidence || 'medium',
    goal_context: journeyData.goalSpecificContext || journeyData.goalContext || null,
    template_id: journeyData.templateId || journeyData.template_id || null,
    difficulty_baseline: journeyData.difficultyBaseline || journeyData.difficulty_baseline || null,
    commitment_level: commitmentLevel,
    practice_commitment: journeyData.practiceCommitment || journeyData.practice_commitment || commitmentLevel,
    consent_version: consentVersion,
    consent_accepted_at: consentAcceptedAt,
    status: journeyData.status || 'active',
    is_default: journeyData.isDefault || false,
    started_from: journeyData.startedFrom || 'dashboard',
    last_active_at: journeyData.lastActiveAt || new Date().toISOString()
  };
};

const coerceNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const coerceInteger = (value) => {
  const parsed = coerceNumber(value);
  if (parsed === null) return null;
  return Math.round(parsed);
};

export const getUserJourneys = async (clerkUserId) => {
  if (!supabase) {
    return [];
  }

  const userId = await getOrCreateUser(clerkUserId);

  const { data, error } = await supabase
    .from('user_journeys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching user journeys:', error);
    return [];
  }

  return data || [];
};

export const getJourneyForUser = async (clerkUserId, journeyId) => {
  if (!supabase || !journeyId) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);

  const { data, error } = await supabase
    .from('user_journeys')
    .select('*')
    .eq('user_id', userId)
    .eq('id', journeyId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching journey:', error);
    }
    return null;
  }

  return data;
};

export const createUserJourney = async (clerkUserId, journeyData = {}) => {
  if (!supabase) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);
  const payload = buildJourneyPayload(userId, journeyData);

  if (payload.is_default) {
    await supabase
      .from('user_journeys')
      .update({ is_default: false })
      .eq('user_id', userId);
  }

  const { data, error } = await supabase
    .from('user_journeys')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error creating journey:', error);
    throw new Error(`Failed to create journey: ${error.message}`);
  }

  return data;
};

export const updateUserJourney = async (clerkUserId, journeyId, updates = {}) => {
  if (!supabase || !journeyId) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);
  const updatePayload = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  if (Object.prototype.hasOwnProperty.call(updatePayload, 'displayName')) {
    updatePayload.display_name = updatePayload.displayName;
    delete updatePayload.displayName;
  }

  if (Object.prototype.hasOwnProperty.call(updatePayload, 'lastActiveAt')) {
    updatePayload.last_active_at = updatePayload.lastActiveAt;
    delete updatePayload.lastActiveAt;
  }

  if (updates.focusSlug || updates.primaryGoal) {
    const focusSlug = updates.focusSlug || updates.primaryGoal;
    updatePayload.focus_slug = focusSlug;
    updatePayload.focus_label = updates.focusLabel || GOAL_LABELS[focusSlug] || updates.display_name || null;
    delete updatePayload.focusSlug;
    delete updatePayload.primaryGoal;
    delete updatePayload.focusLabel;
  }

  if (updates.goalSpecificContext) {
    updatePayload.goal_context = updates.goalSpecificContext;
    delete updatePayload.goalSpecificContext;
  }

  if (updates.confidenceLevel) {
    updatePayload.confidence_level = updates.confidenceLevel;
    delete updatePayload.confidenceLevel;
  }

  if (updates.templateId) {
    updatePayload.template_id = updates.templateId;
    delete updatePayload.templateId;
  }

  if (updates.difficultyBaseline) {
    updatePayload.difficulty_baseline = updates.difficultyBaseline;
    delete updatePayload.difficultyBaseline;
  }

  if (updates.commitmentLevel) {
    updatePayload.commitment_level = updates.commitmentLevel;
    delete updatePayload.commitmentLevel;
  }

  if (updates.practiceCommitment) {
    updatePayload.practice_commitment = updates.practiceCommitment;
    delete updatePayload.practiceCommitment;
  }

  if (updates.consentVersion) {
    updatePayload.consent_version = updates.consentVersion;
    delete updatePayload.consentVersion;
  }

  if (updates.consentAcceptedAt) {
    updatePayload.consent_accepted_at = updates.consentAcceptedAt;
    delete updatePayload.consentAcceptedAt;
  }

  if (updates.is_default === true) {
    await supabase
      .from('user_journeys')
      .update({ is_default: false })
      .eq('user_id', userId);
  }

  const { data, error } = await supabase
    .from('user_journeys')
    .update(updatePayload)
    .eq('id', journeyId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating journey:', error);
    return null;
  }

  return data;
};

export const ensureDefaultJourney = async (clerkUserId, journeyData = {}) => {
  if (!supabase) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);

  const { data: existingDefault } = await supabase
    .from('user_journeys')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .limit(1)
    .single();

  if (existingDefault) {
    const updated = await updateUserJourney(clerkUserId, existingDefault.id, {
      focusSlug: journeyData.primaryGoal || journeyData.focusSlug || existingDefault.focus_slug,
      focusLabel: journeyData.focusLabel,
      confidenceLevel: journeyData.confidenceLevel || existingDefault.confidence_level,
      goalSpecificContext: journeyData.goalSpecificContext || existingDefault.goal_context,
      templateId: journeyData.templateId || existingDefault.template_id,
      difficultyBaseline: journeyData.difficultyBaseline || existingDefault.difficulty_baseline,
      commitmentLevel: journeyData.commitmentLevel || existingDefault.commitment_level,
      practiceCommitment: journeyData.practiceCommitment || existingDefault.practice_commitment,
      consentVersion: journeyData.consentVersion || existingDefault.consent_version,
      consentAcceptedAt: journeyData.consentAcceptedAt || existingDefault.consent_accepted_at
    });
    return updated || existingDefault;
  }

  return await createUserJourney(clerkUserId, {
    ...journeyData,
    isDefault: true,
    startedFrom: journeyData.startedFrom || 'onboarding'
  });
};

export const getDefaultJourneyForUser = async (clerkUserId) => {
  if (!supabase) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);

  const { data, error } = await supabase
    .from('user_journeys')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching default journey:', error);
  }

  return data || null;
};

/**
 * Get user with subscription info
 */
export const getUserWithSubscription = async (clerkUserId) => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, subscription_type, subscription_status, subscription_expires_at, subscription_started_at, free_analysis_used')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
};

/**
 * Get subscription limits
 */
const getSubscriptionLimits = (subscriptionType) => {
  const limits = {
    free: { analyses: 1 },
    basic: { analyses: 12 },
    premium: { analyses: 20 },
    pro: { analyses: -1 } // unlimited
  };
  return limits[subscriptionType] || limits.free;
};

/**
 * Check if user can upload analysis
 */
export const canUserUploadAnalysis = async (clerkUserId) => {
  if (!supabase) {
    return { allowed: true, reason: null };
  }

  const user = await getUserWithSubscription(clerkUserId);
  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

    // Check if subscription is still active
  if (user.subscription_status !== 'active') {
    return { allowed: false, reason: 'Subscription not active' };
  }

      if (user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date()) {
        return { allowed: false, reason: 'Subscription expired' };
      }

  // Pro users can always upload (unlimited)
  if (user.subscription_type === 'pro') {
      return { allowed: true, reason: null };
    }

  // Get subscription limits
  const limits = getSubscriptionLimits(user.subscription_type);
  
  // If unlimited, allow
  if (limits.analyses === -1) {
    return { allowed: true, reason: null };
  }

  // Count analyses from current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const { count, error } = await supabase
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString());

  if (error) {
    console.error('Error counting analyses:', error);
    return { allowed: true, reason: null }; // Allow on error
  }

  // Check if user has reached their limit
  if (count >= limits.analyses) {
    const subscriptionName = user.subscription_type.charAt(0).toUpperCase() + user.subscription_type.slice(1);
    return { 
      allowed: false, 
      reason: 'monthly_limit_reached',
      message: `You've used all ${limits.analyses} analyses for this month. Upgrade to get more analyses or wait until next month.`
    };
  }

  // For free users, mark as used after first analysis
  if (user.subscription_type === 'free' && count === 0) {
    // Will be marked as used after the analysis is saved
  }

  return { allowed: true, reason: null };
};

/**
 * Mark free analysis as used
 */
export const markFreeAnalysisUsed = async (clerkUserId) => {
  if (!supabase) {
    return;
  }

  const userId = await getOrCreateUser(clerkUserId);
  await supabase
    .from('users')
    .update({ free_analysis_used: true })
    .eq('id', userId);
};

/**
 * Update user subscription
 */
export const updateUserSubscription = async (clerkUserId, subscriptionType, expiresAt = null) => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const userId = await getOrCreateUser(clerkUserId);
  
  const updateData = {
    subscription_type: subscriptionType,
    subscription_status: 'active'
  };

  if (expiresAt) {
    updateData.subscription_expires_at = expiresAt;
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
};

/**
 * Save onboarding answers to database
 */
export const saveOnboardingAnswers = async (clerkUserId, answers) => {
  if (!supabase) {
    return;
  }

  const userId = await getOrCreateUser(clerkUserId);
  
  const updateData = {
    primary_goal: answers.primaryGoal || 'general',
    confidence_level: answers.confidenceLevel || 'medium',
    onboarding_completed_at: new Date().toISOString()
  };

  if (answers?.consent?.version) {
    updateData.consent_version = answers.consent.version;
  }

  if (answers?.consent?.acceptedAt) {
    updateData.consent_accepted_at = answers.consent.acceptedAt;
  }

  // Add goal-specific context if provided (store as JSONB)
  if (answers.goalSpecificContext) {
    updateData.goal_specific_context = answers.goalSpecificContext;
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('Error saving onboarding answers:', error);
    // If goal_specific_context column doesn't exist, try without it
    if (error.message && error.message.includes('goal_specific_context')) {
      delete updateData.goal_specific_context;
      const { error: retryError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);
      if (retryError) {
        console.error('Error saving onboarding answers (retry):', retryError);
      }
    }
  }

  try {
    await ensureDefaultJourney(clerkUserId, answers);
  } catch (journeyError) {
    console.error('Failed to ensure default journey:', journeyError);
  }
};

/**
 * Get user with onboarding data
 */
export const getUserWithOnboarding = async (clerkUserId) => {
  if (!supabase) {
    return null;
  }

  // Try to fetch with goal_specific_context first
let { data, error } = await supabase
  .from('users')
  .select('id, primary_goal, confidence_level, goal_specific_context, onboarding_completed_at, subscription_type, subscription_status, free_analysis_used, consent_version, consent_accepted_at')
  .eq('clerk_user_id', clerkUserId)
  .single();

  // If column doesn't exist, retry without it
  if (error && error.code === '42703' && error.message?.includes('goal_specific_context')) {
    console.warn('goal_specific_context column does not exist, fetching without it. Please run migration.');
    const retryResult = await supabase
      .from('users')
      .select('id, primary_goal, confidence_level, onboarding_completed_at, subscription_type, subscription_status, free_analysis_used, consent_version, consent_accepted_at')
      .eq('clerk_user_id', clerkUserId)
      .single();
    
    if (retryResult.error) {
      console.error('Error fetching user:', retryResult.error);
      return null;
    }
    
    // Add goal_specific_context as null for backward compatibility
    return {
      ...retryResult.data,
      goal_specific_context: null
    };
  }

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
};

/**
 * Save analysis to database
 */
export const saveAnalysis = async (userId, analysisData) => {
  if (!supabase) {
    console.warn('Supabase not configured, skipping database save');
    return null;
  }

  const insertData = {
    user_id: userId,
    video_filename: analysisData.videoFilename,
    video_size: analysisData.videoSize,
    mime_type: analysisData.mimeType,
    user_context: analysisData.userContext,
    analysis_result: analysisData.analysisResult
  };

  if (analysisData.s3Key !== undefined && analysisData.s3Key !== null) {
    insertData.s3_key = analysisData.s3Key;
  }

  if (analysisData.journeyId) {
    insertData.journey_id = analysisData.journeyId;
  }

if (analysisData.videoHash) {
  insertData.video_hash = analysisData.videoHash;
}

if (analysisData.videoDurationSeconds !== undefined) {
  insertData.video_duration_seconds = analysisData.videoDurationSeconds;
}

if (analysisData.videoWidth !== undefined) {
  insertData.video_width = analysisData.videoWidth;
}

if (analysisData.videoHeight !== undefined) {
  insertData.video_height = analysisData.videoHeight;
}

if (analysisData.aiModelVersion) {
  insertData.ai_model_version = analysisData.aiModelVersion;
}

if (analysisData.metricsVersion) {
  insertData.metrics_version = analysisData.metricsVersion;
}

if (analysisData.rawMetrics) {
  insertData.raw_metrics = analysisData.rawMetrics;
}

  if (analysisData.recordingPrompt) {
    insertData.recording_prompt_id = analysisData.recordingPrompt.id || null;
    insertData.recording_prompt_title = analysisData.recordingPrompt.title || null;
    insertData.recording_prompt_description = analysisData.recordingPrompt.description || null;
    insertData.recording_prompt_target_metric = analysisData.recordingPrompt.targetMetric || null;
    insertData.recording_action_item_id = analysisData.recordingPrompt.actionItemId || null;
  }

  console.log('Inserting analysis data:', {
    userId,
    videoFilename: analysisData.videoFilename,
    hasS3Key: !!analysisData.s3Key,
    s3Key: analysisData.s3Key || 'NULL',
    resultLength: analysisData.analysisResult?.length || 0
  });

  const removableColumns = [
    'recording_prompt_id',
    'recording_prompt_title',
    'recording_prompt_description',
    'recording_prompt_target_metric',
    'recording_action_item_id',
    's3_key',
    'video_hash',
    'video_duration_seconds',
    'video_width',
    'video_height',
    'ai_model_version',
    'metrics_version',
    'raw_metrics'
  ];

  let attemptData = { ...insertData };
  let data = null;

  while (true) {
    const result = await supabase
      .from('analyses')
      .insert(attemptData)
      .select('id, created_at, s3_key, recording_prompt_id')
      .single();

    if (!result.error) {
      data = result.data;
      break;
    }

    const missingColumn = removableColumns.find(col => result.error.message?.includes(col));
    if (missingColumn) {
      console.warn(`⚠️  ${missingColumn} column not found in database! Please run the latest migration.`);
      const { [missingColumn]: _, ...rest } = attemptData;
      attemptData = rest;
      continue;
    }

    console.error('Error saving analysis to Supabase:', result.error);
    console.error('Error code:', result.error.code);
    console.error('Error message:', result.error.message);
    console.error('Error details:', result.error.details);
    console.error('Error hint:', result.error.hint);
    throw new Error(`Failed to save analysis: ${result.error.message} (code: ${result.error.code})`);
  }

  console.log('Analysis saved successfully:', data);
  return data;
};

/**
 * Get user's analyses
 */
export const getUserAnalyses = async (clerkUserId, limit = 50, journeyId = null) => {
  if (!supabase) {
    return [];
  }

  // First get user ID
  const userId = await getOrCreateUser(clerkUserId);

  // Then get analyses
  let query = supabase
    .from('analyses')
    .select('id, video_filename, video_size, mime_type, s3_key, user_context, analysis_result, created_at, recording_prompt_id, recording_prompt_title, recording_prompt_description, recording_prompt_target_metric, recording_action_item_id')
    .eq('user_id', userId);

  if (journeyId) {
    query = query.eq('journey_id', journeyId);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching analyses:', error);
    return [];
  }

  return data || [];
};

/**
 * Get single analysis by ID
 */
export const getAnalysisById = async (analysisId, clerkUserId) => {
  if (!supabase) {
    return null;
  }

  // First get user ID
  const userId = await getOrCreateUser(clerkUserId);

  const { data, error } = await supabase
    .from('analyses')
    .select('id, video_filename, video_size, mime_type, s3_key, user_context, analysis_result, created_at, updated_at, recording_prompt_id, recording_prompt_title, recording_prompt_description, recording_prompt_target_metric, recording_action_item_id')
    .eq('id', analysisId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }

  return data;
};

export const findAnalysisByVideoHash = async (clerkUserId, videoHash) => {
  if (!supabase || !clerkUserId || !videoHash) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);

  const { data, error } = await supabase
    .from('analyses')
    .select('id, created_at, video_filename')
    .eq('user_id', userId)
    .eq('video_hash', videoHash)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking duplicate video hash:', error);
    return null;
  }

  return data || null;
};

/**
 * Save communication metrics for an analysis (with sub-metrics)
 */
export const saveCommunicationMetrics = async (userId, analysisId, metrics, journeyId = null) => {
  if (!supabase) {
    console.warn('Supabase not configured, skipping metrics save');
    return null;
  }

  // Build insert object with all fields
  const insertData = {
    user_id: userId,
    analysis_id: analysisId,
    // Main category scores
    presence: metrics.presence,
    voice_expression: metrics.voice_expression,
    clarity: metrics.clarity,
    authenticity: metrics.authenticity,
    impact: metrics.impact,
    confidence: metrics.confidence,
    overall_score: metrics.overall_score,
    stage_title: metrics.stage_title,
    // Sub-scores JSONB
    sub_scores: metrics.subScores || null,
    sub_score_evidence: metrics.subScoreEvidence || null,
    validation_metadata: metrics.validationMetadata || null
  };

  if (metrics.modelVersion) {
    insertData.model_version = metrics.modelVersion;
  }

  if (metrics.processorVersion) {
    insertData.processor_version = metrics.processorVersion;
  }

  // Add sub-metrics if provided
  if (metrics.subScores) {
    // VOICE sub-metrics
    if (metrics.subScores.voice) {
      insertData.voice_volume_stability = metrics.subScores.voice.volume_stability;
      insertData.voice_tone_variation = metrics.subScores.voice.tone_variation;
      insertData.voice_pace_control = metrics.subScores.voice.pace_control;
      insertData.voice_articulation = metrics.subScores.voice.articulation;
      insertData.voice_warmth = metrics.subScores.voice.warmth;
    }
    
    // PRESENCE sub-metrics
    if (metrics.subScores.presence) {
      insertData.presence_eye_contact = metrics.subScores.presence.eye_contact;
      insertData.presence_facial_relaxation = metrics.subScores.presence.facial_relaxation;
      insertData.presence_body_posture = metrics.subScores.presence.body_posture;
      insertData.presence_hand_naturalness = metrics.subScores.presence.hand_naturalness;
      insertData.presence_openness = metrics.subScores.presence.openness;
    }
    
    // CLARITY sub-metrics
    if (metrics.subScores.clarity) {
      insertData.clarity_structure = metrics.subScores.clarity.structure;
      insertData.clarity_focus = metrics.subScores.clarity.focus;
      insertData.clarity_example_usage = metrics.subScores.clarity.example_usage;
      insertData.clarity_transition_quality = metrics.subScores.clarity.transition_quality;
      insertData.clarity_repetition_control = metrics.subScores.clarity.repetition_control;
    }
    
    // AUTHENTICITY sub-metrics
    if (metrics.subScores.authenticity) {
      insertData.authenticity_naturalness = metrics.subScores.authenticity.naturalness;
      insertData.authenticity_emotional_transparency = metrics.subScores.authenticity.emotional_transparency;
      insertData.authenticity_forced_expression_reduction = metrics.subScores.authenticity.forced_expression_reduction;
    }
    
    // IMPACT sub-metrics
    if (metrics.subScores.impact) {
      insertData.impact_energy = metrics.subScores.impact.energy;
      insertData.impact_engagement = metrics.subScores.impact.engagement;
      insertData.impact_persuasiveness = metrics.subScores.impact.persuasiveness;
    }
    
    // CONFIDENCE sub-metrics
    if (metrics.subScores.confidence) {
      insertData.confidence_filler_word_control = metrics.subScores.confidence.filler_word_control;
      insertData.confidence_pause_control = metrics.subScores.confidence.pause_control;
      insertData.confidence_physical_tension = metrics.subScores.confidence.physical_tension;
      insertData.confidence_vocal_stability = metrics.subScores.confidence.vocal_stability;
      insertData.confidence_comfort_level = metrics.subScores.confidence.comfort_level;
    }
  }

  if (journeyId) {
    insertData.journey_id = journeyId;
  }

  if (metrics.delivery) {
    const delivery = metrics.delivery;
    const speakingRate = coerceNumber(
      delivery.speaking_rate_wpm ??
      delivery.speakingRate ??
      delivery.speaking_rate
    );
    if (speakingRate !== null) {
      insertData.speaking_rate_wpm = Math.round(speakingRate);
    }
    const fillerWords = coerceInteger(
      delivery.filler_word_count ??
      delivery.fillerCount ??
      delivery.filler_words
    );
    if (fillerWords !== null) {
      insertData.filler_word_count = fillerWords;
    }
    const sentiment = delivery.sentiment_label || delivery.sentiment || null;
    if (sentiment) {
      insertData.sentiment_label = sentiment;
    }
    const posture = delivery.posture_flag || delivery.posture || null;
    if (posture) {
      insertData.posture_flag = posture;
    }
  }

  const { data, error } = await supabase
    .from('communication_metrics')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error saving communication metrics:', error);
    return null;
  }

  return data;
};

/**
 * Save communication insights
 */
export const saveCommunicationInsights = async (userId, analysisId, insights, journeyId = null) => {
  if (!supabase || !insights || insights.length === 0) {
    return [];
  }

  const insightsToInsert = insights.map(insight => ({
    user_id: userId,
    analysis_id: analysisId,
    insight_type: 'ai_generated',
    content: insight,
    journey_id: journeyId || null
  }));

  const { data, error } = await supabase
    .from('communication_insights')
    .insert(insightsToInsert)
    .select();

  if (error) {
    console.error('Error saving communication insights:', error);
    return [];
  }

  return data || [];
};

/**
 * Save action items from analysis (with duplicate checking)
 */
export const saveActionItems = async (userId, analysisId, actionItems, options = {}) => {
  if (!supabase || !actionItems || actionItems.length === 0) {
    return [];
  }

  const savedItems = [];
  const itemsNeedingPrompts = [];
  const shouldGeneratePrompts = options.generatePracticePrompts !== false;
  const maxItems = options.maxActionItems ?? 1;
  const itemsToProcess = actionItems.slice(0, maxItems);

  for (const action of itemsToProcess) {
    // Skip intro text items
    if (action.isIntro) {
      continue;
    }

    const title = action.title || '';
    if (!title || title.length < 5) {
      continue;
    }

    // Check for duplicate by title AND analysis_id (only skip if same action item from same analysis)
    const normalizedTitle = title.trim().toLowerCase();
    
    // Check if this exact action item already exists for this analysis
    const { data: existingItems } = await supabase
      .from('action_items')
      .select('id, status, title, analysis_id')
      .eq('user_id', userId)
      .eq('analysis_id', analysisId);
    
    // Check if a similar title exists in THIS analysis (case-insensitive)
    const existing = existingItems?.find(item => 
      item.title.trim().toLowerCase() === normalizedTitle
    );

    if (existing) {
      // Duplicate found in the same analysis - skip to avoid duplicates
      console.log(`Skipping duplicate action item from same analysis: ${title}`);
      continue;
    }
    
    // Allow same action items from different analyses - they might be relevant for different videos

    // Prepare details object
    const details = {
      what_to_do: null,
      why_it_matters: null,
      example: null,
      all_details: action.details || []
    };

    // Try to parse details if they exist
    if (action.details && action.details.length > 0) {
      action.details.forEach((detail, idx) => {
        const lowerDetail = detail.toLowerCase();
        if (lowerDetail.includes('what to do') || idx === 0) {
          details.what_to_do = detail;
        } else if (lowerDetail.includes('why it matters') || lowerDetail.includes('why')) {
          details.why_it_matters = detail;
        } else if (lowerDetail.includes('example')) {
          details.example = detail;
        }
      });
    }

    const inferredMetric = inferTargetMetricFromTitle(title);
    const targetMetric = options.focusMetricKey || inferredMetric;

    const insertPayload = {
      user_id: userId,
      analysis_id: analysisId,
      title: title,
      details: details,
      status: 'pending',
      practice_prompt_title: null,
      practice_prompt_description: null,
      practice_prompt_setup: null,
      practice_prompt_notice: null,
      practice_prompt_tip: null,
      practice_prompt_target_metric: targetMetric,
      practice_prompt_difficulty: null,
      practice_prompt_time: null,
      practice_prompt_version: null,
      practice_prompt_source: null,
      practice_prompt_generated: false,
      journey_id: options.journeyId || null
    };

    let data = null;
    let error = null;
    const removableColumns = [
      'practice_prompt_title',
      'practice_prompt_description',
      'practice_prompt_setup',
      'practice_prompt_notice',
      'practice_prompt_tip',
      'practice_prompt_source',
      'practice_prompt_generated',
      'practice_prompt_target_metric',
      'practice_prompt_difficulty',
      'practice_prompt_time',
      'practice_prompt_version'
    ];

    let attemptPayload = { ...insertPayload };
    while (true) {
      const result = await supabase
        .from('action_items')
        .insert(attemptPayload)
        .select()
        .single();

      if (!result.error) {
        data = result.data;
        break;
      }

      const missingColumn = removableColumns.find(col => result.error.message?.includes(col));
      if (missingColumn) {
        console.warn(`⚠️  ${missingColumn} column missing on action_items. Please run migrations.`);
        const { [missingColumn]: _, ...rest } = attemptPayload;
        attemptPayload = rest;
        continue;
      }

      error = result.error;
      break;
    }

    if (error) {
      console.error('Error saving action item:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        title: title,
        userId: userId,
        analysisId: analysisId
      });
      continue;
    }

    if (data) {
      console.log(`Successfully saved action item: "${title}" (ID: ${data.id})`);
      savedItems.push(data);
      if (shouldGeneratePrompts) {
        itemsNeedingPrompts.push({
          id: data.id,
          title,
          details,
          userContext: options.userContext || null,
          targetMetric
        });
      }
    } else {
      console.warn(`Action item "${title}" was not saved - no data returned`);
    }
  }

  if (shouldGeneratePrompts && itemsNeedingPrompts.length > 0) {
    console.log(`Generating practice prompts for ${itemsNeedingPrompts.length} action item(s)`);
    await generatePracticePromptsForItems(itemsNeedingPrompts);
  } else if (shouldGeneratePrompts) {
    console.log('No action items need practice prompts (shouldGeneratePrompts=true but itemsNeedingPrompts is empty)');
  }

  return savedItems;
};

const generatePracticePromptsForItems = async (items) => {
  if (!supabase || !items || items.length === 0) {
    return;
  }

  for (const item of items) {
    try {
      const prompt =
        await generatePromptWithRetry(item) ||
        buildFallbackPracticePrompt(item);

      if (prompt) {
        console.log(`Updating action item ${item.id} with practice prompt: ${prompt.title}`);
        const updateResult = await supabase
          .from('action_items')
          .update({
            practice_prompt_title: prompt.title,
            practice_prompt_description: prompt.description,
            practice_prompt_setup: prompt.setup || null,
            practice_prompt_notice: prompt.whatToNotice || null,
            practice_prompt_tip: prompt.recordingTip || null,
            practice_prompt_source: prompt.source || 'ai',
            practice_prompt_generated: true,
            practice_prompt_target_metric: prompt.targetMetric || 'overall',
            practice_prompt_difficulty: prompt.difficulty || null,
            practice_prompt_time: prompt.estimatedTime || null,
            practice_prompt_version: prompt.version || null
          })
          .eq('id', item.id);
        
        if (updateResult.error) {
          console.error(`Failed to update practice prompt for action item ${item.id}:`, updateResult.error);
        } else {
          console.log(`Successfully updated practice prompt for action item ${item.id}`);
        }
      } else {
        console.warn(`No practice prompt (AI or fallback) generated for action item ${item.id}`);
      }
    } catch (err) {
      console.error(`Failed to generate practice prompt for action item ${item.id}:`, err.message || err);
    }
  }
};

const generatePromptWithRetry = async (item, maxAttempts = 3) => {
  const difficulty = deriveDifficultyFromContext(item.userContext);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const prompt = await generatePracticePromptFromAction({
        title: item.title,
        details: item.details || {},
        userContext: item.userContext || {},
        targetMetric: item.targetMetric || inferTargetMetricFromTitle(item.title),
        difficulty,
        estimatedTime: '2 minutes',
        previousTitles: [] // TODO: fetch existing practice prompts history
      });

      if (prompt) {
        return prompt;
      }
      console.warn(`Prompt generation returned empty result (attempt ${attempt}/${maxAttempts}) for action item ${item.id}`);
    } catch (err) {
      console.error(`Prompt generation failed (attempt ${attempt}/${maxAttempts}) for action item ${item.id}:`, err.message || err);
    }

    if (attempt < maxAttempts) {
      const backoff = 500 * attempt;
      await sleep(backoff);
    }
  }
  return null;
};

const buildFallbackPracticePrompt = (item) => {
  const title = item.title || 'Practice Focus';
  const details = item.details || {};
  const whatToDo = details.what_to_do || (Array.isArray(details.all_details) ? details.all_details[0] : null);
  const description = `Record a 90-second video practicing "${title}". Explain the main message, then rehearse it once more with improved delivery.`;

  return {
    title: `Rehearse: ${title}`,
    description,
    setup: 'Place your phone or laptop camera at eye level, about an arm’s length away. Stand or sit upright with good lighting.',
    whatToNotice: details.why_it_matters || 'Pay attention to eye contact, vocal energy, and whether your gestures support the message.',
    recordingTip: whatToDo || 'Speak with intention, pause briefly between key points, and keep your gestures purposeful.',
    targetMetric: item.targetMetric || inferTargetMetricFromTitle(title) || 'overall',
    difficulty: 'intermediate',
    estimatedTime: '90 seconds',
    version: 1,
    source: 'fallback'
  };
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const inferTargetMetricFromTitle = (title = '') => {
  const lower = title.toLowerCase();
  if (lower.includes('voice') || lower.includes('vocal')) return 'voice_expression';
  if (lower.includes('eye') || lower.includes('presence')) return 'presence';
  if (lower.includes('clarity') || lower.includes('structure')) return 'clarity';
  if (lower.includes('authentic')) return 'authenticity';
  if (lower.includes('impact') || lower.includes('energy') || lower.includes('persuasive')) return 'impact';
  if (lower.includes('confidence') || lower.includes('calm')) return 'confidence';
  return 'overall';
};

const deriveDifficultyFromContext = (userContext) => {
  const confidence = userContext?.confidenceLevel;
  if (confidence === 'very-low' || confidence === 'low') return 'beginner';
  if (confidence === 'high' || confidence === 'very-high') return 'advanced';
  return 'intermediate';
};

/**
 * Get user's action items (To-Do List)
 */
export const getUserActionItems = async (clerkUserId, status = null, journeyId = null) => {
  if (!supabase) {
    return [];
  }

  const userId = await getOrCreateUser(clerkUserId);

  let query = supabase
    .from('action_items')
    .select(`
      *,
      analyses:analysis_id (
        id,
        video_filename,
        created_at
      )
    `)
    .eq('user_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  if (journeyId) {
    query = query.eq('journey_id', journeyId);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching action items:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return [];
  }

  console.log(`getUserActionItems: Found ${data?.length || 0} action items for user ${clerkUserId} (status: ${status || 'all'})`);
  if (data && data.length > 0) {
    console.log('Action items titles:', data.map(item => item.title));
  }

  return data || [];
};

export const saveSelfReflection = async (clerkUserId, reflection = {}) => {
  if (!supabase || !clerkUserId) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);
  const insertPayload = {
    user_id: userId,
    confidence_rating: reflection.confidenceRating || reflection.confidence_rating || null,
    mood_label: reflection.mood || reflection.mood_label || null,
    notes: reflection.notes || null,
    analysis_id: reflection.analysisId || reflection.analysis_id || null,
    journey_id: reflection.journeyId || reflection.journey_id || null
  };

  const { data, error } = await supabase
    .from('self_reflections')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('Error saving self reflection:', error);
    return null;
  }

  return data;
};

export const getSelfReflections = async (clerkUserId, limit = 20, journeyId = null) => {
  if (!supabase || !clerkUserId) {
    return [];
  }

  const userId = await getOrCreateUser(clerkUserId);
  let query = supabase
    .from('self_reflections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (journeyId) {
    query = query.eq('journey_id', journeyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching self reflections:', error);
    return [];
  }

  return data || [];
};

export const getReflectionForAnalysis = async (clerkUserId, analysisId) => {
  if (!supabase || !clerkUserId || !analysisId) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);
  const { data, error } = await supabase
    .from('self_reflections')
    .select('*')
    .eq('user_id', userId)
    .eq('analysis_id', analysisId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching analysis reflection:', error);
    return null;
  }

  return data || null;
};

/**
 * Update action item status
 */
export const updateActionItemStatus = async (clerkUserId, actionItemId, status) => {
  if (!supabase) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);

  const updateData = {
    status: status,
    updated_at: new Date().toISOString()
  };

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  } else {
    updateData.completed_at = null;
  }

  const { data, error } = await supabase
    .from('action_items')
    .update(updateData)
    .eq('id', actionItemId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating action item status:', error);
    return null;
  }

  return data;
};

/**
 * Check and unlock achievements for a user
 */
export const checkAndUnlockAchievements = async (userId, metrics) => {
  if (!supabase) {
    return [];
  }

  const unlocked = [];

  // Get all available achievements
  const { data: achievements, error: achievementsError } = await supabase
    .from('communication_achievements')
    .select('*');

  if (achievementsError || !achievements) {
    console.error('Error fetching achievements:', achievementsError);
    return [];
  }

  // Get user's existing achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const existingAchievementIds = new Set(
    (userAchievements || []).map(ua => ua.achievement_id)
  );

  // Get user's recent metrics for trend analysis
  const { data: recentMetrics } = await supabase
    .from('communication_metrics')
    .select('presence, authenticity, overall_score')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);

  for (const achievement of achievements) {
    // Skip if already unlocked
    if (existingAchievementIds.has(achievement.id)) {
      continue;
    }

    let shouldUnlock = false;

    switch (achievement.achievement_key) {
      case 'eye_contact_master':
        // presence > 8 for 3 sessions
        if (recentMetrics && recentMetrics.length >= 3) {
          shouldUnlock = recentMetrics.every(m => m.presence > 8);
        }
        break;

      case 'confident_speaker':
        // overall_score > 80
        if (metrics.overall_score > 80) {
          shouldUnlock = true;
        }
        break;

      case 'natural_flow':
        // authenticity steadily rising
        if (recentMetrics && recentMetrics.length >= 3) {
          const authValues = recentMetrics.map(m => m.authenticity).reverse();
          shouldUnlock = authValues[0] < authValues[1] && authValues[1] < authValues[2];
        }
        break;
    }

    if (shouldUnlock) {
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          metadata: { unlocked_via: 'automatic_check' }
        })
        .select()
        .single();

      if (!error && data) {
        unlocked.push(achievement);
      }
    }
  }

  return unlocked;
};

/**
 * Get user's communication metrics (for progress chart)
 */
export const getUserCommunicationMetrics = async (clerkUserId, limit = 20, journeyId = null) => {
  if (!supabase) {
    return [];
  }

  const userId = await getOrCreateUser(clerkUserId);

  let query = supabase
    .from('communication_metrics')
    .select(`
      *,
      analyses:analysis_id (
        id,
        video_filename,
        created_at
      )
    `)
    .eq('user_id', userId);

  if (journeyId) {
    query = query.eq('journey_id', journeyId);
  }

  const { data, error } = await query
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching communication metrics:', error);
    return [];
  }

  return data || [];
};

export const deleteAnalysisForUser = async (clerkUserId, analysisId) => {
  if (!supabase || !analysisId) {
    return false;
  }

  const userId = await getOrCreateUser(clerkUserId);

  await supabase.from('communication_metrics').delete().eq('analysis_id', analysisId).eq('user_id', userId);
  await supabase.from('communication_insights').delete().eq('analysis_id', analysisId).eq('user_id', userId);
  await supabase.from('action_items').delete().eq('analysis_id', analysisId).eq('user_id', userId);

  const { error } = await supabase
    .from('analyses')
    .delete()
    .eq('id', analysisId)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to delete analysis:', error);
    return false;
  }

  return true;
};

/**
 * Get user's communication insights (journal)
 */
export const getUserCommunicationInsights = async (clerkUserId, limit = 50, journeyId = null) => {
  if (!supabase) {
    return [];
  }

  const userId = await getOrCreateUser(clerkUserId);

  let query = supabase
    .from('communication_insights')
    .select(`
      *,
      analyses:analysis_id (
        id,
        video_filename,
        created_at
      )
    `)
    .eq('user_id', userId);

  if (journeyId) {
    query = query.eq('journey_id', journeyId);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching communication insights:', error);
    return [];
  }

  return data || [];
};

/**
 * Get user's achievements
 */
export const getUserAchievements = async (clerkUserId) => {
  if (!supabase) {
    return [];
  }

  const userId = await getOrCreateUser(clerkUserId);

  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievement:achievement_id (
        id,
        achievement_key,
        title,
        description,
        icon
      )
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }

  return data || [];
};

/**
 * Get user's latest communication profile (for dashboard)
 */
export const getUserCommunicationProfile = async (clerkUserId, journeyId = null) => {
  if (!supabase) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);

  // Get latest metrics
  let metricsQuery = supabase
    .from('communication_metrics')
    .select('*')
    .eq('user_id', userId);

  if (journeyId) {
    metricsQuery = metricsQuery.eq('journey_id', journeyId);
  }

  const { data: latestMetrics, error: metricsError } = await metricsQuery
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (metricsError && metricsError.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error fetching latest metrics:', metricsError);
  }

  // Get latest insight
  let insightQuery = supabase
    .from('communication_insights')
    .select('*')
    .eq('user_id', userId);

  if (journeyId) {
    insightQuery = insightQuery.eq('journey_id', journeyId);
  }

  const { data: latestInsight, error: insightError } = await insightQuery
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (insightError && insightError.code !== 'PGRST116') {
    console.error('Error fetching latest insight:', insightError);
  }

  return {
    latest_metrics: latestMetrics,
    latest_insight: latestInsight
  };
};

/**
 * Get user's personal baseline
 */
export const getUserBaseline = async (clerkUserId) => {
  if (!supabase) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);

  const { data, error } = await supabase
    .from('user_baselines')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error fetching user baseline:', error);
    return null;
  }

  return data;
};

/**
 * Calculate and save user baseline from their first 2-3 analyses
 */
export const calculateUserBaseline = async (clerkUserId, minAnalyses = 2) => {
  if (!supabase) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);

  // Get user's metrics (ordered by creation date)
  const { data: metrics, error: metricsError } = await supabase
    .from('communication_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(3);

  if (metricsError) {
    console.error('Error fetching metrics for baseline:', metricsError);
    return null;
  }

  if (!metrics || metrics.length < minAnalyses) {
    // Not enough analyses yet
    return null;
  }

  // Calculate baseline for each sub-metric
  const baselineData = {
    user_id: userId,
    analyses_count: metrics.length,
    baselines_json: {},
    confidence_score: metrics.length >= 3 ? 0.9 : 0.7, // More confident with 3+ analyses
    is_stable: metrics.length >= 3
  };

  // List of all sub-metric keys
  const subMetricKeys = [
    // VOICE
    'voice_volume_stability', 'voice_tone_variation', 'voice_pace_control',
    'voice_articulation', 'voice_warmth',
    // PRESENCE
    'presence_eye_contact', 'presence_facial_relaxation', 'presence_body_posture',
    'presence_hand_naturalness', 'presence_openness',
    // CLARITY
    'clarity_structure', 'clarity_focus', 'clarity_example_usage',
    'clarity_transition_quality', 'clarity_repetition_control',
    // AUTHENTICITY
    'authenticity_naturalness', 'authenticity_emotional_transparency',
    'authenticity_forced_expression_reduction',
    // IMPACT
    'impact_energy', 'impact_engagement', 'impact_persuasiveness',
    // CONFIDENCE
    'confidence_filler_word_control', 'confidence_pause_control',
    'confidence_physical_tension', 'confidence_vocal_stability', 'confidence_comfort_level'
  ];

  // Calculate average for each sub-metric
  subMetricKeys.forEach(key => {
    const values = metrics
      .map(m => {
        // Try to get from column first, then from JSONB
        return m[key] || m.sub_scores?.[key.split('_')[0]]?.[key.split('_').slice(1).join('_')];
      })
      .filter(v => v !== null && v !== undefined && !isNaN(v))
      .map(v => parseFloat(v));

    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      baselineData[`${key}_baseline`] = avg;
      baselineData.baselines_json[key] = avg;
    }
  });

  // Check if baseline already exists
  const { data: existing } = await supabase
    .from('user_baselines')
    .select('id')
    .eq('user_id', userId)
    .single();

  let result;
  if (existing) {
    // Update existing baseline
    // Save snapshot to history first
    const { data: currentBaseline } = await supabase
      .from('user_baselines')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (currentBaseline) {
      await supabase
        .from('user_baseline_history')
        .insert({
          user_id: userId,
          baseline_snapshot: currentBaseline.baselines_json || {},
          analyses_count: currentBaseline.analyses_count
        });
    }

    // Update baseline
    const { data, error } = await supabase
      .from('user_baselines')
      .update(baselineData)
      .eq('user_id', userId)
      .select()
      .single();

    result = data;
    if (error) {
      console.error('Error updating user baseline:', error);
      return null;
    }
  } else {
    // Create new baseline
    const { data, error } = await supabase
      .from('user_baselines')
      .insert(baselineData)
      .select()
      .single();

    result = data;
    if (error) {
      console.error('Error creating user baseline:', error);
      return null;
    }
  }

  return result;
};

/**
 * Update user baseline with new analysis (rolling average)
 */
export const updateUserBaseline = async (clerkUserId, newMetrics, rollingWindow = 5) => {
  if (!supabase) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);

  // Get recent metrics for rolling average
  const { data: recentMetrics } = await supabase
    .from('communication_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(rollingWindow);

  if (!recentMetrics || recentMetrics.length === 0) {
    return null;
  }

  // Recalculate baseline using rolling window
  return await calculateUserBaseline(clerkUserId, 1); // Will use all available metrics
};

/**
 * Get global statistics for a specific sub-metric
 */
export const getGlobalStats = async (subMetricKey) => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('global_stats')
    .select('*')
    .eq('sub_metric_key', subMetricKey)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching global stats:', error);
    return null;
  }

  return data;
};

/**
 * Get all global statistics (cached map)
 */
export const getAllGlobalStats = async () => {
  if (!supabase) {
    return {};
  }

  const { data, error } = await supabase
    .from('global_stats')
    .select('*');

  if (error) {
    console.error('Error fetching all global stats:', error);
    return {};
  }

  // Convert to map for easy lookup
  const statsMap = {};
  (data || []).forEach(stat => {
    statsMap[stat.sub_metric_key] = stat;
  });

  return statsMap;
};

/**
 * Calculate global statistics for all sub-metrics
 * This should be run as a background job (weekly/monthly)
 */
export const calculateGlobalStats = async () => {
  if (!supabase) {
    return null;
  }

  // Get all sub-metric keys
  const subMetricKeys = [
    'voice_volume_stability', 'voice_tone_variation', 'voice_pace_control',
    'voice_articulation', 'voice_warmth',
    'presence_eye_contact', 'presence_facial_relaxation', 'presence_body_posture',
    'presence_hand_naturalness', 'presence_openness',
    'clarity_structure', 'clarity_focus', 'clarity_example_usage',
    'clarity_transition_quality', 'clarity_repetition_control',
    'authenticity_naturalness', 'authenticity_emotional_transparency',
    'authenticity_forced_expression_reduction',
    'impact_energy', 'impact_engagement', 'impact_persuasiveness',
    'confidence_filler_word_control', 'confidence_pause_control',
    'confidence_physical_tension', 'confidence_vocal_stability', 'confidence_comfort_level'
  ];

  const results = {};

  for (const key of subMetricKeys) {
    // Get all values for this sub-metric
    const { data: metrics } = await supabase
      .from('communication_metrics')
      .select(`${key}, sub_scores`);

    if (!metrics || metrics.length === 0) {
      continue;
    }

    // Extract values
    const values = metrics
      .map(m => {
        // Try column first, then JSONB
        return m[key] || m.sub_scores?.[key.split('_')[0]]?.[key.split('_').slice(1).join('_')];
      })
      .filter(v => v !== null && v !== undefined && !isNaN(v))
      .map(v => parseFloat(v))
      .sort((a, b) => a - b);

    if (values.length === 0) {
      continue;
    }

    // Calculate statistics
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const median = values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];

    // Standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Percentiles
    const percentile25 = values[Math.floor(values.length * 0.25)];
    const percentile50 = median;
    const percentile75 = values[Math.floor(values.length * 0.75)];
    const percentile90 = values[Math.floor(values.length * 0.90)];

    const statsData = {
      sub_metric_key: key,
      mean_value: mean,
      median_value: median,
      std_deviation: stdDev,
      percentile_25: percentile25,
      percentile_50: percentile50,
      percentile_75: percentile75,
      percentile_90: percentile90,
      sample_count: values.length,
      calculation_method: 'trimmed_mean',
      stats_json: {
        mean: mean,
        median: median,
        std: stdDev,
        percentiles: {
          p25: percentile25,
          p50: percentile50,
          p75: percentile75,
          p90: percentile90
        },
        sample_count: values.length
      }
    };

    // Save or update
    const { data: existing } = await supabase
      .from('global_stats')
      .select('id')
      .eq('sub_metric_key', key)
      .single();

    if (existing) {
      // Save to history first
      const { data: currentStats } = await supabase
        .from('global_stats')
        .select('*')
        .eq('sub_metric_key', key)
        .single();

      if (currentStats) {
        await supabase
          .from('global_stats_history')
          .insert({
            sub_metric_key: key,
            stats_snapshot: currentStats.stats_json || {},
            sample_count: currentStats.sample_count
          });
      }

      // Update
      const { data, error } = await supabase
        .from('global_stats')
        .update(statsData)
        .eq('sub_metric_key', key)
        .select()
        .single();

      if (error) {
        console.error(`Error updating global stats for ${key}:`, error);
      } else {
        results[key] = data;
      }
    } else {
      // Insert
      const { data, error } = await supabase
        .from('global_stats')
        .insert(statsData)
        .select()
        .single();

      if (error) {
        console.error(`Error creating global stats for ${key}:`, error);
      } else {
        results[key] = data;
      }
    }
  }

  return results;
};

/**
 * Get user's previous metrics for trend analysis
 */
export const getUserPreviousMetrics = async (clerkUserId, limit = 3) => {
  if (!supabase) {
    return [];
  }

  const userId = await getOrCreateUser(clerkUserId);

  const { data, error } = await supabase
    .from('communication_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching previous metrics:', error);
    return [];
  }

  return (data || []).reverse(); // Return in chronological order
};

/**
 * Get weekly practice count for a user
 * Returns count of analyses in the current week (Monday-Sunday)
 */
export const getWeeklyPracticeCount = async (clerkUserId, journeyId = null) => {
  if (!supabase) {
    return { count: 0, weekStart: null, weekEnd: null };
  }

  const userId = await getOrCreateUser(clerkUserId);
  if (!userId) {
    return { count: 0, weekStart: null, weekEnd: null };
  }

  // Calculate current week (Monday to Sunday)
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  let query = supabase
    .from('analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', weekStart.toISOString())
    .lte('created_at', weekEnd.toISOString());

  if (journeyId) {
    query = query.eq('journey_id', journeyId);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error counting weekly practices:', error);
    return { count: 0, weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString() };
  }

  return {
    count: count || 0,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString()
  };
};

/**
 * Check if user is behind on their practice commitment
 * Returns status with recommendation
 */
export const checkPracticeCommitmentStatus = async (clerkUserId, journeyId = null) => {
  if (!supabase) {
    return { isBehind: false, message: null, currentCount: 0, targetCount: 0 };
  }

  // Get user's journey to find commitment level
  const journey = journeyId 
    ? await getJourneyForUser(clerkUserId, journeyId)
    : await getDefaultJourneyForUser(clerkUserId);

  if (!journey || !journey.practice_commitment) {
    return { isBehind: false, message: null, currentCount: 0, targetCount: 0 };
  }

  const commitment = journey.practice_commitment;
  
  // Map commitment to target count per week
  const commitmentTargets = {
    'light': 1,
    'standard': 2,
    'intense': 3
  };

  const targetCount = commitmentTargets[commitment] || 0;
  
  if (targetCount === 0) {
    return { isBehind: false, message: null, currentCount: 0, targetCount: 0 };
  }

  // Get current week's practice count
  const weeklyCount = await getWeeklyPracticeCount(clerkUserId, journeyId);
  const currentCount = weeklyCount.count;

  // Check if behind (only alert if we're past mid-week and behind)
  const now = new Date();
  const weekStart = new Date(weeklyCount.weekStart);
  const daysIntoWeek = Math.floor((now - weekStart) / (1000 * 60 * 60 * 24));
  
  // Only show alert if we're past Wednesday (day 3) and behind
  const isBehind = daysIntoWeek >= 3 && currentCount < targetCount;
  
  let message = null;
  if (isBehind) {
    const remaining = targetCount - currentCount;
    const commitmentLabel = commitment === 'standard' ? '2 sessions' : commitment === 'intense' ? '3 sessions' : '1 session';
    message = `You committed to ${commitmentLabel} per week, but you've only completed ${currentCount} this week. ${remaining} more ${remaining === 1 ? 'session' : 'sessions'} ${remaining === 1 ? 'is' : 'are'} needed to stay on track!`;
  }

  return {
    isBehind,
    message,
    currentCount,
    targetCount,
    commitment,
    daysIntoWeek,
    weekStart: weeklyCount.weekStart,
    weekEnd: weeklyCount.weekEnd
  };
};

