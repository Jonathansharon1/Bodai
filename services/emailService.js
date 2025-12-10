import 'dotenv/config';
import { Resend } from 'resend';
import logger from './logger.js';
import { 
  logEmailSent, 
  getUserEmailPreferences
} from './supabaseService.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@bodai.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'BodAI';
const APP_URL = process.env.APP_URL || process.env.CLIENT_ORIGIN || 'http://localhost:3000';

/**
 * Base function to send an email
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content
 * @param {string} params.text - Plain text content (optional)
 * @param {string} params.emailType - Type of email (for tracking)
 * @param {string} params.userId - User ID (for tracking and preferences)
 * @param {Object} params.metadata - Additional metadata to store
 * @returns {Promise<Object>} Result from Resend API
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  emailType,
  userId = null,
  metadata = {}
}) => {
  // Check if email is enabled for this user
  if (userId) {
    try {
      const preferences = await getUserEmailPreferences(userId);
      if (!preferences || preferences.email_notifications_enabled === false) {
        logger.info({ to, emailType, userId }, '[Email] Skipping email - notifications disabled');
        return { success: false, reason: 'notifications_disabled' };
      }
    } catch (err) {
      logger.warn({ error: err.message, to, userId }, '[Email] Failed to check preferences, sending anyway');
    }
  }

  if (!process.env.RESEND_API_KEY) {
    logger.warn({}, '[Email] RESEND_API_KEY not configured, skipping email send');
    return { success: false, reason: 'not_configured' };
  }

  try {
    logger.info({ emailType, to, from: EMAIL_FROM, userId }, '[Email] Attempting to send email');
    const result = await resend.emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    // Check if the result indicates success
    if (result.error) {
      logger.error({ error: result.error, emailType, to, userId }, '[Email] Resend API returned error');
      throw new Error(result.error.message || JSON.stringify(result.error));
    }

    // Check if we got a valid response
    if (!result.data || !result.data.id) {
      logger.error({ emailType, to, userId, response: result }, '[Email] Resend API returned invalid response');
      throw new Error('Invalid response from Resend API: missing data.id');
    }

    // Log email in database
    if (userId) {
      try {
        await logEmailSent({
          userId,
          emailType,
          recipientEmail: to,
          subject,
          status: 'sent',
          metadata: {
            ...metadata,
            resendId: result.data.id
          }
        });
      } catch (logError) {
        logger.warn({ error: logError.message, emailType, to, userId }, '[Email] Failed to log email');
      }
    }

    logger.info({ emailType, to, resendId: result.data.id, userId }, '[Email] Sent email successfully');
    return { success: true, data: result.data };
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack, emailType, to, userId }, '[Email] Failed to send email');

    // Log failed email
    if (userId) {
      try {
        await logEmailSent({
          userId,
          emailType,
          recipientEmail: to,
          subject,
          status: 'failed',
          metadata: {
            ...metadata,
            error: error.message
          }
        });
      } catch (logError) {
        logger.warn({ error: logError.message, emailType, to, userId }, '[Email] Failed to log failed email');
      }
    }

    return { success: false, error: error.message };
  }
};

/**
 * Generate unsubscribe URL
 */
export const getUnsubscribeUrl = (userId, emailType = null) => {
  const params = new URLSearchParams({ userId });
  if (emailType) params.append('type', emailType);
  return `${APP_URL}/settings?${params.toString()}#email-preferences`;
};

/**
 * Base email template wrapper with header and footer
 */
export const wrapEmailTemplate = (content, options = {}) => {
  const { unsubscribeUrl, userName } = options;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BodAI</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .email-header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    .email-header h1 {
      color: #6366f1;
      margin: 0;
      font-size: 28px;
    }
    .email-content {
      margin-bottom: 30px;
    }
    .email-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #f0f0f0;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #6366f1;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #4f46e5;
    }
    .unsubscribe-link {
      color: #999;
      font-size: 11px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>BodAI</h1>
    </div>
    <div class="email-content">
      ${content}
    </div>
    <div class="email-footer">
      ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}" class="unsubscribe-link">Unsubscribe from these emails</a></p>` : ''}
      <p>© ${new Date().getFullYear()} BodAI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Welcome email template
 */
export const sendWelcomeEmail = async ({ userId, userEmail, userName }) => {
  const content = `
    <h2>Welcome to BodAI! 🎉</h2>
    <p>Hi${userName ? ` ${userName}` : ''},</p>
    <p>We're excited to have you join our community of communicators working to improve their presence and impact.</p>
    <p>BodAI uses advanced AI to analyze your body language, voice, and communication style, giving you personalized feedback to help you shine in any situation.</p>
    <p><strong>Get started:</strong></p>
    <ol>
      <li>Record your first video analysis</li>
      <li>Receive detailed feedback on 25+ communication parameters</li>
      <li>Get personalized action items to improve</li>
    </ol>
    <p style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="button">Start Your First Analysis</a>
    </p>
    <p>If you have any questions, just reply to this email. We're here to help!</p>
    <p>Best,<br>The BodAI Team</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Welcome to BodAI!',
    html: wrapEmailTemplate(content, {
      unsubscribeUrl: getUnsubscribeUrl(userId, 'welcome'),
      userName
    }),
    emailType: 'welcome',
    userId,
    metadata: { userName }
  });
};

/**
 * Analysis complete email template
 */
export const sendAnalysisCompleteEmail = async ({ userId, userEmail, userName, analysisId, overallScore }) => {
  const analysisUrl = `${APP_URL}/analyses/${analysisId}`;
  const content = `
    <h2>Your Analysis is Ready! 📊</h2>
    <p>Hi${userName ? ` ${userName}` : ''},</p>
    <p>Great news! Your video analysis is complete and ready to review.</p>
    ${overallScore ? `<p><strong>Overall Score: ${overallScore.toFixed(1)}/10</strong></p>` : ''}
    <p>You'll find detailed feedback on your:</p>
    <ul>
      <li>Body language and presence</li>
      <li>Voice and delivery</li>
      <li>Clarity and structure</li>
      <li>Authenticity and impact</li>
    </ul>
    <p style="text-align: center;">
      <a href="${analysisUrl}" class="button">View Your Results</a>
    </p>
    <p>Plus, you'll get personalized action items to help you improve for your next recording.</p>
    <p>Keep practicing,<br>The BodAI Team</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Your Analysis is Ready!',
    html: wrapEmailTemplate(content, {
      unsubscribeUrl: getUnsubscribeUrl(userId, 'analysis_complete'),
      userName
    }),
    emailType: 'analysis_complete',
    userId,
    metadata: { analysisId, overallScore }
  });
};

