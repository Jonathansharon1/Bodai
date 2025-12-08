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
 * @param {string} clerkUserId - Clerk user ID
 * @param {Object} userProfile - Optional user profile data from Clerk
 * @param {string} userProfile.email - User email
 * @param {string} userProfile.firstName - User first name
 * @param {string} userProfile.lastName - User last name
 * @param {string} userProfile.phoneNumber - User phone number
 * @param {string} userProfile.imageUrl - User profile image URL
 * @returns {Promise<string>} User ID (UUID)
 */
export const getOrCreateUser = async (clerkUserId, userProfile = {}) => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  // Try to find existing user
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle(); // Use maybeSingle() to return null instead of error for 0 rows

  if (existingUser) {
    // Update user profile if provided (for syncing Clerk data)
    if (Object.keys(userProfile).length > 0) {
      await syncUserProfile(clerkUserId, userProfile);
    }
    return existingUser.id;
  }
  
  // If there was an actual error (not just "no rows"), throw it
  if (findError && findError.code !== 'PGRST116') {
    console.error('[getOrCreateUser] Error finding user:', findError);
    throw new Error(`Failed to find user: ${findError.message}`);
  }

  // Build full name from first and last name
  const fullName = userProfile.firstName && userProfile.lastName
    ? `${userProfile.firstName} ${userProfile.lastName}`.trim()
    : userProfile.firstName || userProfile.lastName || null;

  // Create new user if not found (default: free subscription)
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      clerk_user_id: clerkUserId,
      email: userProfile.email || null,
      first_name: userProfile.firstName || null,
      last_name: userProfile.lastName || null,
      full_name: fullName,
      phone: userProfile.phoneNumber || null,
      profile_image_url: userProfile.imageUrl || null,
      subscription_type: 'free',
      subscription_status: 'active',
      free_analysis_used: false,
      primary_goal: null,
      confidence_level: null
    })
    .select('id')
    .single();

  if (createError) {
    // Handle race condition: if unique constraint violation, user was created by another request
    // Try to fetch the existing user instead of throwing an error
    if (createError.code === '23505' || createError.message?.includes('duplicate') || createError.message?.includes('unique')) {
      console.log(`[getOrCreateUser] Race condition detected for ${clerkUserId}, fetching existing user`);
      const { data: raceUser, error: raceError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single();
      
      if (raceUser) {
        // Sync profile data for the existing user
        if (Object.keys(userProfile).length > 0) {
          await syncUserProfile(clerkUserId, userProfile);
        }
        return raceUser.id;
      }
      
      // If still can't find user, throw the original error
      throw new Error(`Failed to create user: ${createError.message}`);
    }
    
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  return newUser.id;
};

/**
 * Sync user profile data from Clerk
 * Updates user profile fields if they're missing or if new data is provided
 */
export const syncUserProfile = async (clerkUserId, userProfile = {}) => {
  if (!supabase || !clerkUserId || Object.keys(userProfile).length === 0) {
    return null;
  }

  try {
    // Get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, profile_image_url')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (fetchError || !existingUser) {
      console.warn('[syncUserProfile] User not found:', clerkUserId);
      return null;
    }

    // Build update object - only update if field is missing or new data provided
    const updates = {};
    
    if (userProfile.email && !existingUser.email) {
      updates.email = userProfile.email;
    }
    if (userProfile.firstName && !existingUser.first_name) {
      updates.first_name = userProfile.firstName;
    }
    if (userProfile.lastName && !existingUser.last_name) {
      updates.last_name = userProfile.lastName;
    }
    if (userProfile.phoneNumber && !existingUser.phone) {
      updates.phone = userProfile.phoneNumber;
    }
    if (userProfile.imageUrl && !existingUser.profile_image_url) {
      updates.profile_image_url = userProfile.imageUrl;
    }

    // Update full_name if we have first or last name
    if (updates.first_name || updates.last_name) {
      const firstName = updates.first_name || existingUser.first_name;
      const lastName = updates.last_name || existingUser.last_name;
      if (firstName && lastName) {
        updates.full_name = `${firstName} ${lastName}`.trim();
      } else {
        updates.full_name = firstName || lastName || null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return existingUser; // No updates needed
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', existingUser.id)
      .select()
      .single();

    if (error) {
      console.error('[syncUserProfile] Error updating user:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[syncUserProfile] Exception:', err);
    return null;
  }
};

const GOAL_LABELS = {
  confidence: 'Build Confidence',
  content: 'Content Creator',
  presentation: 'Presentation Skills',
  leadership: 'Executive Presence',
  interview: 'Job Interviews',
  sales: 'Face-to-face Sales'
};

const buildJourneyPayload = (userId, journeyData = {}) => {
  const focusSlug = journeyData.focusSlug || journeyData.primaryGoal || 'confidence';
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
    free: { analyses: 1, maxDurationSeconds: 600 }, // 10 minutes
    // Starter / Basic: light practice
    basic: { analyses: 5, maxDurationSeconds: 600 }, // 10 minutes
    starter: { analyses: 5, maxDurationSeconds: 600 }, // 10 minutes (alias for basic)
    // Pro: serious practice
    pro: { analyses: 12, maxDurationSeconds: 1800 }, // 30 minutes
    premium: { analyses: 12, maxDurationSeconds: 1800 }, // 30 minutes (alias for pro)
    // Pro Plus: advanced users
    proPlus: { analyses: 25, maxDurationSeconds: 2700 }, // 45 minutes
    'pro-plus': { analyses: 25, maxDurationSeconds: 2700 }, // 45 minutes (alias for proPlus)
    pro_plus: { analyses: 25, maxDurationSeconds: 2700 }, // 45 minutes (alias for proPlus)
    // Unlimited: heavy users / teams
    executive: { analyses: -1, maxDurationSeconds: 2700 } // unlimited analyses, 45 minutes
  };
  return limits[subscriptionType] || limits.free;
};

/**
 * Check if user can upload video with specific duration
 */
export const canUserUploadVideoWithDuration = async (clerkUserId, durationSeconds) => {
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

  // Get subscription limits
  const limits = getSubscriptionLimits(user.subscription_type);
  
  // Check video duration limit
  if (durationSeconds && limits.maxDurationSeconds && durationSeconds > limits.maxDurationSeconds) {
    const maxMinutes = Math.floor(limits.maxDurationSeconds / 60);
    return {
      allowed: false,
      reason: 'video_duration_exceeded',
      message: `Your ${user.subscription_type} plan allows videos up to ${maxMinutes} minutes. This video is ${Math.ceil(durationSeconds / 60)} minutes. Please upgrade your plan to upload longer videos.`,
      maxDurationSeconds: limits.maxDurationSeconds
    };
  }

  // Executive users can always upload (unlimited analyses)
  if (user.subscription_type === 'executive') {
    return { allowed: true, reason: null };
  }

  // If unlimited analyses, allow
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
    include_environment_feedback: answers.includeEnvironmentFeedback !== undefined ? answers.includeEnvironmentFeedback : true,
    practice_commitment: answers.practiceCommitment || answers.commitmentLevel || 'regular', // Save practice commitment
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

  // Try to fetch with goal_specific_context and practice_commitment first
  let { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, full_name, phone, profile_image_url, primary_goal, confidence_level, goal_specific_context, include_environment_feedback, practice_commitment, onboarding_completed_at, subscription_type, subscription_status, free_analysis_used, consent_version, consent_accepted_at')
    .eq('clerk_user_id', clerkUserId)
    .single();

  // If column doesn't exist, retry without it
  if (error && error.code === '42703') {
    // Check which column is missing
    const missingColumn = error.message?.includes('goal_specific_context') ? 'goal_specific_context' :
                         error.message?.includes('include_environment_feedback') ? 'include_environment_feedback' :
                         error.message?.includes('practice_commitment') ? 'practice_commitment' :
                         null;
    
    if (missingColumn === 'goal_specific_context') {
      console.warn('goal_specific_context column does not exist, fetching without it. Please run migration.');
      const retryResult = await supabase
        .from('users')
        .select('id, email, first_name, last_name, full_name, phone, profile_image_url, primary_goal, confidence_level, include_environment_feedback, practice_commitment, onboarding_completed_at, subscription_type, subscription_status, free_analysis_used, consent_version, consent_accepted_at')
        .eq('clerk_user_id', clerkUserId)
        .single();
      
      if (retryResult.error) {
        // If still error, might be include_environment_feedback missing too
        if (retryResult.error.code === '42703' && retryResult.error.message?.includes('include_environment_feedback')) {
          console.warn('include_environment_feedback column also does not exist, fetching without it.');
          const retryResult2 = await supabase
            .from('users')
            .select('id, email, first_name, last_name, full_name, phone, profile_image_url, primary_goal, confidence_level, onboarding_completed_at, subscription_type, subscription_status, free_analysis_used, consent_version, consent_accepted_at')
            .eq('clerk_user_id', clerkUserId)
            .single();
          
          if (retryResult2.error) {
            console.error('Error fetching user:', retryResult2.error);
            return null;
          }
          
          return {
            ...retryResult2.data,
            goal_specific_context: null,
            include_environment_feedback: true // Default value
          };
        }
        
        console.error('Error fetching user:', retryResult.error);
        return null;
      }
      
      // Add goal_specific_context as null for backward compatibility
      return {
        ...retryResult.data,
        goal_specific_context: null,
        include_environment_feedback: retryResult.data.include_environment_feedback !== undefined ? retryResult.data.include_environment_feedback : true
      };
    } else if (missingColumn === 'include_environment_feedback') {
      console.warn('include_environment_feedback column does not exist, fetching without it. Please run migration.');
      const retryResult = await supabase
        .from('users')
        .select('id, email, first_name, last_name, full_name, phone, profile_image_url, primary_goal, confidence_level, goal_specific_context, practice_commitment, onboarding_completed_at, subscription_type, subscription_status, free_analysis_used, consent_version, consent_accepted_at')
        .eq('clerk_user_id', clerkUserId)
        .single();
      
      if (retryResult.error) {
        // Check if practice_commitment is missing too
        if (retryResult.error.code === '42703' && retryResult.error.message?.includes('practice_commitment')) {
           console.warn('practice_commitment column also does not exist.');
           const retryResult2 = await supabase
            .from('users')
            .select('id, email, first_name, last_name, full_name, phone, profile_image_url, primary_goal, confidence_level, goal_specific_context, onboarding_completed_at, subscription_type, subscription_status, free_analysis_used, consent_version, consent_accepted_at')
            .eq('clerk_user_id', clerkUserId)
            .single();
            
           if (!retryResult2.error) {
             return {
               ...retryResult2.data,
               include_environment_feedback: true,
               practice_commitment: 'regular'
             };
           }
        }
        console.error('Error fetching user:', retryResult.error);
        return null;
      }
      
      // Add include_environment_feedback with default value
      return {
        ...retryResult.data,
        include_environment_feedback: true // Default value
      };
    } else if (missingColumn === 'practice_commitment') {
      console.warn('practice_commitment column does not exist, fetching without it.');
      const retryResult = await supabase
        .from('users')
        .select('id, email, first_name, last_name, full_name, phone, profile_image_url, primary_goal, confidence_level, goal_specific_context, include_environment_feedback, onboarding_completed_at, subscription_type, subscription_status, free_analysis_used, consent_version, consent_accepted_at')
        .eq('clerk_user_id', clerkUserId)
        .single();
      
      if (retryResult.error) {
        console.error('Error fetching user:', retryResult.error);
        return null;
      }
      
      return {
        ...retryResult.data,
        practice_commitment: 'regular' // Default value
      };
    }
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
    console.log('[saveAnalysis] Saving analysis with journeyId:', analysisData.journeyId);
  } else {
    console.log('[saveAnalysis] No journeyId provided for analysis');
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

  // Track which columns we've already warned about to avoid spam
  if (!global.warnedMissingColumns) {
    global.warnedMissingColumns = new Set();
  }

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
      // Only warn once per column per server session
      if (!global.warnedMissingColumns.has(missingColumn)) {
        console.warn(`⚠️  Database column '${missingColumn}' not found. Run migration: migration_add_analysis_versioning.sql`);
        global.warnedMissingColumns.add(missingColumn);
      }
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
 * Find similar recent analysis for score variance detection
 * Checks for exact hash match first, then looks for videos with similar duration
 * uploaded in the last 24 hours (possible re-encodes of same video)
 * @param {string} clerkUserId - Clerk user ID
 * @param {string} videoHash - SHA256 hash of the video
 * @param {number} durationSeconds - Duration of the video in seconds
 * @returns {Promise<{type: 'exact'|'similar', analysis: Object}|null>}
 */
export const findSimilarRecentAnalysis = async (clerkUserId, videoHash, durationSeconds) => {
  if (!supabase || !clerkUserId) {
    return null;
  }

  try {
    // Check for exact hash match first
    const exactMatch = await findAnalysisByVideoHash(clerkUserId, videoHash);
    if (exactMatch) {
      return { type: 'exact', analysis: exactMatch };
    }

    // If no duration provided, can't check for similar videos
    if (!durationSeconds || durationSeconds <= 0) {
      return null;
    }

    const userId = await getOrCreateUser(clerkUserId);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Look for videos with similar duration uploaded in last 24 hours
    const { data, error } = await supabase
      .from('analyses')
      .select(`
        id, 
        video_duration_seconds, 
        created_at,
        video_filename
      `)
      .eq('user_id', userId)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error finding similar analysis:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Find videos with similar duration (within 2 seconds)
    // This catches re-encoded videos that may have slightly different metadata
    const DURATION_TOLERANCE_SECONDS = 2;
    const similar = data.find(analysis => {
      const analysisDuration = analysis.video_duration_seconds || 0;
      return Math.abs(analysisDuration - durationSeconds) <= DURATION_TOLERANCE_SECONDS;
    });

    if (similar) {
      // Fetch the overall_score from communication_metrics for this analysis
      const { data: metricsData, error: metricsError } = await supabase
        .from('communication_metrics')
        .select('overall_score')
        .eq('analysis_id', similar.id)
        .maybeSingle();

      if (!metricsError && metricsData) {
        similar.overall_score = metricsData.overall_score;
      }

      return { type: 'similar', analysis: similar };
    }

    return null;
  } catch (err) {
    console.error('Error in findSimilarRecentAnalysis:', err);
    return null;
  }
};

/**
 * Log analysis quality issues for monitoring and debugging
 * Records issues like score variance, missing metrics, truncated responses, etc.
 * @param {string} analysisId - UUID of the analysis
 * @param {string} userId - UUID of the user
 * @param {Array<Object>} issues - Array of issue objects
 * @param {string} issues[].type - Issue type (e.g., 'score_variance', 'missing_metrics')
 * @param {string} issues[].severity - 'info', 'warning', or 'critical'
 * @param {Object} issues[].* - Additional issue-specific details
 * @returns {Promise<boolean>} True if logged successfully
 */
export const logAnalysisQuality = async (analysisId, userId, issues) => {
  if (!supabase) {
    console.warn('Supabase not configured, skipping quality log');
    return false;
  }

  if (!issues || !Array.isArray(issues) || issues.length === 0) {
    return true; // Nothing to log
  }

  try {
    const records = issues.map(issue => ({
      analysis_id: analysisId || null,
      user_id: userId || null,
      issue_type: issue.type || 'unknown',
      severity: issue.severity || 'info',
      details: issue
    }));

    const { error } = await supabase
      .from('analysis_quality_log')
      .insert(records);

    if (error) {
      console.error('Error logging analysis quality:', error);
      return false;
    }

    console.log(`[Quality Log] Logged ${records.length} issue(s) for analysis ${analysisId}`);
    return true;
  } catch (err) {
    console.error('Error in logAnalysisQuality:', err);
    return false;
  }
};

/**
 * Get quality issues for an analysis
 * @param {string} analysisId - UUID of the analysis
 * @returns {Promise<Array>} Array of quality issues
 */
export const getAnalysisQualityIssues = async (analysisId) => {
  if (!supabase || !analysisId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('analysis_quality_log')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quality issues:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getAnalysisQualityIssues:', err);
    return [];
  }
};

/**
 * Get quality statistics for monitoring
 * @param {number} days - Number of days to look back (default 7)
 * @returns {Promise<Object>} Statistics object
 */
export const getQualityStatistics = async (days = 7) => {
  if (!supabase) {
    return null;
  }

  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('analysis_quality_log')
      .select('issue_type, severity')
      .gte('created_at', since);

    if (error) {
      console.error('Error fetching quality statistics:', error);
      return null;
    }

    // Aggregate statistics
    const stats = {
      total: data?.length || 0,
      byType: {},
      bySeverity: { info: 0, warning: 0, critical: 0 }
    };

    data?.forEach(issue => {
      // Count by type
      stats.byType[issue.issue_type] = (stats.byType[issue.issue_type] || 0) + 1;
      // Count by severity
      if (stats.bySeverity[issue.severity] !== undefined) {
        stats.bySeverity[issue.severity]++;
      }
    });

    return stats;
  } catch (err) {
    console.error('Error in getQualityStatistics:', err);
    return null;
  }
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
    overall_score: metrics.overall_score || null,
    stage_title: metrics.stage_title || null,
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
    console.log('[saveCommunicationMetrics] Saving metrics with journeyId:', journeyId);
  } else {
    console.log('[saveCommunicationMetrics] No journeyId provided for metrics');
  }

  if (metrics.delivery) {
    const delivery = metrics.delivery;
    // Save categorical labels (primary)
    if (delivery.speaking_rate_label) {
      insertData.speaking_rate_label = delivery.speaking_rate_label;
    }
    if (delivery.filler_word_level) {
      insertData.filler_word_level = delivery.filler_word_level;
    }
    // Backward compatibility: also save numeric values if provided (for future transcription)
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

  // Try to save delivery metrics first - they might exist in the database
  // Only remove columns that definitely don't exist (model_version, processor_version)
  const definitelyRemovableColumns = [
    'model_version',
    'processor_version'
  ];
  
  // Try inserting with delivery metrics first
  let attemptPayload = { ...insertData };
  definitelyRemovableColumns.forEach(col => {
    if (attemptPayload.hasOwnProperty(col)) {
      delete attemptPayload[col];
    }
  });

  console.log(`[saveCommunicationMetrics] Inserting metrics with ${Object.keys(attemptPayload).length} fields`);
  console.log(`[saveCommunicationMetrics] journeyId in payload: ${attemptPayload.journey_id || 'NULL'}`);
  console.log(`[saveCommunicationMetrics] overall_score: ${attemptPayload.overall_score}, presence: ${attemptPayload.presence}, voice_expression: ${attemptPayload.voice_expression}`);

  try {
    let { data, error } = await supabase
      .from('communication_metrics')
      .insert(attemptPayload)
      .select()
      .single();

    // If error is due to missing delivery metric columns, remove them and retry
    if (error && error.code === 'PGRST204') {
      const errorMsg = (error.message || '').toLowerCase();
      const deliveryColumns = [
        'speaking_rate_wpm', 
        'filler_word_count', 
        'sentiment_label', 
        'posture_flag',
        'speaking_rate_label',
        'filler_word_level'
      ];
      const missingDeliveryColumn = deliveryColumns.find(col => errorMsg.includes(col.toLowerCase()));
      
      if (missingDeliveryColumn || errorMsg.includes('column')) {
        console.warn(`[saveCommunicationMetrics] Column missing (likely ${missingDeliveryColumn}), removing ALL delivery metrics and retrying`);
        deliveryColumns.forEach(col => {
          if (attemptPayload.hasOwnProperty(col)) {
            delete attemptPayload[col];
          }
        });
        
        // Retry without delivery metrics
        const retryResult = await supabase
          .from('communication_metrics')
          .insert(attemptPayload)
          .select()
          .single();
        
        if (retryResult.error) {
          console.error('[saveCommunicationMetrics] ❌ ERROR saving communication metrics after retry:', {
            code: retryResult.error.code,
            message: retryResult.error.message
          });
          return null;
        }
        
        data = retryResult.data;
        error = null;
      } else {
        console.error('[saveCommunicationMetrics] ❌ ERROR saving communication metrics:', {
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details
        });
        return null;
      }
    } else if (error) {
      console.error('[saveCommunicationMetrics] ❌ ERROR saving communication metrics:', {
        code: error.code,
        message: error.message,
        hint: error.hint,
        details: error.details
      });
      return null;
    }

    if (!data) {
      console.error('[saveCommunicationMetrics] ❌ Insert succeeded but no data returned');
      return null;
    }

    console.log('[saveCommunicationMetrics] ✅ Successfully saved communication metrics:', {
      id: data.id,
      analysis_id: data.analysis_id,
      journey_id: data.journey_id || 'NULL',
      overall_score: data.overall_score,
      user_id: data.user_id
    });

    return data;
  } catch (err) {
    console.error('[saveCommunicationMetrics] ❌ EXCEPTION while saving metrics:', err);
    console.error('[saveCommunicationMetrics] Exception stack:', err.stack);
    return null;
  }
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
  const isBackgroundGeneration = options.backgroundGeneration === true; // OPTIMIZATION 1.4: Flag for background work
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

    const normalizedTitle = title.trim().toLowerCase();

    // Prepare details object - preserve all details
    // For tips, extract whatToPractice and whyItMatters if available
    const details = {
      what_to_do: null,
      why_it_matters: null,
      example: null,
      all_details: Array.isArray(action.details) ? action.details : (action.details ? [action.details] : [])
    };
    
    // If action has whatToPractice/whyItMatters directly (from parser), use those
    if (action.whatToPractice) {
      details.what_to_do = action.whatToPractice;
      // Add to all_details if not already there
      const practiceDetail = `What to practice: ${action.whatToPractice}`;
      if (!details.all_details.some(d => d.includes(action.whatToPractice))) {
        details.all_details.unshift(practiceDetail);
      }
    }
    if (action.whyItMatters) {
      details.why_it_matters = action.whyItMatters;
      // Add to all_details if not already there
      const whyDetail = `Why it matters: ${action.whyItMatters}`;
      if (!details.all_details.some(d => d.includes(action.whyItMatters))) {
        details.all_details.push(whyDetail);
      }
    }

    // Try to parse details if they exist
    if (action.details && Array.isArray(action.details) && action.details.length > 0) {
      action.details.forEach((detail) => {
        if (!detail || typeof detail !== 'string') return;
        const lowerDetail = detail.toLowerCase().trim();
        const cleanDetail = detail.trim();
        
        const looksLikeWhy = lowerDetail.includes('why it matters') || lowerDetail.includes('because') || lowerDetail.includes('so that');
        const looksLikeExample = lowerDetail.includes('example') || lowerDetail.includes('for instance');
        const looksLikeInstruction = lowerDetail.includes('what to do') || lowerDetail.includes('what to practice') || lowerDetail.includes('try to') || lowerDetail.startsWith('practice');

        if (looksLikeInstruction && !details.what_to_do) {
          details.what_to_do = cleanDetail.replace(/^(what to do|what to practice)[:\s-]+/i, '').trim();
        } else if (looksLikeWhy && !details.why_it_matters) {
          details.why_it_matters = cleanDetail.replace(/^(why it matters|why|because)[:\s-]+/i, '').trim();
        } else if (looksLikeExample && !details.example) {
          details.example = cleanDetail.replace(/^example[:\s-]+/i, '').trim();
        } else if (!details.what_to_do) {
          details.what_to_do = cleanDetail;
        } else if (!details.why_it_matters && lowerDetail.includes('so you can')) {
          details.why_it_matters = cleanDetail;
        } else if (!details.example && lowerDetail.includes('e.g.')) {
          details.example = cleanDetail;
        }
      });
      
      // If we didn't parse anything, use first detail as what_to_do
      if (!details.what_to_do && !details.why_it_matters && !details.example && details.all_details.length > 0) {
        details.what_to_do = details.all_details[0];
      }
    } else if (action.details && typeof action.details === 'string') {
      details.what_to_do = action.details.trim();
      details.all_details = [action.details.trim()];
    }

    // Check if a similar action item already exists (pending/in-progress) for this user
    const { data: existingItems } = await supabase
      .from('action_items')
      .select('id, status, title, analysis_id, practice_prompt_title')
      .eq('user_id', userId);

    const existingActive = existingItems?.find(item => 
      item.title.trim().toLowerCase() === normalizedTitle &&
      ['pending', 'in_progress'].includes(item.status)
    );

    if (existingActive) {
      // If we are in background mode and prompt generation is requested,
      // check if this existing item needs a prompt
      if (shouldGeneratePrompts && !existingActive.practice_prompt_title) {
        console.log(`Queueing existing item for practice prompt generation: ${title}`);
        // Attach userContext from options since it's not in DB item
        existingActive.userContext = options.userContext;
        // Attach targetMetric if available from options
        existingActive.targetMetric = options.focusMetricKey;
        // Attach parsed details to use for prompt generation
        existingActive.details = details;
        
        itemsNeedingPrompts.push(existingActive);
      } else {
        console.log(`Skipping duplicate active action item: ${title} (existing status: ${existingActive.status})`);
      }
      continue;
    }
    
    console.log('[saveActionItems] Saving action item with details:', {
      title: title,
      hasDetails: action.details && action.details.length > 0,
      detailsCount: action.details?.length || 0,
      what_to_do: details.what_to_do,
      why_it_matters: details.why_it_matters,
      all_details_count: details.all_details.length
    });

    const inferredMetric = inferTargetMetricFromTitle(title);
    const targetMetric = options.focusMetricKey || inferredMetric;
    
    // Get item_type from action item, default to 'tip' for backward compatibility
    const itemType = action.item_type || 'tip';
    
    // Get tip_section from action item (communication or bodyLanguage)
    // Support both 'section' (from parser) and 'tip_section' (normalized)
    const tipSection = action.tip_section || 
                       (action.section === 'body-language' ? 'bodyLanguage' : 
                        action.section === 'communication' ? 'communication' : 
                        null);

    const insertPayload = {
      user_id: userId,
      analysis_id: analysisId,
      title: title,
      details: details,
      status: 'pending',
      item_type: itemType, // Save item type to distinguish tips from quick wins/recording notes
      tip_section: tipSection, // Save tip section to separate communication and bodyLanguage tips
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
      'item_type', // Allow graceful fallback if column doesn't exist yet
      'tip_section', // Allow graceful fallback if column doesn't exist yet
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

    // Track which columns we've already warned about to avoid spam
    if (!global.warnedMissingColumns) {
      global.warnedMissingColumns = new Set();
    }

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
        // Only warn once per column per server session
        const warningKey = `action_items.${missingColumn}`;
        if (!global.warnedMissingColumns.has(warningKey)) {
          console.warn(`⚠️  Database column 'action_items.${missingColumn}' not found. Run migration: migration_add_practice_prompt_fields.sql`);
          global.warnedMissingColumns.add(warningKey);
        }
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
      console.log(`Successfully saved action item: "${title}" (ID: ${data.id}, type: ${itemType})`);
      savedItems.push(data);
      // Only generate practice prompts for tips (not quick wins or recording notes)
      if (shouldGeneratePrompts && (itemType === 'tip' || itemType === null || itemType === undefined)) {
        itemsNeedingPrompts.push({
          id: data.id,
          title,
          details,
          userContext: options.userContext || null,
          targetMetric
        });
      } else if (shouldGeneratePrompts && itemType !== 'tip') {
        console.log(`Skipping practice prompt generation for ${itemType} item: "${title}"`);
      }
    } else {
      console.warn(`Action item "${title}" was not saved - no data returned`);
    }
  }

  // OPTIMIZATION 1.4: Generate practice prompts in background if flag is set
  if (shouldGeneratePrompts && itemsNeedingPrompts.length > 0) {
    if (isBackgroundGeneration) {
      // Generate in background without blocking
      console.log(`[Background] Generating practice prompts for ${itemsNeedingPrompts.length} action item(s)`);
      generatePracticePromptsForItems(itemsNeedingPrompts).catch(err => {
        console.error('[Background] Failed to generate practice prompts:', err);
      });
    } else {
      // Generate synchronously (for backward compatibility or when explicitly requested)
      console.log(`Generating practice prompts for ${itemsNeedingPrompts.length} action item(s)`);
      await generatePracticePromptsForItems(itemsNeedingPrompts);
    }
  } else if (shouldGeneratePrompts && !isBackgroundGeneration) {
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
        estimatedTime: '45 seconds',
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
  const whyItMatters = details.why_it_matters || '';
  const userContext = item.userContext || {};
  const language = userContext.language || 'en';
  const isHebrew = language === 'he';
  
  // Build description based on Action Item
  const description = isHebrew 
    ? `הקלט סרטון של ~45 שניות שבו אתה מתרגל "${title}". ${whatToDo ? whatToDo : 'התמקד בשיפור הנקודה הספציפית הזו.'}`
    : `Record a ~45 second video where you practice "${title}". ${whatToDo ? whatToDo : 'Focus on improving this specific area.'}`;
  
  const setup = isHebrew
    ? 'מקם את המצלמה בגובה העיניים, במרחק של כף יד. עמוד או שב זקוף עם תאורה טובה.'
    : "Place your phone or laptop camera at eye level, about an arm's length away. Stand or sit upright with good lighting.";
  
  const whatToNotice = isHebrew
    ? whyItMatters || 'שימו לב לקשר עין, אנרגיה קולית, והאם המחוות שלך תומכות במסר.'
    : whyItMatters || 'Pay attention to eye contact, vocal energy, and whether your gestures support the message.';
  
  const recordingTip = isHebrew
    ? whatToDo || 'דבר בכוונה, עצור לרגע בין נקודות מפתח, ושמור על מחוות מכוונות.'
    : whatToDo || 'Speak with intention, pause briefly between key points, and keep your gestures purposeful.';

  return {
    title: isHebrew ? `תרגול: ${title}` : `Rehearse: ${title}`,
    description,
    setup,
    whatToNotice,
    recordingTip,
    targetMetric: item.targetMetric || inferTargetMetricFromTitle(title) || 'overall',
    difficulty: 'intermediate',
    estimatedTime: '45 seconds',
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
export const getUserActionItems = async (clerkUserId, status = null, journeyId = null, analysisId = null) => {
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

  if (analysisId) {
    query = query.eq('analysis_id', analysisId);
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

  console.log(`getUserActionItems: Found ${data?.length || 0} action items for user ${clerkUserId} (status: ${status || 'all'}, analysisId: ${analysisId || 'all'})`);
  if (data && data.length > 0) {
    console.log('Action items titles:', data.map(item => item.title));
  }

  return data || [];
};

export const saveSelfReflection = async (clerkUserId, reflection = {}) => {
  if (!supabase || !clerkUserId) {
    console.error('[saveSelfReflection] Missing supabase or clerkUserId');
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

  console.log('[saveSelfReflection] Saving reflection:', {
    userId,
    analysis_id: insertPayload.analysis_id,
    journey_id: insertPayload.journey_id,
    confidence_rating: insertPayload.confidence_rating
  });

  // Check if reflection already exists
  if (insertPayload.analysis_id) {
    const { data: existing, error: checkError } = await supabase
      .from('self_reflections')
      .select('id')
      .eq('user_id', userId)
      .eq('analysis_id', insertPayload.analysis_id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[saveSelfReflection] Error checking for existing reflection:', checkError);
    }

    if (existing) {
      console.log('[saveSelfReflection] Updating existing reflection:', existing.id);
      // Update existing reflection
      const { data, error } = await supabase
        .from('self_reflections')
        .update({
          confidence_rating: insertPayload.confidence_rating,
          mood_label: insertPayload.mood_label,
          notes: insertPayload.notes,
          journey_id: insertPayload.journey_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[saveSelfReflection] Error updating self reflection:', error);
        console.error('[saveSelfReflection] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return null;
      }
      console.log('[saveSelfReflection] Successfully updated reflection:', data.id);
      return data;
    }
  }

  // Insert new reflection
  console.log('[saveSelfReflection] Inserting new reflection');
  const { data, error } = await supabase
    .from('self_reflections')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('[saveSelfReflection] Error saving self reflection:', error);
    console.error('[saveSelfReflection] Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      payload: insertPayload
    });
    return null;
  }

  console.log('[saveSelfReflection] Successfully saved reflection:', data.id);
  return data;
};

/**
 * Save practice missions for a user/parameter/journey
 * If missions already exist, they will be replaced (due to UNIQUE constraint)
 */
export const savePracticeMissions = async (clerkUserId, {
  journeyId = null,
  parameterKey,
  parameterLabel,
  parameterDescription = null,
  currentScore,
  targetScore = 7.5,
  missions, // Array of mission strings
  trend = null,
  userContext = {},
  aiModelVersion = null,
  analysisId = null
}) => {
  if (!supabase) {
    console.warn('Supabase not initialized. Cannot save practice missions.');
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);
  if (!userId) {
    throw new Error('Failed to get or create user');
  }

  // Delete existing missions for this user/parameter/journey combination
  // (due to UNIQUE constraint, we need to delete first)
  const deleteQuery = supabase
    .from('practice_missions')
    .delete()
    .eq('user_id', userId)
    .eq('parameter_key', parameterKey);
  
  if (journeyId) {
    deleteQuery.eq('journey_id', journeyId);
  } else {
    deleteQuery.is('journey_id', null);
  }

  await deleteQuery;

  // Insert new missions
  // Build insert payload, conditionally including analysis_id if it exists in schema
  const insertPayload = {
    user_id: userId,
    journey_id: journeyId,
    parameter_key: parameterKey,
    parameter_label: parameterLabel,
    parameter_description: parameterDescription,
    current_score: currentScore,
    target_score: targetScore,
    missions: missions, // JSONB array
    trend_direction: trend?.direction || null,
    trend_change: trend?.change || null,
    user_context: userContext,
    ai_model_version: aiModelVersion,
    score_at_generation: currentScore,
    is_stale: false
  };

  // Only include analysis_id if provided (column may not exist in older migrations)
  // We'll try to include it, but if the column doesn't exist, we'll catch the error and retry without it
  if (analysisId) {
    insertPayload.analysis_id = analysisId;
  }

  let { data, error } = await supabase
    .from('practice_missions')
    .insert(insertPayload)
    .select()
    .single();

  // If error is about missing columns, retry without them
  if (error && error.message) {
    const missingColumns = [];
    if (error.message.includes('analysis_id')) {
      missingColumns.push('analysis_id');
      delete insertPayload.analysis_id;
    }
    if (error.message.includes('is_stale')) {
      missingColumns.push('is_stale');
      delete insertPayload.is_stale;
    }
    if (error.message.includes('score_at_generation')) {
      missingColumns.push('score_at_generation');
      delete insertPayload.score_at_generation;
    }
    
    if (missingColumns.length > 0) {
      console.warn(`[savePracticeMissions] Columns not found: ${missingColumns.join(', ')}, retrying without them`);
      const retryResult = await supabase
        .from('practice_missions')
        .insert(insertPayload)
        .select()
        .single();
      data = retryResult.data;
      error = retryResult.error;
    }
  }

  if (error) {
    console.error('Error saving practice missions:', error);
    throw new Error(`Failed to save practice missions: ${error.message}`);
  }

  console.log(`Saved ${missions.length} practice missions for parameter ${parameterKey}`);
  return data;
};

/**
 * Get practice missions for a user/parameter/journey
 * Also checks if missions are stale based on current score
 */
export const getPracticeMissions = async (clerkUserId, parameterKey, journeyId = null, currentScore = null) => {
  if (!supabase) {
    return null;
  }

  const userId = await getOrCreateUser(clerkUserId);
  if (!userId) {
    return null;
  }

  let query = supabase
    .from('practice_missions')
    .select('*')
    .eq('user_id', userId)
    .eq('parameter_key', parameterKey);

  if (journeyId) {
    query = query.eq('journey_id', journeyId);
  } else {
    query = query.is('journey_id', null);
  }

  const { data, error } = await query.maybeSingle();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error fetching practice missions:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Check if missions are stale (score changed by ±1.0 points or more)
  if (currentScore !== null && data.score_at_generation !== null) {
    const scoreDiff = Math.abs(parseFloat(currentScore) - parseFloat(data.score_at_generation));
    if (scoreDiff >= 1.0) {
      // Mark as stale in database if not already marked
      if (!data.is_stale) {
        await supabase
          .from('practice_missions')
          .update({ is_stale: true, updated_at: new Date().toISOString() })
          .eq('id', data.id);
      }
      data.is_stale = true;
      data.score_diff = scoreDiff;
    }
  }

  return data;
};

/**
 * Get all practice missions for a user/journey
 */
export const getAllPracticeMissions = async (clerkUserId, journeyId = null) => {
  if (!supabase) {
    return [];
  }

  const userId = await getOrCreateUser(clerkUserId);
  if (!userId) {
    return [];
  }

  let query = supabase
    .from('practice_missions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (journeyId) {
    query = query.eq('journey_id', journeyId);
  } else {
    query = query.is('journey_id', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all practice missions:', error);
    return [];
  }

  return data || [];
};

/**
 * Mark a mission as completed
 */
export const completeMission = async (clerkUserId, practiceMissionId, missionIndex, parameterKey, journeyId = null, notes = null) => {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  const userId = await getOrCreateUser(clerkUserId);
  if (!userId) {
    throw new Error('Failed to get or create user');
  }

  const { data, error } = await supabase
    .from('mission_completions')
    .insert({
      user_id: userId,
      practice_mission_id: practiceMissionId,
      mission_index: missionIndex,
      parameter_key: parameterKey,
      journey_id: journeyId,
      notes: notes
    })
    .select()
    .single();

  if (error) {
    // If it's a unique constraint violation, mission was already completed
    if (error.code === '23505') {
      console.log(`Mission ${missionIndex} for practice_mission ${practiceMissionId} already completed`);
      return null;
    }
    console.error('Error completing mission:', error);
    throw new Error(`Failed to complete mission: ${error.message}`);
  }

  console.log(`Mission ${missionIndex} completed for practice_mission ${practiceMissionId}`);
  return data;
};

/**
 * Get completion status for practice missions
 */
export const getMissionCompletions = async (clerkUserId, practiceMissionId = null, journeyId = null) => {
  if (!supabase) {
    return [];
  }

  const userId = await getOrCreateUser(clerkUserId);
  if (!userId) {
    return [];
  }

  let query = supabase
    .from('mission_completions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (practiceMissionId) {
    query = query.eq('practice_mission_id', practiceMissionId);
  }

  if (journeyId) {
    query = query.eq('journey_id', journeyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching mission completions:', error);
    return [];
  }

  return data || [];
};

/**
 * Get completion statistics for a user
 */
export const getMissionCompletionStats = async (clerkUserId, journeyId = null) => {
  if (!supabase) {
    return {
      totalCompleted: 0,
      totalMissions: 0,
      completionRate: 0,
      streakDays: 0,
      lastCompletedAt: null
    };
  }

  const userId = await getOrCreateUser(clerkUserId);
  if (!userId) {
    return {
      totalCompleted: 0,
      totalMissions: 0,
      completionRate: 0,
      streakDays: 0,
      lastCompletedAt: null
    };
  }

  // Get all completions
  let completionsQuery = supabase
    .from('mission_completions')
    .select('completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (journeyId) {
    completionsQuery = completionsQuery.eq('journey_id', journeyId);
  }

  const { data: completions, error: completionsError } = await completionsQuery;

  if (completionsError) {
    console.error('Error fetching completion stats:', completionsError);
    return {
      totalCompleted: 0,
      totalMissions: 0,
      completionRate: 0,
      streakDays: 0,
      lastCompletedAt: null
    };
  }

  // Get all practice missions to calculate total
  const allMissions = await getAllPracticeMissions(clerkUserId, journeyId);
  const totalMissions = allMissions.reduce((sum, mission) => {
    const missionsArray = Array.isArray(mission.missions) ? mission.missions : [];
    return sum + missionsArray.length;
  }, 0);

  const totalCompleted = completions?.length || 0;
  const completionRate = totalMissions > 0 ? (totalCompleted / totalMissions) * 100 : 0;
  const lastCompletedAt = completions && completions.length > 0 ? completions[0].completed_at : null;

  // Calculate streak (consecutive days with at least one completion)
  let streakDays = 0;
  if (completions && completions.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completionDates = new Set(
      completions.map(c => {
        const date = new Date(c.completed_at);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    let currentDate = new Date(today);
    while (completionDates.has(currentDate.getTime())) {
      streakDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
  }

  return {
    totalCompleted,
    totalMissions,
    completionRate: Math.round(completionRate * 10) / 10,
    streakDays,
    lastCompletedAt
  };
};

/**
 * Uncomplete a mission (remove completion)
 */
export const uncompleteMission = async (clerkUserId, practiceMissionId, missionIndex) => {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  const userId = await getOrCreateUser(clerkUserId);
  if (!userId) {
    throw new Error('Failed to get or create user');
  }

  const { error } = await supabase
    .from('mission_completions')
    .delete()
    .eq('user_id', userId)
    .eq('practice_mission_id', practiceMissionId)
    .eq('mission_index', missionIndex);

  if (error) {
    console.error('Error uncompleting mission:', error);
    throw new Error(`Failed to uncomplete mission: ${error.message}`);
  }

  console.log(`Mission ${missionIndex} uncompleted for practice_mission ${practiceMissionId}`);
  return true;
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

  console.log('[getUserCommunicationMetrics] Fetching metrics with journeyId:', journeyId, 'limit:', limit, 'userId:', userId);

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
    console.log('[getUserCommunicationMetrics] Querying with journeyId filter:', journeyId);
  } else {
    console.log('[getUserCommunicationMetrics] Querying without journeyId filter');
  }

  let { data, error } = await query
    .order('created_at', { ascending: true })
    .limit(limit);

  console.log('[getUserCommunicationMetrics] Query result:', {
    count: data?.length || 0,
    error: error?.code,
    errorMessage: error?.message,
    journeyId: journeyId || 'none',
    sampleJourneyId: data?.[0]?.journey_id,
    sampleUserId: data?.[0]?.user_id
  });

  if (error && error.code !== 'PGRST116') {
    console.error('[getUserCommunicationMetrics] Error fetching communication metrics:', error);
    return [];
  }

  // If journeyId was provided, verify all returned metrics belong to that journey
  if (journeyId && data && data.length > 0) {
    const invalidMetrics = data.filter(m => m.journey_id !== journeyId);
    if (invalidMetrics.length > 0) {
      console.warn('[getUserCommunicationMetrics] Found metrics with incorrect journeyId:', invalidMetrics.length);
      // Filter out metrics that don't match the requested journeyId
      data = data.filter(m => m.journey_id === journeyId);
    }
  }

  console.log('[getUserCommunicationMetrics] Returning', data?.length || 0, 'metrics for journeyId:', journeyId || 'none');
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

  console.log('[getUserCommunicationProfile] Fetching profile with journeyId:', journeyId, 'userId:', userId);

  // Get latest metrics for the specified journey
  let metricsQuery = supabase
    .from('communication_metrics')
    .select('*')
    .eq('user_id', userId);

  if (journeyId) {
    metricsQuery = metricsQuery.eq('journey_id', journeyId);
    console.log('[getUserCommunicationProfile] Querying metrics with journeyId filter:', journeyId);
  } else {
    console.log('[getUserCommunicationProfile] Querying metrics without journeyId filter');
  }

  let { data: latestMetrics, error: metricsError } = await metricsQuery
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log('[getUserCommunicationProfile] Query result:', {
    found: !!latestMetrics,
    error: metricsError?.code,
    errorMessage: metricsError?.message,
    requestedJourneyId: journeyId || 'none',
    foundJourneyId: latestMetrics?.journey_id,
    userId: latestMetrics?.user_id
  });

  // Verify that the returned metrics belong to the requested journey
  if (journeyId && latestMetrics && latestMetrics.journey_id !== journeyId) {
    console.warn('[getUserCommunicationProfile] Found metrics with incorrect journeyId. Expected:', journeyId, 'Got:', latestMetrics.journey_id);
    latestMetrics = null;
  }

  if (metricsError && metricsError.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('[getUserCommunicationProfile] Error fetching latest metrics:', metricsError);
  }

  // Get latest insight for the specified journey
  let insightQuery = supabase
    .from('communication_insights')
    .select('*')
    .eq('user_id', userId);

  if (journeyId) {
    insightQuery = insightQuery.eq('journey_id', journeyId);
  }

  let { data: latestInsight, error: insightError } = await insightQuery
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Verify that the returned insight belongs to the requested journey
  if (journeyId && latestInsight && latestInsight.journey_id !== journeyId) {
    console.warn('[getUserCommunicationProfile] Found insight with incorrect journeyId. Expected:', journeyId, 'Got:', latestInsight.journey_id);
    latestInsight = null;
  }

  if (insightError && insightError.code !== 'PGRST116') {
    console.error('Error fetching latest insight:', insightError);
  }

  return {
    latest_metrics: latestMetrics || null,
    latest_insight: latestInsight || null
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

// Email notification functions

/**
 * Get user email preferences
 */
export const getUserEmailPreferences = async (userId) => {
  if (!supabase || !userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('email_notifications_enabled, email_marketing_enabled')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[getUserEmailPreferences] Error:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[getUserEmailPreferences] Exception:', err);
    return null;
  }
};

/**
 * Update user email preferences
 */
export const updateUserEmailPreferences = async (clerkUserId, preferences) => {
  if (!supabase || !clerkUserId) {
    throw new Error('Supabase or clerkUserId not provided');
  }

  try {
    // Get user ID from clerk_user_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message || 'Unknown error'}`);
    }

    const updates = {};
    if (preferences.email_notifications_enabled !== undefined) {
      updates.email_notifications_enabled = preferences.email_notifications_enabled;
    }
    if (preferences.email_marketing_enabled !== undefined) {
      updates.email_marketing_enabled = preferences.email_marketing_enabled;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update preferences: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('[updateUserEmailPreferences] Error:', err);
    throw err;
  }
};

/**
 * Get user language preference
 */
export const getUserLanguagePreference = async (userId) => {
  if (!supabase || !userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('language_preference')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[getUserLanguagePreference] Error:', error);
      return null;
    }

    return data?.language_preference || 'en';
  } catch (err) {
    console.error('[getUserLanguagePreference] Exception:', err);
    return null;
  }
};

/**
 * Update user language preference
 */
export const updateUserLanguagePreference = async (clerkUserId, languagePreference) => {
  if (!supabase || !clerkUserId) {
    throw new Error('Supabase or clerkUserId not provided');
  }

  if (!languagePreference || !['en', 'he'].includes(languagePreference)) {
    throw new Error('Invalid language preference. Must be "en" or "he"');
  }

  try {
    // Get user ID from clerk_user_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message || 'Unknown error'}`);
    }

    const { data, error } = await supabase
      .from('users')
      .update({ language_preference: languagePreference })
      .eq('id', user.id)
      .select('language_preference')
      .single();

    if (error) {
      throw new Error(`Failed to update language preference: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('[updateUserLanguagePreference] Error:', err);
    throw err;
  }
};

/**
 * Log email notification in database
 */
export const logEmailSent = async ({ userId, emailType, recipientEmail, subject, status = 'sent', metadata = {} }) => {
  if (!supabase || !userId) {
    console.warn('[logEmailSent] Supabase or userId not provided');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('email_notifications')
      .insert({
        user_id: userId,
        email_type: emailType,
        recipient_email: recipientEmail,
        subject: subject,
        status: status,
        metadata: metadata
      })
      .select()
      .single();

    if (error) {
      console.error('[logEmailSent] Error:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[logEmailSent] Exception:', err);
    return null;
  }
};

/**
 * Get user's email notification history
 */
export const getUserEmailHistory = async (clerkUserId, limit = 20) => {
  if (!supabase || !clerkUserId) {
    return [];
  }

  try {
    // Get user ID from clerk_user_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !user) {
      return [];
    }

    const { data, error } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getUserEmailHistory] Error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[getUserEmailHistory] Exception:', err);
    return [];
  }
};

/**
 * Get users who need practice reminders based on their commitment level
 * Returns users with their last analysis date and commitment level
 */
export const getUsersNeedingReminders = async () => {
  if (!supabase) {
    console.warn('[getUsersNeedingReminders] Supabase not initialized');
    return [];
  }

  try {
    // Get all users with email notifications enabled
    // Join with their onboarding answers to get commitment level
    // Join with analyses to get last analysis date
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        clerk_user_id,
        email,
        first_name,
        name,
        email_notifications_enabled,
        onboarding_answers
      `)
      .eq('email_notifications_enabled', true)
      .not('email', 'is', null);

    if (usersError) {
      console.error('[getUsersNeedingReminders] Error fetching users:', usersError);
      return [];
    }

    if (!users || users.length === 0) {
      return [];
    }

    // For each user, get their last analysis date
    const usersWithAnalysisData = await Promise.all(
      users.map(async (user) => {
        try {
          // Get most recent analysis
          const { data: lastAnalysis } = await supabase
            .from('analyses')
            .select('created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get most recent reminder sent
          const { data: lastReminder } = await supabase
            .from('email_notifications')
            .select('sent_at')
            .eq('user_id', user.id)
            .eq('email_type', 'practice_reminder')
            .eq('status', 'sent')
            .order('sent_at', { ascending: false })
            .limit(1)
            .single();

          // Calculate days since last analysis
          let daysSinceLastAnalysis = null;
          if (lastAnalysis?.created_at) {
            const lastAnalysisDate = new Date(lastAnalysis.created_at);
            const now = new Date();
            daysSinceLastAnalysis = Math.floor((now - lastAnalysisDate) / (1000 * 60 * 60 * 24));
          }

          // Don't remind if we already sent a reminder today
          if (lastReminder?.sent_at) {
            const lastReminderDate = new Date(lastReminder.sent_at);
            const now = new Date();
            const daysSinceReminder = Math.floor((now - lastReminderDate) / (1000 * 60 * 60 * 24));
            if (daysSinceReminder < 1) {
              return null; // Skip - already sent today
            }
          }

          // Extract commitment level from onboarding answers
          const commitmentLevel = user.onboarding_answers?.commitment || 
                                  user.onboarding_answers?.practice_commitment || 
                                  'regular';

          return {
            id: user.id,
            clerk_user_id: user.clerk_user_id,
            email: user.email,
            first_name: user.first_name,
            name: user.name,
            commitment_level: commitmentLevel,
            days_since_last_analysis: daysSinceLastAnalysis,
            last_analysis_date: lastAnalysis?.created_at || null
          };
        } catch (err) {
          console.warn(`[getUsersNeedingReminders] Error processing user ${user.id}:`, err.message);
          return null;
        }
      })
    );

    // Filter out null results and users who haven't done any analysis yet
    // (they need onboarding encouragement, not practice reminders)
    return usersWithAnalysisData.filter(u => 
      u !== null && 
      u.days_since_last_analysis !== null &&
      u.days_since_last_analysis > 0
    );
  } catch (err) {
    console.error('[getUsersNeedingReminders] Exception:', err);
    return [];
  }
};

