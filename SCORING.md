# BodAI Scoring System Documentation

This document explains how BodAI calculates and processes communication scores, covering both the user-facing experience and the technical implementation.

---

## Table of Contents

1. [Non-Technical Overview](#non-technical-overview)
2. [What Users See](#what-users-see)
3. [Technical Architecture](#technical-architecture)
4. [Scoring Pipeline](#scoring-pipeline)
5. [Configuration & Weights](#configuration--weights)
6. [Examples & Edge Cases](#examples--edge-cases)

---

## Non-Technical Overview

### What is Scoring?

When you upload a practice video, BodAI's AI analyzes your communication across **25+ specific micro-skills** (like eye contact, vocal pace, filler word usage, etc.). These micro-skills are grouped into **6 main categories**:

1. **Presence** - How you physically present yourself (eye contact, posture, gestures)
2. **Voice** - How you use your voice (volume, tone, pace, articulation)
3. **Clarity** - How clearly you communicate (structure, focus, examples)
4. **Authenticity** - How genuine you appear (naturalness, emotional transparency)
5. **Impact** - How engaging you are (energy, engagement, persuasiveness)
6. **Confidence** - How confident you appear (filler words, pauses, tension)

Each category gets a score from **0-10**, and these combine into an **Overall Score** from **0-100** that determines your **Stage Title** (e.g., "Emerging Communicator" or "Master Communicator").

### Why Not Just Use AI Scores Directly?

BodAI doesn't just show you raw AI scores. Instead, it processes them through a sophisticated system that:

- **Normalizes scores** against thousands of other users, so a "7" means the same thing for everyone
- **Compares to your personal baseline** (your first few analyses) to show real improvement
- **Prevents unrealistic jumps** - if your score suddenly jumps 5 points, the system validates it's real improvement, not an AI inconsistency
- **Personalizes for your goal** - if you're practicing for job interviews, clarity and presence matter more than if you're practicing for dating

This ensures scores are **fair, consistent, and meaningful** for tracking your progress over time.

---

## What Users See

### Score Display

After analysis, users see:

1. **Overall Score** (0-100) - A single number representing overall communication quality
2. **Stage Title** - A descriptive label based on overall score:
   - 96-100: "Master Communicator"
   - 86-95: "Confident Communicator"
   - 76-85: "Expressive Communicator"
   - 61-75: "Developing Communicator"
   - 41-60: "Emerging Communicator"
   - 0-40: "Beginning Communicator"

3. **Category Scores** (0-10 each) - Six scores for Presence, Voice, Clarity, Authenticity, Impact, and Confidence

4. **Progress Indicators** - Visual charts showing:
   - Trends over time (improving, declining, stable)
   - Comparison to personal baseline
   - Weakest areas to focus on

### What Scores Mean

- **0-4**: Significant room for improvement in this area
- **5-6**: Developing skills, making progress
- **7-8**: Strong performance, minor refinements possible
- **9-10**: Excellent, near mastery

### Personalization

Scores are automatically adjusted based on your **primary goal** set during onboarding:

- **Job Interviews**: Clarity and Presence weighted higher
- **Dating**: Authenticity and Presence weighted higher
- **Presentations**: Impact and Voice weighted higher
- **Leadership**: Impact and Presence weighted higher
- **Confidence Building**: Confidence and Presence weighted higher

This means two users with identical raw performance might see slightly different scores if their goals emphasize different skills.

---

## Technical Architecture

### System Components

The scoring system consists of three main components:

1. **`services/scoringService.js`** - Core processing logic (normalization, validation, aggregation)
2. **`services/scoringConfig.js`** - Configuration (weights, thresholds, stage titles)
3. **`server.js`** - Orchestration (calls scoring service, saves results)

### Data Flow

```
AI Analysis (Gemini)
    ↓
Raw Sub-Scores (25+ micro-metrics)
    ↓
[Step 1] Global Normalization
    ↓
[Step 2] Baseline Comparison
    ↓
[Step 3] Jump Validation
    ↓
[Step 4] Anti-Jump Rules
    ↓
Processed Sub-Scores
    ↓
[Step 5] Category Aggregation (with goal-specific weights)
    ↓
Category Scores (6 categories, 0-10 each)
    ↓
[Step 6] Overall Score Calculation
    ↓
Overall Score (0-100) + Stage Title
    ↓
Database Storage + User Display
```

---

## Scoring Pipeline

### Step 1: Global Normalization

**Purpose**: Ensure scores are comparable across all users by normalizing against population statistics.

**How it works**:
- Each sub-metric (e.g., `voice_volume_stability`) has global statistics stored in the `global_stats` table (mean, standard deviation, percentiles)
- Raw AI scores are converted to z-scores: `z = (rawScore - mean) / stdDev`
- Z-scores are scaled to 0-10 range: `normalized = (z * 2) + 5`
- Scores are clamped to stay within 0-10 bounds

**Example**:
- Raw AI score: 7.5
- Global mean: 6.2, std dev: 1.8
- Z-score: (7.5 - 6.2) / 1.8 = 0.72
- Normalized: (0.72 * 2) + 5 = 6.44

**Code Reference**: `services/scoringService.js:22-45` (`normalizeScore`)

### Step 2: Baseline Comparison

**Purpose**: Reward improvement and penalize regression relative to the user's starting point.

**How it works**:
- Each user has a personal baseline calculated from their first 2-3 analyses
- The system compares the normalized score to the baseline
- **Improvement bonus**: If score improves by >20% vs baseline, add +0.5 (capped at 10)
- **Regression penalty**: If score declines by >20% vs baseline, subtract -0.5 (floored at 0)

**Example**:
- Normalized score: 7.0
- Baseline: 5.5
- Improvement: (7.0 - 5.5) / 5.5 = 27% (>20% threshold)
- Adjusted score: 7.0 + 0.5 = 7.5

**Code Reference**: `services/scoringService.js:154-186` (`applyBaselineComparison`)

### Step 3: Jump Validation

**Purpose**: Detect unrealistic score changes that might indicate AI inconsistency rather than real improvement.

**How it works**:
- Compares new score to previous 3 analyses
- Detects "jumps" (changes >2 points)
- Classifies severity:
  - **Minor**: 2-3 point change (acceptable)
  - **Major**: 3-5 point change (requires validation)
  - **Extreme**: >5 point change (requires strong evidence)
- Checks if jump aligns with existing trend (improving/declining/stable)

**Example**:
- Previous scores: [6.0, 6.2, 6.1] (stable trend)
- New score: 9.5 (extreme jump, against trend)
- Result: Flagged for anti-jump rules

**Code Reference**: `services/scoringService.js:194-250` (`validateScoreJump`)

### Step 4: Anti-Jump Rules

**Purpose**: Prevent unrealistic score changes from being displayed, while allowing legitimate improvements.

**How it works**:
- **Minor jumps (2-3 points)**: Always accepted
- **Major/Extreme jumps**: 
  - If AI provided detailed explanation (>50 characters), accept the score
  - Otherwise, cap the change at ±2.5 points from previous score

**Example**:
- Previous score: 6.0
- New score: 9.5 (extreme jump)
- AI explanation: "User demonstrated significantly improved eye contact and vocal projection" (good explanation)
- Result: Score accepted (9.5)

**Example (no explanation)**:
- Previous score: 6.0
- New score: 9.5 (extreme jump)
- AI explanation: None or too short
- Result: Score capped at 6.0 + 2.5 = 8.5

**Code Reference**: `services/scoringService.js:79-146` (`applyAntiJumpRules`)

### Step 5: Category Aggregation

**Purpose**: Combine multiple sub-metrics into a single category score, weighted by importance and user goal.

**How it works**:
- Each category has 3-5 sub-metrics (e.g., Voice has: volume_stability, tone_variation, pace_control, articulation, warmth)
- Sub-metrics are weighted by importance (defined in `scoringConfig.js`)
- Weights are adjusted based on user's primary goal
- Category score = weighted average of sub-metric scores

**Example - Voice Category**:
- Sub-scores: volume_stability=7.5, tone_variation=6.8, pace_control=7.2, articulation=6.5, warmth=7.0
- Default weights: [0.20, 0.20, 0.25, 0.20, 0.15]
- If user goal is "presentation", Voice gets +15% multiplier
- Adjusted weights: [0.23, 0.23, 0.29, 0.23, 0.17] (normalized)
- Category score: (7.5×0.23) + (6.8×0.23) + (7.2×0.29) + (6.5×0.23) + (7.0×0.17) = 7.0

**Code Reference**: 
- `services/scoringConfig.js:133-148` (`calculateCategoryScore`)
- `services/scoringConfig.js:102-125` (`getWeightsForGoal`)

### Step 6: Overall Score Calculation

**Purpose**: Combine six category scores into a single overall score (0-100) and assign a stage title.

**How it works**:
- Category weights (fixed, not goal-dependent):
  - Voice: 15%
  - Presence: 15%
  - Clarity: 15%
  - Authenticity: 15%
  - Impact: 20%
  - Confidence: 20%
- Overall score = weighted average × 10 (to scale 0-10 → 0-100)
- Stage title assigned based on overall score thresholds

**Example**:
- Category scores: voice=7.0, presence=7.5, clarity=6.8, authenticity=7.2, impact=7.8, confidence=7.3
- Weighted average: (7.0×0.15) + (7.5×0.15) + (6.8×0.15) + (7.2×0.15) + (7.8×0.20) + (7.3×0.20) = 7.3
- Overall score: 7.3 × 10 = 73
- Stage title: "Developing Communicator" (61-75 range)

**Code Reference**: 
- `services/scoringConfig.js:155-179` (`calculateOverallScore`)
- `services/scoringConfig.js:186-193` (`getStageTitle`)

---

## Configuration & Weights

### Sub-Metric Weights (Default)

Each category has default weights for its sub-metrics:

**Voice**:
- Volume Stability: 20%
- Tone Variation: 20%
- Pace Control: 25% (most important)
- Articulation: 20%
- Warmth: 15%

**Presence**:
- Eye Contact: 25% (most important)
- Facial Relaxation: 15%
- Body Posture: 20%
- Hand Naturalness: 15%
- Openness: 25% (most important)

**Clarity**:
- Structure: 25% (most important)
- Focus: 25% (most important)
- Example Usage: 20%
- Transition Quality: 15%
- Repetition Control: 15%

**Authenticity**:
- Naturalness: 40% (most important)
- Emotional Transparency: 35%
- Forced Expression Reduction: 25%

**Impact**:
- Energy: 35% (most important)
- Engagement: 35% (most important)
- Persuasiveness: 30%

**Confidence**:
- Filler Word Control: 20%
- Pause Control: 15%
- Physical Tension: 20%
- Vocal Stability: 20%
- Comfort Level: 25% (most important)

### Goal-Specific Adjustments

When a user has a specific goal, category weights are adjusted:

**Confidence Goal**:
- Confidence: +20%
- Presence: +15%
- Voice: +10%

**Interview Goal**:
- Clarity: +20%
- Presence: +15%
- Confidence: +10%

**Presentation Goal**:
- Impact: +25%
- Voice: +15%
- Presence: +10%

**Dating Goal**:
- Authenticity: +30%
- Presence: +20%
- Voice: +10%

**Leadership Goal**:
- Impact: +20%
- Presence: +15%
- Confidence: +10%

**Communication Goal**:
- Clarity: +15%
- Authenticity: +15%
- Voice: +10%

**Social Goal**:
- Authenticity: +20%
- Presence: +15%
- Voice: +10%

After applying multipliers, weights are normalized to sum to 1.0 for each category.

**Code Reference**: `services/scoringConfig.js:49-95` (`GOAL_WEIGHT_ADJUSTMENTS`)

### Overall Score Category Weights

These are fixed and not goal-dependent:

- Voice: 15%
- Presence: 15%
- Clarity: 15%
- Authenticity: 15%
- Impact: 20% (highest)
- Confidence: 20% (highest)

**Code Reference**: `services/scoringConfig.js:156-163`

---

## Examples & Edge Cases

### Example 1: First-Time User

**Scenario**: User uploads their first video.

**Processing**:
1. No baseline exists → baseline comparison skipped
2. No previous scores → jump validation skipped
3. Global normalization applied
4. Category aggregation with default weights (no goal adjustment if goal not set)
5. Overall score calculated

**Result**: Raw AI scores are normalized and displayed. This becomes the baseline for future analyses.

### Example 2: Consistent Improvement

**Scenario**: User's scores gradually improve over 5 analyses.

**Processing**:
1. Each new score is normalized
2. Compared to baseline (shows improvement)
3. Jump validation detects small, consistent improvements (2-3 points)
4. Minor jumps accepted without capping
5. Scores reflect steady progress

**Result**: User sees realistic, encouraging progress over time.

### Example 3: Sudden Jump (Legitimate)

**Scenario**: User practices intensively and improves dramatically (e.g., 6.0 → 9.0).

**Processing**:
1. Score normalized
2. Compared to baseline (significant improvement)
3. Jump validation detects extreme jump (3 points)
4. AI provides detailed explanation: "User demonstrated mastery of eye contact techniques, eliminated all filler words, and showed confident body language throughout"
5. Explanation is >50 characters → score accepted

**Result**: User sees their dramatic improvement reflected accurately.

### Example 4: Sudden Jump (Questionable)

**Scenario**: User's score jumps 4 points with no clear reason.

**Processing**:
1. Score normalized
2. Compared to baseline
3. Jump validation detects major jump
4. AI provides minimal explanation: "Good performance"
5. Explanation is <50 characters → score capped at previous + 2.5

**Result**: Score is adjusted to prevent unrealistic jumps, protecting score integrity.

### Example 5: Goal-Specific Weighting

**Scenario**: Two users with identical raw performance, different goals.

**User A** (Interview goal):
- Raw scores: voice=7.0, presence=7.5, clarity=8.0, authenticity=7.0, impact=7.0, confidence=7.5
- Weights adjusted: Clarity +20%, Presence +15%, Confidence +10%
- Final category scores: voice=7.0, presence=7.7, clarity=8.2, authenticity=7.0, impact=7.0, confidence=7.7
- Overall: 75.5

**User B** (Dating goal):
- Raw scores: Same as User A
- Weights adjusted: Authenticity +30%, Presence +20%, Voice +10%
- Final category scores: voice=7.1, presence=7.7, clarity=8.0, authenticity=7.3, impact=7.0, confidence=7.5
- Overall: 75.3

**Result**: Slightly different scores reflect goal-specific priorities.

### Example 6: Regression Detection

**Scenario**: User's score drops significantly (e.g., 8.0 → 5.5).

**Processing**:
1. Score normalized
2. Compared to baseline (regression detected)
3. Jump validation detects extreme jump (2.5 points down)
4. AI explanation checked
5. If no good explanation, score floored at previous - 2.5 = 5.5 (already at floor)
6. Regression penalty applied: -0.5 (if >20% decline)

**Result**: Score reflects regression while preventing unrealistic drops.

### Edge Case: Missing Global Stats

**Scenario**: New sub-metric has no global statistics yet.

**Processing**:
- `normalizeScore` checks for global stats
- If missing, returns raw score unchanged
- Processing continues with unnormalized score

**Result**: System degrades gracefully, still provides scores.

### Edge Case: Missing Baseline

**Scenario**: User's baseline calculation failed or is incomplete.

**Processing**:
- `applyBaselineComparison` checks for baseline
- If missing, returns score unchanged (no bonus/penalty)
- Processing continues normally

**Result**: Scores still calculated, just without baseline comparison benefits.

### Edge Case: First Analysis After Long Break

**Scenario**: User hasn't uploaded in months, previous scores are old.

**Processing**:
- Previous scores still used for jump validation
- If jump is extreme and against trend, may be capped
- Baseline remains from original analyses (not recalculated)

**Result**: System protects against unrealistic jumps even after breaks.

---

## Technical Implementation Details

### Processing Function

The main entry point is `processAnalysisMetrics()` in `services/scoringService.js`:

```javascript
processAnalysisMetrics({
  rawSubScores,      // From AI (25+ sub-metrics)
  userBaseline,      // User's personal baseline
  globalStatsMap,    // Population statistics
  previousMetrics,   // Last 3 analyses
  userGoal          // 'confidence', 'interview', etc.
})
```

**Returns**:
```javascript
{
  subScores: {...},           // Processed sub-metrics
  categoryScores: {...},      // 6 category scores (0-10)
  overallScore: 73.5,         // Overall score (0-100)
  stageTitle: "Developing...", // Stage label
  validationResults: {...},   // Audit trail
  processingVersion: "processor.v2025.01"
}
```

### Versioning

The scoring system is versioned (`METRICS_PROCESSOR_VERSION = 'processor.v2025.01'`) to allow:
- Tracking which algorithm produced each score
- Future algorithm improvements without breaking historical data
- A/B testing different scoring approaches

### Validation Metadata

Every processed score includes validation metadata:
- Raw score (from AI)
- Normalized score (after global normalization)
- Baseline score (user's baseline)
- Previous score (for jump detection)
- Adjustment reason (if score was modified)
- Jump validation result

This metadata is stored in the database for transparency and debugging.

### Backward Compatibility

If the AI doesn't provide structured `subScores`, the system falls back to using the AI's direct category scores without processing. This ensures compatibility with older model versions or edge cases.

**Code Reference**: `server.js:699-759`

---

## Summary

BodAI's scoring system transforms raw AI observations into fair, consistent, and meaningful scores through:

1. **Global normalization** - Ensures comparability across users
2. **Baseline comparison** - Rewards improvement, penalizes regression
3. **Jump validation** - Prevents unrealistic score changes
4. **Goal personalization** - Adjusts weights based on user objectives
5. **Transparent processing** - Full audit trail of all adjustments

This multi-layered approach ensures that scores accurately reflect communication quality while remaining stable and trustworthy for long-term progress tracking.

