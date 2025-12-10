# Deployment Guide

This document provides step-by-step instructions for deploying BodAI to production.

## Pre-Deployment Checklist

- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Frontend builds successfully (`cd client && npm run build`)
- [ ] Security audit shows no critical vulnerabilities
- [ ] Environment variables configured in Vercel
- [ ] Database migrations reviewed and tested
- [ ] Backup strategy confirmed
- [ ] Monitoring and alerts configured

## Environment Variables

### Backend (Root `.env`)

Required variables:
- `API_KEY` - Google Gemini API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_S3_BUCKET_NAME` - S3 bucket name for video storage
- `RESEND_API_KEY` - Resend API key for emails
- `EMAIL_FROM` - Email sender address
- `CLIENT_ORIGIN` - Frontend URL (for CORS)

Optional variables:
- `PORT` - Server port (default: 5000)
- `GEMINI_MODEL` - Gemini model name (default: gemini-3-pro-preview)
- `MAX_VIDEO_SIZE_MB` - Max video size in MB (default: 500)
- `MIN_VIDEO_DURATION_SECONDS` - Min video duration (default: 30)
- `MAX_VIDEO_DURATION_SECONDS` - Max video duration (default: 2700)
- `METRICS_VERSION` - Metrics processor version
- `MONITORING_WEBHOOK_URL` - Webhook URL for monitoring

### Frontend (`client/.env`)

Required variables:
- `REACT_APP_CLERK_PUBLISHABLE_KEY` - Clerk publishable key

Optional variables:
- `REACT_APP_API_URL` - Backend API URL

## Vercel Deployment

### Initial Setup

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link project: `vercel link`
4. Configure environment variables in Vercel dashboard

### Deploy to Staging

```bash
# Deploy to preview/staging
vercel

# Or via GitHub Actions (automatic on push to develop branch)
git push origin develop
```

### Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or via GitHub Actions (automatic on version tag)
git tag v1.0.0
git push origin v1.0.0
```

### Vercel Configuration

The project uses `vercel.json` for configuration:
- API routes are served from `server.js`
- Static files are served from `client/build`
- Environment variables are set in Vercel dashboard

## Database Migrations

### Running Migrations

1. Connect to Supabase SQL Editor
2. Run migrations in order (see `supabase/MIGRATION_ORDER.md`)
3. Verify migrations with: `SELECT * FROM schema_migrations;` (if table exists)

### Migration Order

1. `schema.sql` - Base schema
2. `migration_add_*.sql` - Feature migrations (in chronological order)

### Rollback Procedure

1. Identify the migration to rollback
2. Review migration file for rollback SQL
3. Execute rollback SQL in Supabase SQL Editor
4. Update migration tracking (if applicable)

**Note:** Not all migrations have rollback scripts. Review each migration before rolling back.

## Health Checks

### Health Endpoint

```bash
GET /api/health
```

Returns: `{ ok: true, timestamp: "...", service: "bodai-api" }`

### Readiness Endpoint

```bash
GET /api/ready
```

Returns: `{ ready: true/false, checks: { database: true/false, gemini: true/false } }`

Use these endpoints for:
- Load balancer health checks
- Kubernetes liveness/readiness probes
- Monitoring system checks

## Rollback Procedure

### Quick Rollback (Vercel)

1. Go to Vercel dashboard
2. Navigate to Deployments
3. Find previous working deployment
4. Click "..." → "Promote to Production"

### Database Rollback

1. Identify problematic migration
2. Execute rollback SQL (if available)
3. Verify database state
4. Redeploy previous version

### Code Rollback

```bash
# Revert to previous version
git revert <commit-hash>
git push origin main

# Or checkout previous tag
git checkout v0.9.0
git push origin v0.9.0 --force
```

## Post-Deployment Verification

1. Check health endpoint: `curl https://your-domain.com/api/health`
2. Check readiness endpoint: `curl https://your-domain.com/api/ready`
3. Test critical user flows:
   - User signup/login
   - Video upload and analysis
   - Dashboard loading
   - Subscription flow
4. Monitor error logs in Vercel dashboard
5. Check application metrics

## Monitoring

### Key Metrics to Monitor

- API response times (P95, P99)
- Error rates (4xx, 5xx)
- Video analysis success rate
- Database query performance
- S3 upload/download success rate
- Gemini API usage and costs

### Alert Thresholds

- API availability < 99.9%
- Error rate > 1%
- P95 response time > 5s
- Video analysis failure rate > 5%

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Verify variables are set in Vercel dashboard
   - Check variable names match exactly (case-sensitive)
   - Redeploy after adding variables

2. **Database connection errors**
   - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - Check Supabase project status
   - Verify network connectivity

3. **CORS errors**
   - Verify `CLIENT_ORIGIN` matches frontend URL
   - Check CORS configuration in `server.js`

4. **Build failures**
   - Check Node.js version (should be 20.x)
   - Verify all dependencies are installed
   - Check build logs in Vercel dashboard

## Backup Strategy

### Database Backups

- Supabase provides automatic daily backups
- Manual backups can be created via Supabase dashboard
- Backup retention: 7 days (Supabase free tier)

### S3 Backups

- Videos are stored in S3 with versioning (if enabled)
- Consider enabling S3 lifecycle policies for cost optimization
- Regular backups to separate S3 bucket (optional)

### Code Backups

- Git repository serves as code backup
- Tag releases for easy rollback
- Keep deployment artifacts in Vercel

## Support Contacts

- **Infrastructure Issues:** [Your DevOps Contact]
- **Database Issues:** [Your DBA Contact]
- **Application Issues:** [Your Dev Team Contact]