/**
 * Weekly progress summary email template
 */
export const sendProgressUpdateEmail = async ({ userId, userEmail, userName, progressData }) => {
  const { analysesCount, improvement, topStrength, topOpportunity, metrics } = progressData || {};
  const progressUrl = `${APP_URL}/grades`;
  
  const content = `
    <h2>Your Weekly Progress Update 📈</h2>
    <p>Hi${userName ? ` ${userName}` : ''},</p>
    <p>Here's how you're doing this week:</p>
    <ul>
      <li><strong>Analyses completed:</strong> ${analysesCount || 0}</li>
      ${improvement ? `<li><strong>Improvement trend:</strong> ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)} points</li>` : ''}
    </ul>
    ${topStrength ? `<p><strong>Your top strength:</strong> ${topStrength}</p>` : ''}
    ${topOpportunity ? `<p><strong>Focus area:</strong> ${topOpportunity}</p>` : ''}
    <p style="text-align: center;">
      <a href="${progressUrl}" class="button">View Full Progress</a>
    </p>
    <p>Keep up the great work! Consistent practice is the key to improvement.</p>
    <p>Best,<br>The BodAI Team</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Your Weekly Progress Update',
    html: wrapEmailTemplate(content, {
      unsubscribeUrl: getUnsubscribeUrl(userId, 'progress_update'),
      userName
    }),
    emailType: 'progress_update',
    userId,
    metadata: progressData
  });
};

/**
 * Action item reminder email template
 */
export const sendActionItemReminderEmail = async ({ userId, userEmail, userName, actionItem }) => {
  const dashboardUrl = `${APP_URL}/dashboard`;
  const { title, description } = actionItem || {};
  
  const content = `
    <h2>Don't Forget to Practice! 💪</h2>
    <p>Hi${userName ? ` ${userName}` : ''},</p>
    <p>You have an action item waiting for you:</p>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h3 style="margin-top: 0;">${title || 'Practice Item'}</h3>
      ${description ? `<p>${description}</p>` : ''}
    </div>
    <p style="text-align: center;">
      <a href="${dashboardUrl}" class="button">View Action Items</a>
    </p>
    <p>Remember, small consistent practice leads to big improvements!</p>
    <p>Best,<br>The BodAI Team</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Reminder: Practice Your Action Items',
    html: wrapEmailTemplate(content, {
      unsubscribeUrl: getUnsubscribeUrl(userId, 'action_item_reminder'),
      userName
    }),
    emailType: 'action_item_reminder',
    userId,
    metadata: { actionItemId: actionItem?.id, actionItemTitle: title }
  });
};

/**
 * Practice reminder email based on commitment level
 */
export const sendPracticeReminderEmail = async ({ 
  userId, 
  userEmail, 
  userName, 
  commitmentLevel,
  daysSinceLastAnalysis,
  practicePrompt,
  subject,
  introMessage
}) => {
  const analysisUrl = `${APP_URL}/new-analysis`;
  
  const practicePromptSection = practicePrompt ? `
    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #0ea5e9;">
      <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #0369a1; font-weight: 600;">Quick Exercise for Today</p>
      <h3 style="margin: 0 0 12px; color: #0c4a6e; font-size: 18px;">${practicePrompt.title}</h3>
      ${practicePrompt.description ? `<p style="margin: 0 0 12px; color: #475569;">${practicePrompt.description}</p>` : ''}
      <p style="margin: 0; font-size: 14px; color: #64748b;">⏱️ ${practicePrompt.estimatedTime}</p>
    </div>
  ` : '';

  const content = `
    <h2>${subject || 'Time to Practice!'}</h2>
    <p>Hi${userName ? ` ${userName}` : ''},</p>
    <p>${introMessage || 'Regular practice is the key to improvement.'}</p>
    ${daysSinceLastAnalysis > 0 ? `<p>It's been <strong>${daysSinceLastAnalysis} day${daysSinceLastAnalysis > 1 ? 's' : ''}</strong> since your last practice session.</p>` : ''}
    ${practicePromptSection}
    <p style="text-align: center;">
      <a href="${analysisUrl}" class="button">Record a Quick Video</a>
    </p>
    <p>Even a 30-second recording can help you improve. Consistency beats perfection!</p>
    <p>Your coach,<br>The BodAI Team</p>
  `;

  return await sendEmail({
    to: userEmail,
    subject: subject || 'Time for a quick practice session?',
    html: wrapEmailTemplate(content, {
      unsubscribeUrl: getUnsubscribeUrl(userId, 'practice_reminder'),
      userName
    }),
    emailType: 'practice_reminder',
    userId,
    metadata: { 
      commitmentLevel, 
      daysSinceLastAnalysis,
      practicePromptTitle: practicePrompt?.title 
    }
  });
};

