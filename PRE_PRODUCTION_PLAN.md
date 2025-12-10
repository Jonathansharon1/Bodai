# Pre-Production Plan for BodAI

**Project:** BodAI - AI Body Language Analyzer and Coach  
**Status:** Ready with Backlog  
**Last Updated:** 2025-01-27

---

## Executive Summary

BodAI is a full-stack application that analyzes body language in videos using Google Gemini AI. The project has completed a comprehensive production readiness audit and is **ready for production deployment with a prioritized backlog of improvements**.

**Current Status:**
- ✅ Core infrastructure in place (CI/CD, health checks, database)
- ✅ Security basics covered (no hardcoded secrets, auth flows verified)
- ✅ Legal compliance ready (GDPR endpoints, privacy policy)
- ⚠️ Some critical items need attention before launch
- 📋 Enhancement backlog for post-launch

---

## Phase 1: Critical Blockers (P0) - MUST DO BEFORE PRODUCTION

### 1.1 Frontend Security Vulnerabilities
**Priority:** P0 - BLOCKER  
**Effort:** 8 hours  
**Risk:** High - 9 vulnerabilities in react-scripts (3 moderate, 6 high)

**Action Items:**
- [ ] Run `npm audit` in `client/` directory to see current vulnerabilities
- [ ] Evaluate options:
  - Option A: Upgrade react-scripts to latest version (if available)
  - Option B: Migrate from Create React App to Vite (recommended for long-term)
- [ ] If migrating to Vite:
  - [ ] Install Vite and related dependencies
  - [ ] Create `vite.config.js`
  - [ ] Update build scripts in `client/package.json`
  - [ ] Update environment variable handling (VITE_ prefix instead of REACT_APP_)
  - [ ] Test build and dev server
  - [ ] Update documentation
- [ ] Run `npm audit fix` after changes
- [ ] Verify no critical vulnerabilities remain

**Files to Modify:**
- `client/package.json`
- `client/vite.config.js` (new)
- `client/index.html` (may need updates)
- `DEPLOYMENT.md` (update build instructions)

---

### 1.2 Implement Structured Logging
**Priority:** P0 - BLOCKER  
**Effort:** 4 hours  
**Risk:** Medium - Currently using console.log, no structured logging

**Action Items:**
- [ ] Review `services/logger.js` (already created)
- [ ] Replace all `console.log()` calls in `server.js` with `logger.info()`
- [ ] Replace all `console.error()` calls with `logger.error()`
- [ ] Replace all `console.warn()` calls with `logger.warn()`
- [ ] Add request ID tracking middleware
- [ ] Add structured context to all log calls (userId, analysisId, etc.)
- [ ] Test logging output in development
- [ ] Verify logs are properly formatted for production

**Files to Modify:**
- `server.js` (all console.* calls)
- `services/*.js` (all console.* calls)
- Add request ID middleware

**Example:**
```javascript
// Before
console.log('Analysis completed');

// After
logger.info({ 
  analysisId, 
  userId, 
  duration 
}, 'Analysis completed');
```

---

### 1.3 Error Tracking Setup (Sentry)
**Priority:** P0 - BLOCKER  
**Effort:** 2 hours  
**Risk:** Medium - No centralized error tracking

**Action Items:**
- [ ] Create Sentry account at sentry.io
- [ ] Install Sentry SDK: `npm install @sentry/node @sentry/react`
- [ ] Configure Sentry in `server.js`:
  - [ ] Initialize Sentry with DSN
  - [ ] Add error handler middleware
  - [ ] Configure release tracking
- [ ] Configure Sentry in `client/src/index.js`:
  - [ ] Initialize Sentry for React
  - [ ] Configure error boundaries
- [ ] Add environment variables:
  - [ ] `SENTRY_DSN` (backend)
  - [ ] `REACT_APP_SENTRY_DSN` (frontend)
