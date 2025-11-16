import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

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
    .select('id, primary_goal, confidence_level, goal_specific_context, onboarding_completed_at, subscription_type, subscription_status, free_analysis_used')
    .eq('clerk_user_id', clerkUserId)
    .single();

  // If column doesn't exist, retry without it
  if (error && error.code === '42703' && error.message?.includes('goal_specific_context')) {
    console.warn('goal_specific_context column does not exist, fetching without it. Please run migration.');
    const retryResult = await supabase
      .from('users')
      .select('id, primary_goal, confidence_level, onboarding_completed_at, subscription_type, subscription_status, free_analysis_used')
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

  // Build insert data - start without s3_key (column might not exist yet)
  const insertData = {
    user_id: userId,
    video_filename: analysisData.videoFilename,
    video_size: analysisData.videoSize,
    mime_type: analysisData.mimeType,
    user_context: analysisData.userContext,
    analysis_result: analysisData.analysisResult
  };

  // Try to add s3_key, but handle gracefully if column doesn't exist
  // We'll try to insert with s3_key, and if it fails, retry without it
  if (analysisData.s3Key !== undefined && analysisData.s3Key !== null) {
    insertData.s3_key = analysisData.s3Key;
  }

  console.log('Inserting analysis data:', {
    userId,
    videoFilename: analysisData.videoFilename,
    hasS3Key: !!analysisData.s3Key,
    resultLength: analysisData.analysisResult?.length || 0
  });

  // Try to insert with s3_key first
  let { data, error } = await supabase
    .from('analyses')
    .insert(insertData)
    .select('id, created_at, s3_key')
    .single();

  // If error is about missing s3_key column, retry without it
  if (error && (error.code === 'PGRST204' || error.message?.includes('s3_key'))) {
    console.warn('s3_key column not found, retrying without it...');
    // Remove s3_key from insert data
    const { s3_key, ...insertDataWithoutS3 } = insertData;
    const retryResult = await supabase
      .from('analyses')
      .insert(insertDataWithoutS3)
      .select('id, created_at')
      .single();
    
    if (retryResult.error) {
      console.error('Error saving analysis to Supabase (retry):', retryResult.error);
      console.error('Error code:', retryResult.error.code);
      console.error('Error message:', retryResult.error.message);
      throw new Error(`Failed to save analysis: ${retryResult.error.message} (code: ${retryResult.error.code})`);
    }
    
    data = retryResult.data;
    error = null;
    console.warn('⚠️  Analysis saved without s3_key column. Please run migration to add s3_key column.');
  } else if (error) {
    console.error('Error saving analysis to Supabase:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
    throw new Error(`Failed to save analysis: ${error.message} (code: ${error.code})`);
  }

  console.log('Analysis saved successfully:', data);
  return data;
};

/**
 * Get user's analyses
 */
export const getUserAnalyses = async (clerkUserId, limit = 50) => {
  if (!supabase) {
    return [];
  }

  // First get user ID
  const userId = await getOrCreateUser(clerkUserId);

  // Then get analyses
  const { data, error } = await supabase
    .from('analyses')
    .select('id, video_filename, video_size, mime_type, s3_key, user_context, analysis_result, created_at')
    .eq('user_id', userId)
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
    .select('id, video_filename, video_size, mime_type, s3_key, user_context, analysis_result, created_at, updated_at')
    .eq('id', analysisId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }

  return data;
};

/**
 * Save communication metrics for an analysis (with sub-metrics)
 */
export const saveCommunicationMetrics = async (userId, analysisId, metrics) => {
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
export const saveCommunicationInsights = async (userId, analysisId, insights) => {
  if (!supabase || !insights || insights.length === 0) {
    return [];
  }

  const insightsToInsert = insights.map(insight => ({
    user_id: userId,
    analysis_id: analysisId,
    insight_type: 'ai_generated',
    content: insight
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
export const saveActionItems = async (userId, analysisId, actionItems) => {
  if (!supabase || !actionItems || actionItems.length === 0) {
    return [];
  }

  const savedItems = [];

  for (const action of actionItems) {
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

    // Insert new action item
    const { data, error } = await supabase
      .from('action_items')
      .insert({
        user_id: userId,
        analysis_id: analysisId,
        title: title,
        details: details,
        status: 'pending'
      })
      .select()
      .single();

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
    } else {
      console.warn(`Action item "${title}" was not saved - no data returned`);
    }
  }

  return savedItems;
};

/**
 * Get user's action items (To-Do List)
 */
export const getUserActionItems = async (clerkUserId, status = null) => {
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
export const getUserCommunicationMetrics = async (clerkUserId, limit = 20) => {
  if (!supabase) {
    return [];
  }

  const userId = await getOrCreateUser(clerkUserId);

  const { data, error } = await supabase
    .from('communication_metrics')
    .select(`
      *,
      analyses:analysis_id (
        id,
        video_filename,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching communication metrics:', error);
    return [];
  }

  return data || [];
};

/**
 * Get user's communication insights (journal)
 */
export const getUserCommunicationInsights = async (clerkUserId, limit = 50) => {
  if (!supabase) {
    return [];
  }

  const userId = await getOrCreateUser(clerkUserId);

  const { data, error } = await supabase
    .from('communication_insights')
    .select(`
      *,
      analyses:analysis_id (
        id,
        video_filename,
        created_at
      )
    `)
    .eq('user_id', userId)
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
export const getUserCommunicationProfile = async (clerkUserId) => {
  if (!supabase) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);

  // Get latest metrics
  const { data: latestMetrics, error: metricsError } = await supabase
    .from('communication_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (metricsError && metricsError.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error fetching latest metrics:', metricsError);
  }

  // Get latest insight
  const { data: latestInsight } = await supabase
    .from('communication_insights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

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

