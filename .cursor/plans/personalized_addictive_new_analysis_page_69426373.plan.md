# Personalized & Addictive New Analysis Page

## Goal
Transform the "New Analysis" page into a personalized coaching hub that motivates users through smart streaks, personalized focus, and data-driven challenges.

## Core Features

### 1. Hero Focus Card (The Mission)
*Replaces the generic "Next Steps" list.*
- **Primary Focus:** The #1 most critical action item displayed as a high-impact "Mission Card".
  - **Visual:** Gradient background, large icon, specific "Why it matters".
  - **Action:** "Practice This" button launching the drill.
- **Secondary Focus:** A smaller row below the Hero Card for the 2nd action item (keeping it visible but secondary).

### 2. Smart Streak Tracker (Gamification)
*New section adapting to user's commitment.*
- **Logic:** Streak calculation depends on the `practice_commitment` set during onboarding.
  - **Intensive (Daily):** Counts consecutive days.
  - **Regular (3x/Week):** Counts consecutive weeks with ≥3 uploads.
  - **Casual (1x/Week):** Counts consecutive weeks with ≥1 upload.
- **Visual:** "🔥 5 Day Streak" or "🔥 3 Week Streak" + Progress bar for current period (e.g., "2/3 videos this week").

### 3. "Beat Your Best" Challenge
*Dynamic goal setting.*
- **Overall Challenge:** "Beat your best: 7.2".
- **Metric Challenge:** "Get Presence above 6.0" (based on lowest recent metric).

### 4. Personalized Pre-Flight Checklist
*Replaces static "Recording Tips".*
- **Content:** 3 checklist items generated dynamically based on the user's *weakest* historical metrics.
  - *Example:* If `Voice` is low -> "Check your pace."

## Technical Implementation

### Phase 1: Backend Data Fixes (Completed)
*Ensure `practice_commitment` is saved and retrieved.*
1.  **`services/supabaseService.js`**:
    -   Update `saveOnboardingAnswers` to save `practiceCommitment` to `users` table.
    -   Update `getUserWithOnboarding` to select `practice_commitment`.

### Phase 2: Frontend Data Flow (Completed)
1.  **`client/src/AppRouter.jsx`**:
    -   Update `checkOnboarding` to include `practiceCommitment` in the `userContext` passed to `AnalysisPage`.
2.  **`client/src/pages/AnalysisPage.jsx`**:
    -   Implement `calculateSmartStreak(analyses, frequency)` helper.
    -   Fetch last 10 metrics for trends and weaknesses.

### Phase 3: UI Construction (Completed)
1.  **Components**: Create `HeroFocusCard`, `SecondaryFocusRow`, `ProgressStats`, `PersonalizedChecklist`.
2.  **Styling**: Apply gradient themes and animations in `AnalysisPage.css`.

## Validation
- **Streak Accuracy:** Verify streak calculates correctly based on "Casual" vs "Intensive" setting.
- **Persistence:** Verify `practice_commitment` persists after refresh.
- **Visual Hierarchy:** Verify Hero Card dominates, Secondary is visible, Streak is clear.