- [ ] Test error tracking:
  - [ ] Trigger test error in development
  - [ ] Verify error appears in Sentry dashboard
- [ ] Configure alerting rules in Sentry
- [ ] Update `DEPLOYMENT.md` with Sentry setup instructions

**Files to Modify:**
- `server.js` (add Sentry initialization)
- `client/src/index.js` (add Sentry initialization)
- `package.json` (add Sentry dependencies)
- `client/package.json` (add Sentry dependencies)
- `.env.example` (add Sentry DSN)

---

## Phase 2: Critical Improvements (P1) - SHOULD DO BEFORE PRODUCTION

### 2.1 Environment Variables Documentation & Validation
**Priority:** P1 - CRITICAL  
**Effort:** 2 hours  
**Risk:** High - Missing env vars cause runtime failures

**Action Items:**
- [ ] Create `.env.example` file in root directory with all required variables
- [ ] Create `client/.env.example` file with frontend variables
- [ ] Add environment variable validation on server startup:
  - [ ] Check all required variables are present
  - [ ] Validate format where applicable (URLs, keys)
  - [ ] Exit with clear error message if missing
- [ ] Document all environment variables in `DEPLOYMENT.md`
- [ ] Add validation script: `scripts/validate-env.js`
- [ ] Test with missing variables to verify error messages

**Required Environment Variables:**

**Backend (Root `.env`):**
```env
# Required
API_KEY=                          # Google Gemini API key
SUPABASE_URL=                     # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key
AWS_REGION=                       # AWS region (default: us-east-1)
AWS_ACCESS_KEY_ID=                # AWS access key
AWS_SECRET_ACCESS_KEY=            # AWS secret key
AWS_S3_BUCKET_NAME=               # S3 bucket name
RESEND_API_KEY=                   # Resend API key for emails
EMAIL_FROM=                       # Email sender address
CLIENT_ORIGIN=                    # Frontend URL for CORS

# Optional
PORT=5000
GEMINI_MODEL=gemini-3-pro-preview
MAX_VIDEO_SIZE_MB=500
MIN_VIDEO_DURATION_SECONDS=30
MAX_VIDEO_DURATION_SECONDS=2700
METRICS_VERSION=metrics.v2025.01
MONITORING_WEBHOOK_URL=
SENTRY_DSN=
```

**Frontend (`client/.env`):**
```env
# Required
REACT_APP_CLERK_PUBLISHABLE_KEY=  # Clerk publishable key

# Optional
REACT_APP_API_URL=                # Backend API URL
REACT_APP_SENTRY_DSN=             # Sentry DSN for frontend
```

**Files to Create:**
- `.env.example`
- `client/.env.example`
- `scripts/validate-env.js`

---

### 2.2 Accessibility Audit & Critical Fixes
**Priority:** P1 - CRITICAL  
**Effort:** 16 hours  
**Risk:** Medium - Legal/compliance risk, poor UX for disabled users

**Action Items:**
- [ ] Install accessibility testing tools:
  - [ ] `npm install --save-dev @axe-core/react`
  - [ ] `npm install --save-dev eslint-plugin-jsx-a11y`
- [ ] Run automated audit:
  - [ ] Add axe-core to test suite
  - [ ] Run audit on all pages
  - [ ] Document all violations
- [ ] Fix critical violations:
  - [ ] Add ARIA labels to all interactive elements
  - [ ] Ensure keyboard navigation works on all pages
  - [ ] Fix color contrast issues (WCAG AA minimum)
  - [ ] Add alt text to all images
  - [ ] Ensure form labels are properly associated
- [ ] Test with screen readers (NVDA/JAWS/VoiceOver)
- [ ] Test keyboard-only navigation
- [ ] Update `ACCESSIBILITY.md` with findings and fixes

**Key Areas to Focus:**
- Video upload interface
- Analysis results display
- Navigation menus
- Forms (onboarding, settings)
- Dashboard components

