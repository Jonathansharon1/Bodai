# Privacy Policy

**Last Updated:** 2025-01-27

## Data Collection

BodAI collects the following types of data:

### Personal Information
- Email address (via Clerk authentication)
- Name (optional, via Clerk profile)
- Profile image (optional, via Clerk)

### Video Data
- Video recordings uploaded by users
- Video metadata (duration, size, format)
- Analysis results derived from videos

### Usage Data
- Video analysis history
- Practice session data
- Progress metrics and insights
- Action items and reflections

### Technical Data
- IP address
- Browser type and version
- Device information
- Usage patterns

## Data Storage

### Video Storage
- Videos are stored in AWS S3
- Videos are encrypted at rest
- Access is restricted via pre-signed URLs
- Videos are associated with user accounts

### Database Storage
- User data stored in Supabase (PostgreSQL)
- Data is encrypted at rest
- Access is restricted via service role key
- Regular backups are maintained

## Data Usage

We use collected data to:
- Provide video analysis services
- Generate personalized feedback and insights
- Track user progress over time
- Improve our services
- Send important service notifications (if enabled)

## Data Sharing

We do not sell user data. Data may be shared with:
- **Service Providers:**
  - Clerk (authentication)
  - Supabase (database)
  - AWS S3 (video storage)
  - Google Gemini (AI analysis)
  - Resend (email delivery)

All service providers are bound by data processing agreements.

## Data Retention

- **Videos:** Retained until user deletion or account closure
- **Analysis Data:** Retained until user deletion or account closure
- **Account Data:** Retained until account closure
- **Logs:** Retained for 30 days

## User Rights (GDPR/CCPA)

Users have the right to:
1. **Access** - Request a copy of their data
2. **Rectification** - Correct inaccurate data
3. **Erasure** - Delete their data ("Right to be Forgotten")
4. **Portability** - Export their data
5. **Objection** - Object to data processing
6. **Restriction** - Restrict data processing

## Data Deletion

Users can request data deletion by:
1. Using the data deletion endpoint: `DELETE /api/user/data`
2. Contacting support: [support email]
3. Deleting their account through settings

Upon deletion:
- All videos are deleted from S3
- All analysis data is deleted from database
- User account is anonymized or deleted
- Process completes within 30 days

## Data Export

Users can export their data by:
1. Using the data export endpoint: `GET /api/user/data-export`
2. Contacting support: [support email]

Export includes:
- User profile data
- Video analysis history
- Progress metrics
- Action items and reflections

## Cookies

We use cookies for:
- Authentication (via Clerk)
- Session management
- Analytics (if enabled)

Users can control cookies through browser settings.

## Security

We implement security measures including:
- Encryption in transit (HTTPS)
- Encryption at rest
- Access controls
- Regular security audits
- Secure authentication (Clerk)

## Children's Privacy

Our service is not intended for users under 13. We do not knowingly collect data from children.

## Changes to Privacy Policy

We may update this policy. Users will be notified of significant changes via email or in-app notification.

## Contact

For privacy-related inquiries:
- Email: [privacy email]
- Address: [company address]

## Compliance

- **GDPR** - European Union General Data Protection Regulation
- **CCPA** - California Consumer Privacy Act



