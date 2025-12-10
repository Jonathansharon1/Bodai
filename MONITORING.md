# Monitoring & Observability

## Service Level Objectives (SLOs)

### API Availability
- **Target:** 99.9% uptime
- **Measurement:** Successful health check responses
- **Window:** 30 days rolling

### Video Analysis Success Rate
- **Target:** >95% successful analyses
- **Measurement:** Successful video analysis completions / Total video uploads
- **Window:** 7 days rolling

### Response Time
- **P50:** <1s
- **P95:** <5s
- **P99:** <10s
- **Measurement:** API endpoint response times

### Error Rate
- **Target:** <1% of requests result in 5xx errors
- **Measurement:** 5xx responses / Total requests
- **Window:** 1 hour rolling

## Service Level Indicators (SLIs)

### API Health
- Health endpoint: `/api/health`
- Readiness endpoint: `/api/ready`
- Check interval: 30 seconds

### Key Metrics

1. **Request Metrics**
   - Total requests per minute
   - Requests by endpoint
   - Requests by status code (2xx, 4xx, 5xx)
   - Request duration (p50, p95, p99)

2. **Video Analysis Metrics**
   - Video uploads per hour
   - Analysis success rate
   - Analysis duration
   - Gemini API usage (tokens, cost)

3. **Database Metrics**
   - Query duration
   - Connection pool usage
   - Error rate

4. **Storage Metrics**
   - S3 upload success rate
   - S3 upload duration
   - Storage usage

5. **User Metrics**
   - Active users
   - New signups
   - Subscription conversions

## Alert Rules

### Critical Alerts (P0)

1. **API Down**
   - Condition: Health endpoint returns 5xx for 2 consecutive checks
   - Action: Page on-call engineer
   - Notification: Slack, Email, PagerDuty

2. **High Error Rate**
   - Condition: Error rate >5% for 5 minutes
   - Action: Page on-call engineer
   - Notification: Slack, Email, PagerDuty

3. **Database Connection Failure**
   - Condition: Database unreachable for 1 minute
   - Action: Page on-call engineer
   - Notification: Slack, Email, PagerDuty

### Warning Alerts (P1)

1. **Elevated Error Rate**
   - Condition: Error rate >1% for 10 minutes
   - Action: Notify team
   - Notification: Slack

2. **Slow Response Times**
   - Condition: P95 response time >5s for 10 minutes
   - Action: Notify team
   - Notification: Slack

3. **High Video Analysis Failure Rate**
   - Condition: Analysis failure rate >10% for 30 minutes
   - Action: Notify team
   - Notification: Slack

### Info Alerts (P2)

1. **Approaching Rate Limits**
   - Condition: 80% of quota used
   - Action: Log warning
   - Notification: Slack (daily digest)

2. **Storage Usage**
   - Condition: S3 storage >80% of limit
   - Action: Log warning
   - Notification: Slack (daily digest)

## Logging

### Log Levels

- **error:** System errors, exceptions, failures
- **warn:** Warnings, degraded functionality
- **info:** General information, important events
- **debug:** Detailed debugging information

### Structured Logging

All logs use structured JSON format with the following fields:

```json
{
  "level": "info",
  "time": "2025-01-27T10:00:00.000Z",
  "service": "bodai-api",
  "requestId": "req-123",
  "message": "Video analysis completed",
  "userId": "user_abc123",
  "analysisId": "analysis-xyz",
  "duration": 2500
}
```

### Key Events to Log

1. **API Requests**
   - Request start (method, path, userId)
   - Request completion (status, duration)
   - Request errors (error message, stack trace)

2. **Video Analysis**
   - Upload start (userId, fileSize, duration)
   - Analysis start (analysisId, userId)
   - Analysis completion (analysisId, success, duration)
   - Analysis failure (analysisId, error)

3. **Database Operations**
   - Query execution (query type, duration)
   - Connection errors
   - Migration execution

4. **External API Calls**
   - Gemini API calls (tokens, cost, duration)
   - S3 operations (operation, duration, success)
   - Email sends (recipient, type, success)

## Error Tracking

### Sentry Integration (Recommended)

1. Install Sentry SDK
2. Configure error tracking
3. Set up alerting rules
4. Configure release tracking

### Error Categories

1. **Application Errors**
   - Unhandled exceptions
   - API errors (4xx, 5xx)
   - Validation errors

2. **External Service Errors**
   - Gemini API failures
   - S3 upload failures
   - Database connection errors

3. **Integration Errors**
   - Clerk authentication failures
   - Supabase query failures
   - Email delivery failures

## Dashboards

### Production Dashboard

Key widgets:
- Request rate (requests/min)
- Error rate (%)
- Response time (p50, p95, p99)
- Video analysis success rate
- Active users
- Database query performance

### Business Metrics Dashboard

Key widgets:
- New signups
- Active users
- Subscription conversions
- Video analyses per user
- Revenue metrics

## On-Call Runbook

### Common Issues

1. **API Returning 5xx Errors**
   - Check health endpoint
   - Review error logs
   - Check database connectivity
   - Verify external service status

2. **Slow Response Times**
   - Check database query performance
   - Review Gemini API response times
   - Check S3 upload/download speeds
   - Review server resource usage

3. **Video Analysis Failures**
   - Check Gemini API status
   - Verify API key validity
   - Review video file validation
   - Check error logs for specific failures

4. **Database Connection Issues**
   - Verify Supabase status
   - Check connection pool settings
   - Review database query logs
   - Check for connection leaks

### Escalation Path

1. **Level 1:** On-call engineer (responds within 15 minutes)
2. **Level 2:** Senior engineer (if issue not resolved in 30 minutes)
3. **Level 3:** Engineering manager (if issue not resolved in 1 hour)

## Tools & Integrations

### Recommended Tools

- **Logging:** Pino (structured logging)
- **Error Tracking:** Sentry
- **Metrics:** Vercel Analytics, Prometheus (if self-hosted)
- **APM:** New Relic, Datadog (optional)
- **Alerting:** PagerDuty, Slack

### Integration Setup

See individual tool documentation for setup instructions.



