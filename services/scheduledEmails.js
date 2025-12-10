import 'dotenv/config';
import logger from './logger.js';
import { 
  sendProgressUpdateEmail, 
  sendActionItemReminderEmail,
  sendPracticeReminderEmail
} from './emailService.js';
import {
  getUserCommunicationProfile,
  getUserActionItems,
  getUserWithOnboarding,
  getUsersNeedingReminders,
  getUserJourneys
} from './supabaseService.js';

// Commitment level to inactivity threshold mapping (in days)
const COMMITMENT_THRESHOLDS = {
  casual: 14,      // 2 weeks
  regular: 5,      // 5 days
  intensive: 2,    // 2 days
  // Default for unknown commitment levels
  default: 7       // 1 week
};

/**
 * Get the inactivity threshold for a user based on their commitment level
 */
const getInactivityThreshold = (commitmentLevel) => {
  return COMMITMENT_THRESHOLDS[commitmentLevel] || COMMITMENT_THRESHOLDS.default;
};

/**
 * Send weekly progress update emails to all active users
 * This should be called via a cron job (e.g., every Monday at 9 AM)
 */
export const sendWeeklyProgressEmails = async () => {
  logger.info({}, '[Scheduled Emails] Starting weekly progress email job');
  
  // TODO: Get all active users from database
  // For now, this is a placeholder that would need to be implemented
  // based on your user querying needs
  
  logger.info({}, '[Scheduled Emails] Weekly progress email job completed');
};

/**
 * Send practice reminder emails based on user's commitment level
 * This should be called via a cron job (e.g., daily at 10 AM)
 */
export const sendCommitmentBasedReminders = async () => {
  logger.info({}, '[Scheduled Emails] Starting commitment-based reminder job');
  
  try {
    // Get users who need reminders based on their commitment level
    const usersToRemind = await getUsersNeedingReminders();
    
    if (!usersToRemind || usersToRemind.length === 0) {
      logger.info({}, '[Scheduled Emails] No users need reminders at this time');
      return { sent: 0, skipped: 0 };
    }

    let sent = 0;
    let skipped = 0;

    for (const user of usersToRemind) {
      try {
        const threshold = getInactivityThreshold(user.commitment_level);
        const daysSinceLastAnalysis = user.days_since_last_analysis || 0;
        
        // Check if user has exceeded their inactivity threshold
        if (daysSinceLastAnalysis >= threshold) {
          await sendUserPracticeReminder(user);
          sent++;
        } else {
          skipped++;
        }
      } catch (err) {
        logger.error({ error: err.message, stack: err.stack, clerkUserId: user.clerk_user_id }, '[Scheduled Emails] Failed to process reminder for user');
        skipped++;
      }
    }

    logger.info({ sent, skipped }, '[Scheduled Emails] Commitment reminders completed');
    return { sent, skipped };
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, '[Scheduled Emails] Failed to run commitment reminders');
    return { sent: 0, skipped: 0, error: error.message };
  }
};

/**
 * Send action item reminder emails to users with incomplete action items
 * This should be called via a cron job (e.g., daily at 10 AM)
 */
export const sendActionItemReminders = async () => {
  logger.info({}, '[Scheduled Emails] Starting action item reminder job');
  
  // TODO: Get all users with pending action items older than 3 days
  // For now, this is a placeholder that would need to be implemented
  // based on your user querying needs
  
  logger.info({}, '[Scheduled Emails] Action item reminder job completed');
};

/**
 * Send practice reminder to a specific user based on their commitment level
 */
