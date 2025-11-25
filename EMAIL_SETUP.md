# Email Notifications Setup Guide

This guide explains how to set up and configure email notifications for BodAI.

## Prerequisites

1. **Resend Account**: Sign up at https://resend.com
2. **Domain Verification** (Recommended): Verify your domain in Resend for better deliverability

## Configuration

### 1. Get Resend API Key

1. Log in to your Resend account
2. Go to **API Keys** section
3. Create a new API key
4. Copy the API key (starts with `re_`)

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Resend Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=BodAI
APP_URL=https://yourdomain.com
```

**Important Notes:**
- `EMAIL_FROM` must be a verified domain in Resend (or use `onboarding@resend.dev` for testing)
- `APP_URL` should be your production domain (used for links in emails)
- For local development, use `http://localhost:3000`

### 3. Database Migration

Run the email notifications migration:

```sql
-- Run the migration file
\i supabase/migration_add_email_notifications.sql
```

Or manually execute the SQL in `supabase/migration_add_email_notifications.sql`

## Email Types

### Immediate (Transactional)
- **Welcome Email**: Sent after user completes onboarding
- **Analysis Complete**: Sent when analysis is ready

### Scheduled (Engagement)
- **Weekly Progress Summary**: Sent every Monday (requires cron job setup)
- **Action Item Reminder**: Sent for incomplete action items older than 3 days (requires cron job setup)

## Setting Up Scheduled Emails

### Option 1: Node Cron (Local/Server)

Install node-cron:
```bash
npm install node-cron
```

Create a cron job file (e.g., `cronJobs.js`):
```javascript
import cron from 'node-cron';
import { sendWeeklyProgressEmails, sendActionItemReminders } from './services/scheduledEmails.js';

// Run every Monday at 9 AM
cron.schedule('0 9 * * 1', () => {
  sendWeeklyProgressEmails();
});

// Run daily at 10 AM
cron.schedule('0 10 * * *', () => {
  sendActionItemReminders();
});
```

### Option 2: Vercel Cron (Vercel Deployment)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-progress",
      "schedule": "0 9 * * 1"
    },
    {
      "path": "/api/cron/action-reminders",
      "schedule": "0 10 * * *"
    }
  ]
}
```

Create API routes:
- `api/cron/weekly-progress.js`
- `api/cron/action-reminders.js`

### Option 3: External Cron Service

Use services like:
- **GitHub Actions** (free, runs on schedule)
- **EasyCron** (paid, reliable)
- **Cron-job.org** (free tier available)

Set up HTTP endpoints that call your scheduled email functions.

## Testing

### Test Email Sending

You can test email sending by:

1. **Manual Test**: Use the Resend dashboard to send test emails
2. **API Test**: Create a test endpoint in your server:

```javascript
app.post('/api/test-email', async (req, res) => {
  const { email } = req.body;
  await sendWelcomeEmail({
    userId: 'test-user-id',
    userEmail: email,
    userName: 'Test User'
  });
  res.json({ success: true });
});
```

### Verify Email Delivery

- Check Resend dashboard for delivery status
- Check `email_notifications` table in database
- Monitor server logs for email sending errors

## User Preferences

Users can manage their email preferences in the Settings page:
- Navigate to `/settings#email-preferences`
- Toggle email notifications on/off
- Toggle marketing emails on/off

## Monitoring

### Email Logs

All sent emails are logged in the `email_notifications` table:
- Check delivery status
- View email history per user
- Monitor bounce rates

### Error Handling

Email sending failures are:
- Logged to console with warnings
- Stored in database with `status: 'failed'`
- Non-blocking (won't break user flow)

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Verify `RESEND_API_KEY` is set correctly
2. **Check From Address**: Must be verified domain or `onboarding@resend.dev`
3. **Check Logs**: Look for error messages in server logs
4. **Check Database**: Verify email preferences are enabled for user

### Emails Going to Spam

1. **Verify Domain**: Use a verified domain in Resend
2. **Set up SPF/DKIM**: Configure DNS records as per Resend instructions
3. **Warm up Domain**: Start with low volume and gradually increase

### Scheduled Emails Not Running

1. **Check Cron Setup**: Verify cron job is running
2. **Check Logs**: Look for scheduled email job logs
3. **Test Manually**: Call scheduled email functions directly to test

## Cost Estimate

- **Free Tier**: 3,000 emails/month
- **Pro Tier**: $20/month for 50,000 emails
- **Scaling**: $0.30 per 1,000 emails beyond 50k

For 1,000 active users sending ~5 emails/month = **$20/month**

## Security & Compliance

- ✅ Email preferences stored in database
- ✅ Unsubscribe links in all emails
- ✅ Respects user preferences before sending
- ✅ GDPR compliant (user can opt-out)
- ✅ Rate limiting recommended for production

## Next Steps

1. Set up Resend account and get API key
2. Add environment variables
3. Run database migration
4. Test email sending
5. Set up scheduled email jobs (if needed)
6. Monitor email delivery rates

