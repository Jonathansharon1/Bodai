# My Progress Page – UX & Delivery Blueprint

## 1. Insight & Data Audit
- **Analysis records (`MyAnalysesPage.jsx`)** expose metadata we can reuse for timeline context: `created_at`, `video_filename`, `user_context.primaryGoal`, prompt title/description, and preview URLs when available. These give us the chronological backbone plus goal framing chips/icons we can recycle for visual consistency.
- **Communication metrics (`AnalysisResult.jsx` fetch to `/api/communication/metrics`)** already deliver per-analysis scores such as `presence`, `voice_expression`, `clarity`, `authenticity`, and `confidence`, along with previous metrics for deltas. We can roll these into aggregated KPIs, sparklines, and comparison chips.
- **Narrative insights (`AnalysisResult` parsers + `QuickSummary.jsx`)** yield structured strengths, focus areas, action plans, and quick wins. These objects can be re-surfaced as qualitative highlights, streak trackers (“2 wins repeated”), and reminders.
- **Journeys schema (`supabase/migration_add_user_journeys.sql`)** links every analysis, metric, and action item to `journey_id`, `focus_slug`, and `confidence_level`. This lets us scope progress views per journey or compare across active focuses.
- **Practice prompt richness (`migration_add_practice_prompt_fields.sql`)** means action items may include setup, notice cues, tips, target metric, time, and difficulty—perfect for a “next drill” carousel tied to the user’s weakest metric.
- **Visual tokens**: Analysis cards, gradient buttons, Lucide icons, and layout primitives from dashboard components set a modern baseline that we can extend with soft glassmorphism cards, layered gradients, and micro-animations (hover elevation, progress shimmer).

## 2. Experience Architecture
1. **Hero Momentum Bar** – left column summarizing the user’s journey: latest overall score, % change vs last 3 sessions, goal chip, and a motivational quote derived from `closingEncouragement`. Include CTA to “Record new analysis”.
2. **KPI Grid** – four cards showing Presence, Voice, Clarity, Confidence (any metric available). Each card shows current score, 30-day delta, a mini sparkline built from chronological metrics, and a qualitative tag (“Steady • +0.4”).
3. **Communication Timeline** – stacked bar or line chart mapping sessions in chronological order with ability to filter by journey or prompt. Each node reveals: recording prompt, summary bullet, action status, and quick link to “replay snippet”.
4. **Body & Voice Intelligence** – dual-column module:
   - **Body Language Panel**: heatmap of attention/eye contact, gesture usage, posture flags (needs additional signal extraction; see data gaps below). Provide coach tip overlay.
   - **Vocal Flow Panel**: waveform-style line for pace vs filler words, highlighting moments from transcripts (requires filler-word count per analysis).
5. **Coach Notes & Wins** – carousel of `keyStrengths`, `focusAreas`, and `quickWins` with “pin to home” toggle. Use Lightbulb/Rocket iconography and allow drill-down into full analysis.
6. **Practice & Accountability** – tie `action_items` plus rich practice prompt fields into a Kanban-like row (Upcoming, In progress, Completed). Offer ability to start a guided drill (launching practice prompt).
7. **Self-Reflection Loop** – optional questions after each analysis (“How confident did you feel?” 1–5). Display trend vs AI metrics to foster awareness; store responses in new `self_reflections` table.
8. **Empty/low-data states** – if <2 analyses, show friendly illustration, stats placeholders, and a “What you’ll unlock after your next analysis” list referencing metrics to encourage engagement.

## 3. Visual & Interaction Design
- **Layout**: Two-column responsive grid (max width 1200px). Hero + KPI grid in first fold, timeline stretching full width, then stacked intelligence/practice modules. Breakpoints: ≥1280px (3-column KPI grid), 768–1279px (2-column), <768px single-column with collapsible sections.
- **Styling language**: deep navy background gradient with glass panels (`background: rgba(15,18,37,0.7); backdrop-filter: blur(18px); border: 1px solid rgba(255,255,255,0.08)`). Accent gradients echo existing `btn--primary`. Use Lucide icons sized 18–24 with subtle neon glows.
- **Data viz**: 
  - Radial progress for overall score (animated sweep).
  - Micro-sparklines using `victory` or `recharts` with soft bezier curves.
  - Timeline nodes as pill buttons with gradient fills reflecting score quality.
  - Heatmap cells animate on hover to reveal tooltip (“Eye contact steady for 76% of clip”).