export const sendUserPracticeReminder = async (user) => {
  try {
    if (!user?.email || !user?.id) {
      logger.warn({}, '[Scheduled Emails] No email or user ID found for reminder');
      return { success: false, reason: 'missing_user_data' };
    }

    // Get user's pending action items for practice prompt suggestion
    const actionItems = await getUserActionItems(user.clerk_user_id, 'pending');
    
    // Get the most relevant practice prompt
    let practicePrompt = null;
    if (actionItems && actionItems.length > 0) {
      const itemWithPrompt = actionItems.find(item => item.practice_prompt_title);
      if (itemWithPrompt) {
        practicePrompt = {
          title: itemWithPrompt.practice_prompt_title,
          description: itemWithPrompt.practice_prompt_description,
          estimatedTime: itemWithPrompt.practice_prompt_time || '2 minutes'
        };
      } else {
        // Use the action item itself as a prompt
        practicePrompt = {
          title: actionItems[0].title,
          description: actionItems[0].details?.what_to_do || 'Focus on this in your next recording',
          estimatedTime: '2 minutes'
        };
      }
    }

    // Determine reminder tone based on commitment level
    const commitmentMessages = {
      casual: {
        subject: 'Time for a quick practice session?',
        intro: 'It\'s been a while since your last practice.'
      },
      regular: {
        subject: 'Keep your momentum going!',
        intro: 'Don\'t let your progress slip - a quick session keeps skills sharp.'
      },
      intensive: {
        subject: 'Ready for your next rep?',
        intro: 'Consistent practice is key to rapid improvement.'
      },
      default: {
        subject: 'Time to practice?',
        intro: 'Regular practice leads to lasting improvement.'
      }
    };

    const message = commitmentMessages[user.commitment_level] || commitmentMessages.default;

    await sendPracticeReminderEmail({
      userId: user.id,
      userEmail: user.email,
      userName: user.first_name || user.name || null,
      commitmentLevel: user.commitment_level || 'regular',
      daysSinceLastAnalysis: user.days_since_last_analysis || 0,
      practicePrompt,
      subject: message.subject,
      introMessage: message.intro
    });

    logger.info({ email: user.email, commitmentLevel: user.commitment_level, userId: user.id }, '[Scheduled Emails] Practice reminder sent');
    return { success: true };
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, userId: user?.id }, '[Scheduled Emails] Failed to send practice reminder');
    return { success: false, error: error.message };
  }
};

/**
 * Send progress update email to a specific user
 * Helper function that can be called for individual users
 */
export const sendUserProgressUpdate = async (clerkUserId) => {
  try {
    // Get user data and profile in parallel
    // Note: getUserCommunicationProfile internally calls getOrCreateUser, but we'll use userId from userData
    const [userData, profile] = await Promise.all([
      getUserWithOnboarding(clerkUserId),
      getUserCommunicationProfile(clerkUserId)
    ]);
    
    if (!userData?.email || !userData?.id) {
      logger.warn({ clerkUserId }, '[Scheduled Emails] No email or user ID found for user');
      return;
    }

    const metrics = profile?.latest_metrics;
    
    if (!metrics) {
      logger.info({ clerkUserId }, '[Scheduled Emails] No metrics found for user, skipping progress email');
      return;
    }

    // Use userId from userData (already fetched, no need to call getOrCreateUser again)
    const userId = userData.id;

    // Calculate improvement (compare with previous week if available)
    const improvement = null; // TODO: Calculate from historical data
    
    const progressData = {
      analysesCount: profile?.total_analyses || 0,
      improvement,
      topStrength: profile?.top_strength || null,
      topOpportunity: profile?.top_opportunity || null,
      metrics
    };

    await sendProgressUpdateEmail({
      userId,
      userEmail: userData.email,
      userName: userData.first_name || userData.name || null,
      progressData
    });

    logger.info({ email: userData.email, clerkUserId }, '[Scheduled Emails] Progress update sent');
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, clerkUserId }, '[Scheduled Emails] Failed to send progress update to user');
  }
};

/**
 * Send action item reminder to a specific user
 * Helper function that can be called for individual users
 */
export const sendUserActionItemReminder = async (clerkUserId) => {
  try {
    // Get user data and action items in parallel
    const [userData, actionItems] = await Promise.all([
      getUserWithOnboarding(clerkUserId),
      getUserActionItems(clerkUserId, 'pending')
    ]);
    
    if (!userData?.email || !userData?.id) {
      logger.warn({ clerkUserId }, '[Scheduled Emails] No email or user ID found for user');
      return;
    }

    if (!actionItems || actionItems.length === 0) {
      return; // No pending action items
    }

    // Filter action items older than 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const oldActionItems = actionItems.filter(item => {
      const createdAt = new Date(item.created_at || item.analyses?.created_at);
      return createdAt < threeDaysAgo;
    });

    if (oldActionItems.length === 0) {
      return; // No old action items
    }

    // Use userId from userData (already fetched, no need to call getOrCreateUser again)
    const userId = userData.id;

    // Send reminder for the oldest action item
    const oldestItem = oldActionItems[0];
    
    await sendActionItemReminderEmail({
      userId,
      userEmail: userData.email,
      userName: userData.first_name || userData.name || null,
      actionItem: {
        id: oldestItem.id,
        title: oldestItem.title,
        description: oldestItem.details?.what_to_do || oldestItem.details?.why_it_matters || null
      }
    });

    logger.info({ email: userData.email, clerkUserId }, '[Scheduled Emails] Action item reminder sent');
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, clerkUserId }, '[Scheduled Emails] Failed to send action item reminder to user');
  }
};

