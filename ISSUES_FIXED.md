# Issues Fixed - December 6, 2025

## ✅ Issue #1: `supabase is not defined` Error

### Error
```
Error updating user preferences: ReferenceError: supabase is not defined
    at file:///.../server.js:1511:23
```

### Root Cause
In `server.js` line 1511, the code was trying to use `supabase` directly, but it wasn't imported. The `supabase` client is exported from `services/supabaseService.js` but wasn't imported in `server.js`.

### Fix Applied
✅ Added `supabase` to the imports from `services/supabaseService.js` in `server.js`:

```javascript
import { 
  // ... other imports
  supabase
} from './services/supabaseService.js';
```

### Status
✅ **FIXED** - The error should no longer occur when updating user preferences.

---

## ⚠️ Issue #2: Communication Metrics Always Empty

### Problem
Communication metrics appear empty in the frontend, even though they're being saved to the database.

### Investigation

Looking at your terminal logs, I can see:
- ✅ Metrics ARE being saved successfully: `[analyze-video] Communication metrics saved successfully`
- ✅ Metrics ARE being returned from the database: `[getUserCommunicationMetrics] Returning 8 metrics for journeyId: none`

### Root Cause Analysis

The issue is likely a **journeyId mismatch**:

1. **When NO journeyId is provided**: The query returns 8 metrics (as seen in logs)
2. **When a journeyId IS provided**: The query filters by that specific journeyId, and if metrics were saved with a different journeyId (or no journeyId), they won't show up

### Possible Scenarios

**Scenario A: Metrics saved without journeyId, but frontend queries with journeyId**
- Metrics are saved with `journey_id = NULL`
- Frontend queries with `journeyId = 'a68ef0cf-b82f-45e3-82ef-dd6426476743'`
- Result: No metrics returned (because `NULL ≠ 'a68ef0cf...'`)

**Scenario B: Metrics saved with one journeyId, but frontend queries with different journeyId**
- Metrics saved with `journey_id = 'journey-1'`
- Frontend queries with `journeyId = 'journey-2'`
- Result: No metrics returned

**Scenario C: Frontend always passes journeyId, but some metrics were saved before journeyId was implemented**
- Older metrics have `journey_id = NULL`
- Frontend always queries with a journeyId
- Result: Only new metrics show up, old ones are hidden

### How to Debug

1. **Check what journeyId is being used when saving metrics:**
   Look for this log: `[analyze-video] Saving metrics with journeyId: ...`

2. **Check what journeyId is being used when querying:**
   Look for this log: `[getUserCommunicationMetrics] Fetching metrics with journeyId: ...`

3. **Check the database directly:**
   ```sql
   SELECT id, journey_id, overall_score, created_at 
   FROM communication_metrics 
   WHERE user_id = 'YOUR_USER_ID'
   ORDER BY created_at DESC;
   ```

4. **Check if metrics exist without journeyId:**
   ```sql
   SELECT COUNT(*) as total,
          COUNT(journey_id) as with_journey,
          COUNT(*) - COUNT(journey_id) as without_journey
   FROM communication_metrics 
   WHERE user_id = 'YOUR_USER_ID';
   ```

### Potential Fixes

#### Fix 1: Query metrics without journeyId filter (if no journeyId provided)
The code already does this, but verify the frontend isn't always passing a journeyId.

#### Fix 2: Update old metrics to have a journeyId
If you have metrics without a journeyId, you could update them:
```sql
-- Set journeyId for metrics that don't have one (use default journey)
UPDATE communication_metrics cm
SET journey_id = (
  SELECT id FROM user_journeys 
  WHERE user_id = cm.user_id 
  AND is_default = true 
  LIMIT 1
)
WHERE journey_id IS NULL;
```

#### Fix 3: Modify query to include metrics without journeyId when querying with journeyId
This would require changing the query logic to be more inclusive.

### Recommended Action

1. **Check browser console** when loading the dashboard/progress page:
   - Look for the API call to `/api/communication/metrics` or `/api/communication/progress`
   - Check what `journeyId` parameter is being sent
   - Check the response - does it have `metrics: []` or `metrics: [...]`?

2. **Check server logs** when loading the page:
   - Look for `[getUserCommunicationMetrics] Fetching metrics with journeyId: ...`
   - Look for `[getUserCommunicationMetrics] Returning X metrics for journeyId: ...`

3. **Verify metrics exist in database:**
   Run the SQL queries above to see what's actually in the database.

### Status
⚠️ **NEEDS INVESTIGATION** - The code appears correct, but there's likely a data/journeyId mismatch. Please check the debugging steps above.

---

## Summary

- ✅ **Issue #1 (supabase not defined)**: FIXED
- ⚠️ **Issue #2 (empty metrics)**: Needs debugging to identify the exact cause (likely journeyId mismatch)