**Files to Review:**
- `client/src/pages/*.jsx`
- `client/src/components/*.jsx`

---

### 2.3 Mobile Responsiveness Testing & Fixes
**Priority:** P1 - CRITICAL  
**Effort:** 8 hours  
**Risk:** Medium - Poor mobile UX affects user adoption

**Action Items:**
- [ ] Test on real devices:
  - [ ] iOS (Safari)
  - [ ] Android (Chrome)
- [ ] Test critical flows:
  - [ ] Sign up / Sign in
  - [ ] Video recording/upload
  - [ ] Viewing analysis results
  - [ ] Dashboard navigation
  - [ ] Settings page
- [ ] Fix responsive issues:
  - [ ] Touch target sizes (minimum 44x44px)
  - [ ] Text readability (font sizes)
  - [ ] Layout breakpoints
  - [ ] Video player controls
  - [ ] Form inputs
- [ ] Test landscape orientation
- [ ] Verify viewport meta tag is correct
- [ ] Document mobile-specific issues in `MOBILE_TESTING.md`

**Files to Review:**
- `client/src/pages/*.jsx`
- `client/src/pages/*.css`
- `client/src/components/*.jsx`
- `client/src/components/*.css`

---

### 2.4 Database Index Audit
**Priority:** P1 - CRITICAL  
**Effort:** 4 hours  
**Risk:** Medium - Performance degradation under load

**Action Items:**
- [ ] Review all database queries in `services/supabaseService.js`
- [ ] Identify slow queries:
  - [ ] Queries with WHERE clauses
  - [ ] Queries with JOINs
  - [ ] Queries with ORDER BY
- [ ] Check existing indexes in Supabase dashboard
- [ ] Create migration for missing indexes:
  - [ ] `users.clerk_user_id` (if not exists)
  - [ ] `analyses.user_id` (if not exists)
  - [ ] `analyses.created_at` (for sorting)
  - [ ] `communication_metrics.user_id` (if not exists)
  - [ ] `communication_metrics.journey_id` (if not exists)
  - [ ] `action_items.user_id` (if not exists)
  - [ ] `action_items.status` (for filtering)
- [ ] Test query performance before/after
- [ ] Document indexes in `supabase/INDEXES.md`

**Files to Create/Modify:**
- `supabase/migration_add_performance_indexes.sql`
- `supabase/INDEXES.md`

---

## Phase 3: Pre-Launch Verification

### 3.1 Production Environment Setup
**Priority:** P0 - BLOCKER  
**Effort:** 4 hours

**Action Items:**
- [ ] Set up Vercel production project
- [ ] Configure all environment variables in Vercel dashboard
- [ ] Set up production Supabase project (separate from dev)
- [ ] Run all database migrations on production database
- [ ] Configure production S3 bucket:
  - [ ] Set up bucket with proper permissions
  - [ ] Configure CORS for production domain
  - [ ] Enable versioning (optional)
  - [ ] Set up lifecycle policies
- [ ] Configure production Clerk application:
  - [ ] Set production publishable key
  - [ ] Configure allowed origins
  - [ ] Set up production webhooks (if needed)
- [ ] Test production build locally:
  - [ ] `npm run build`
  - [ ] Verify build succeeds
  - [ ] Test production server locally
- [ ] Deploy to staging environment first
- [ ] Verify staging deployment works end-to-end

---

### 3.2 Security Hardening
**Priority:** P1 - CRITICAL  
**Effort:** 4 hours

**Action Items:**
- [ ] Review and implement security headers:
  - [ ] Content-Security-Policy (CSP)
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Strict-Transport-Security (HSTS)
  - [ ] Referrer-Policy
- [ ] Add rate limiting to API endpoints:
  - [ ] Install `express-rate-limit`
  - [ ] Configure rate limits per endpoint
  - [ ] Set stricter limits for video upload endpoint
