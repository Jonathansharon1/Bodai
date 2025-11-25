import 'dotenv/config';
import { 
  sendProgressUpdateEmail, 
  sendActionItemReminderEmail 
} from './emailService.js';
import {
  getUserCommunicationProfile,
  getUserActionItems,
  getUserWithOnboarding
} from './supabaseService.js';

/**
 * Send weekly progress update emails to all active users
 * This should be called via a cron job (e.g., every Monday at 9 AM)
 */
export const sendWeeklyProgressEmails = async () => {
  console.log('[Scheduled Emails] Starting weekly progress email job...');
  
  // TODO: Get all active users from database
  // For now, this is a placeholder that would need to be implemented
  // based on your user querying needs
  
  console.log('[Scheduled Emails] Weekly progress email job completed');
};

/**
 * Send action item reminder emails to users with incomplete action items
 * This should be called via a cron job (e.g., daily at 10 AM)
 */
export const sendActionItemReminders = async () => {
  console.log('[Scheduled Emails] Starting action item reminder job...');
  
  // TODO: Get all users with pending action items older than 3 days
  // For now, this is a placeholder that would need to be implemented
  // based on your user querying needs
  
  console.log('[Scheduled Emails] Action item reminder job completed');
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
      console.warn(`[Scheduled Emails] No email or user ID found for user ${clerkUserId}`);
      return;
    }

    const metrics = profile?.latest_metrics;
    
    if (!metrics) {
      console.log(`[Scheduled Emails] No metrics found for user ${clerkUserId}, skipping progress email`);
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

    console.log(`[Scheduled Emails] Progress update sent to ${userData.email}`);
  } catch (error) {
    console.error(`[Scheduled Emails] Failed to send progress update to user ${clerkUserId}:`, error.message);
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
      console.warn(`[Scheduled Emails] No email or user ID found for user ${clerkUserId}`);
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

    console.log(`[Scheduled Emails] Action item reminder sent to ${userData.email}`);
  } catch (error) {
    console.error(`[Scheduled Emails] Failed to send action item reminder to user ${clerkUserId}:`, error.message);
  }
};