- **Micro-interactions**: 
  - KPI cards lift 4px + drop shadow on hover; clicking toggles deeper insight drawer.
  - Tooltip delays (150 ms) for trend icons; copy-to-clipboard for coach quotes.
  - Smooth scroll anchors for “Jump to focus area”.
- **Accessibility**: Ensure contrast ratios ≥4.5:1; provide text versions of chart data (aria descriptions, table fallback). Offer keyboard navigation for carousels and ensure motion reduces when `prefers-reduced-motion`.

## 4. Data & Coaching Depth
- **Data mapping**
  - `analyses`: timestamps, prompt contexts, journey_id -> timeline, hero summary.
  - `communication_metrics`: numeric KPIs + deltas -> hero + KPI grid + sparklines.
  - `communication_insights`: narrative strengths/focus/wins -> Coach Notes module.
  - `action_items` (+ practice prompt fields): practice planner & CTA chips.
  - `user_journeys`: focus chip filters, progress per goal.
- **Computed metrics**
  - Rolling averages (last 3 sessions) for each KPI.
  - Consistency score = std deviation of scores (lower = more consistent).
  - Streak counter = consecutive analyses with positive delta.
  - Alignment score = map `focusAreas` vs user goal (weight matches).
- **Data gaps / recommendations**
  - Track per-analysis filler word count, speaking rate, sentiment to fuel Body & Voice panels.
  - Collect self-reported mood/confidence rating post-analysis; store in new `self_reflections` table referencing analysis_id.
  - Allow manual coach notes / human feedback uploads.
  - Capture gesture metrics (hands visible %, movement score) in `communication_metrics`.
  - Store video bookmarks for highlight moments to power timeline tooltips.
  - Add completion state + timestamps to `action_items` for accountability lane.

## 5. Implementation Blueprint
- **File structure**
  - `client/src/pages/MyProgressPage.jsx` – orchestrates data fetch via new `useProgressData` hook, handles loading/empty states, renders major sections.
  - `client/src/components/progress/ProgressHero.jsx` (overall score + delta + CTA), `KpiGrid.jsx`, `SessionTimeline.jsx`, `BodyVoiceInsights.jsx`, `CoachNotesCarousel.jsx`, `PracticePlanner.jsx`, `ReflectionWidget.jsx`.
  - `client/src/hooks/useProgressData.js` – aggregates analyses, metrics, insights, action items, reflections. Memoizes derived metrics + charts.
  - Styles: `client/src/pages/MyProgressPage.css` leveraging CSS variables; section-specific CSS modules if needed.
- **Data layer**
  - Extend backend endpoint `/api/progress/overview` (new) returning consolidated payload (analyses, metrics, insights, action items, reflections) scoped by user + optional journey filter.
  - Fallback to sequential requests if API addition delayed—ensure hook merges results gracefully.
- **State handling**
  - `LoadingView` skeleton variant with shimmer cards.
  - Empty states keyed off `analyses.length` & `metrics`.
  - Error banner with retry.
- **Testing & instrumentation**
  - Unit tests for `useProgressData` derived metrics (rolling averages, streaks).
  - Component snapshot tests (hero, KPI grid, timeline).
  - Interaction tests simulating filter changes.
  - Analytics events: `progress_section_viewed`, `progress_start_drill`, `progress_filter_changed`.

## Next Steps
1. Align with coaching stakeholders on KPIs and additional signals to capture.
2. Scope backend work for `/api/progress/overview` and new tracking tables (reflections, filler metrics).
3. Build front-end components iteratively, starting with hero + KPI grid, then timeline, then qualitative modules.