- [ ] Review CORS configuration:
  - [ ] Ensure only production domain is allowed
  - [ ] Remove localhost from production CORS
- [ ] Verify all API endpoints require authentication
- [ ] Review file upload security:
  - [ ] File type validation
  - [ ] File size limits
  - [ ] Malware scanning (optional)
- [ ] Set up security monitoring:
  - [ ] Configure Sentry security alerts
  - [ ] Set up failed login attempt tracking

**Files to Modify:**
- `server.js` (add security headers, rate limiting)

---

### 3.3 Monitoring & Alerting Setup
**Priority:** P1 - CRITICAL  
**Effort:** 6 hours

**Action Items:**
- [ ] Set up Vercel Analytics (if not already)
- [ ] Configure Sentry alerts:
  - [ ] Error rate alerts
  - [ ] New issue alerts
  - [ ] Performance degradation alerts
- [ ] Set up health check monitoring:
  - [ ] Configure uptime monitoring service (UptimeRobot, Pingdom, etc.)
  - [ ] Set up alerts for `/api/health` endpoint
  - [ ] Set up alerts for `/api/ready` endpoint
- [ ] Configure log aggregation:
  - [ ] Set up Vercel log streaming (or alternative)
  - [ ] Configure log retention policies
- [ ] Create monitoring dashboard:
  - [ ] Key metrics (requests, errors, response times)
  - [ ] Video analysis success rate
  - [ ] Database query performance
- [ ] Test alerting:
  - [ ] Trigger test alert
  - [ ] Verify notification channels work
- [ ] Document on-call procedures in `ON_CALL.md`

**Files to Create:**
- `ON_CALL.md`

---

### 3.4 Final Testing Checklist
**Priority:** P0 - BLOCKER  
**Effort:** 8 hours

**Action Items:**
- [ ] **Functional Testing:**
  - [ ] User signup flow
  - [ ] User login flow
  - [ ] Onboarding completion
  - [ ] Video upload and analysis
  - [ ] Viewing analysis results
  - [ ] Dashboard functionality
  - [ ] Settings page
  - [ ] Subscription flow (if applicable)
  - [ ] Email notifications
  - [ ] Data export (GDPR)
  - [ ] Data deletion (GDPR)

- [ ] **Performance Testing:**
  - [ ] Page load times (< 3s)
  - [ ] API response times (P95 < 5s)
  - [ ] Video upload performance
  - [ ] Analysis processing time

- [ ] **Security Testing:**
  - [ ] Authentication required for protected routes
  - [ ] Users can only access their own data
  - [ ] File upload validation works
  - [ ] CORS configuration is correct
  - [ ] No sensitive data in client-side code

- [ ] **Browser Testing:**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

- [ ] **Mobile Testing:**
  - [ ] iOS Safari
  - [ ] Android Chrome
  - [ ] Touch interactions
  - [ ] Responsive layouts

- [ ] **Error Handling:**
  - [ ] Network failures
  - [ ] API errors
  - [ ] Invalid inputs
  - [ ] Missing data

---

## Phase 4: Documentation & Handoff

### 4.1 Update Documentation
**Priority:** P1 - CRITICAL  
**Effort:** 4 hours

**Action Items:**
- [ ] Update `README.md`:
  - [ ] Production deployment instructions
  - [ ] Environment variables
  - [ ] Known issues
- [ ] Update `DEPLOYMENT.md`:
  - [ ] Production deployment steps
  - [ ] Rollback procedures
  - [ ] Environment variable checklist
- [ ] Create `PRODUCTION_RUNBOOK.md`:
  - [ ] Common issues and solutions
  - [ ] Escalation procedures
  - [ ] Contact information
- [ ] Update `ARCHITECTURE.md` with latest changes
- [ ] Document API endpoints in `API_DOCUMENTATION.md`
- [ ] Create `CHANGELOG.md` for version tracking

**Files to Create/Update:**
- `PRODUCTION_RUNBOOK.md`
- `API_DOCUMENTATION.md`
- `CHANGELOG.md`
- Update existing docs

---

### 4.2 Create Deployment Checklist
**Priority:** P0 - BLOCKER  
**Effort:** 1 hour

**Action Items:**
- [ ] Create `DEPLOYMENT_CHECKLIST.md` with:
  - [ ] Pre-deployment steps
  - [ ] Deployment steps
  - [ ] Post-deployment verification
  - [ ] Rollback steps

**Files to Create:**
- `DEPLOYMENT_CHECKLIST.md`

---

## Summary & Timeline

### Estimated Effort by Phase

| Phase | Items | Estimated Hours |
|-------|-------|----------------|
| Phase 1: Critical Blockers (P0) | 3 items | 14 hours |
| Phase 2: Critical Improvements (P1) | 4 items | 30 hours |
| Phase 3: Pre-Launch Verification | 4 items | 22 hours |
| Phase 4: Documentation | 2 items | 5 hours |
| **TOTAL** | **13 items** | **~71 hours** |

### Recommended Timeline

**Week 1: Critical Blockers**
- Days 1-2: Frontend security vulnerabilities (8h)
- Day 3: Structured logging (4h)
- Day 4: Error tracking setup (2h)

**Week 2: Critical Improvements**
- Days 1-2: Environment variables & validation (2h)
- Days 3-5: Accessibility audit & fixes (16h)
- Days 6-7: Mobile responsiveness (8h)
- Day 8: Database index audit (4h)

**Week 3: Pre-Launch**
- Days 1-2: Production environment setup (4h)
- Days 3-4: Security hardening (4h)
- Days 5-6: Monitoring & alerting (6h)
- Days 7-8: Final testing (8h)

**Week 4: Documentation & Launch**
- Days 1-2: Documentation updates (4h)
- Day 3: Deployment checklist (1h)
- Days 4-5: Final review & staging deployment
- Day 6: Production deployment

**Total: ~4 weeks to production-ready**

---

## Post-Launch Backlog (P2/P3)

These items can be addressed after launch:

### P2 - Important (First Month)
- Comprehensive test coverage expansion
- Load testing and performance baselines
- Monitoring dashboard setup
- Performance optimizations (caching, bundle size)

### P3 - Nice-to-have (Future)
- Advanced observability (OpenTelemetry)
- Enhanced security headers
- API rate limiting (if needed)
- Automated backup testing

---

## Risk Assessment

### High Risk Items
1. **Frontend Security Vulnerabilities** - Could expose users to attacks
2. **Missing Environment Variables** - Causes runtime failures
3. **No Error Tracking** - Difficult to debug production issues

### Medium Risk Items
1. **Accessibility Issues** - Legal/compliance risk
2. **Mobile Responsiveness** - Poor UX affects adoption
3. **Database Performance** - Degrades under load

### Low Risk Items
1. **Documentation** - Can be updated post-launch
2. **Advanced Monitoring** - Basic monitoring sufficient initially

---

## Success Criteria

Before going to production, ensure:

- [ ] All P0 items completed
- [ ] All P1 items completed
- [ ] Production environment configured and tested
- [ ] All critical user flows tested and working
- [ ] Monitoring and alerting configured
- [ ] Documentation updated
- [ ] Deployment checklist created and followed
- [ ] Staging deployment successful
- [ ] Team trained on production procedures

---

## Notes

- This plan is based on the production readiness audit completed on 2025-01-27
- All estimates are approximate and may vary based on team experience
- Some items can be done in parallel (e.g., documentation while testing)
- Consider doing a soft launch with limited users before full production
- Monitor closely for the first week after launch

---

**Next Steps:**
1. Review this plan with the team
2. Prioritize items based on business needs
3. Assign owners to each item
4. Set up project tracking (GitHub Projects, Jira, etc.)
5. Begin execution starting with Phase 1


