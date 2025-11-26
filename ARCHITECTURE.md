## High-Level Overview

BodAI is a monolithic application composed of a React single-page frontend (`client/`) and an Express.js API server (`server.js`). The system guides users through recording short practice videos, sends the footage plus contextual metadata to Google Gemini for multimodal analysis, and persists derived communication metrics, action items, and progress signals in Supabase (PostgreSQL). The backend orchestrates integrations with Clerk (identity), Amazon S3 (video storage), Resend (email), and monitoring webhooks while maintaining journey-centric coaching flows inside a single deployable service.

## Tech Stack & Dependencies

- **Frontend**
  - React 18 with React Router (`client/src/AppRouter.jsx`) for SPA navigation.
  - Clerk React SDK for authentication, session-aware routing, and user profile sync.
  - Recharts, Framer Motion, and Lucide icons for data visualization and motion.
  - React Markdown and React Webcam for rendering AI output and capturing media.

- **Backend**
  - Node.js + Express (`server.js`) provide REST APIs, file uploads (Multer), CORS, and static hosting for the React build.
  - `@google/genai`/`@google/generative-ai` power the Gemini analysis pipeline.
  - AWS SDK v3 handles S3 uploads and pre-signed URLs (`services/s3Service.js`).
  - Supabase JS SDK executes service-role database access (`services/supabaseService.js`).
  - Resend SDK sends transactional emails with preference gating (`services/emailService.js`).

- **Data & Storage**
  - Supabase/PostgreSQL hosts normalized tables for users, analyses, communication_metrics, action_items, journeys, achievements, and baseline/global stats (`supabase/schema.sql` plus migrations).
  - S3 buckets store raw uploaded videos; only metadata and S3 keys persist in Supabase.
  - In-memory analysis cache (`services/analysisCache.js`) prevents duplicate Gemini calls.

- **DevOps & Tooling**
  - `npm run dev` (backend) and CRA scripts for the client; `npm run build` emits the SPA that Express serves in production.
  - Environment managed via `.env` read by `dotenv`.
  - Monitoring delivered through configurable webhook endpoint (`services/notificationService.js`).

## Project Structure

```
├── server.js                     # Express entrypoint, routing, request orchestration
├── services/                     # Backend service layer and integrations
│   ├── supabaseService.js        # Data access, journey/action logic, metrics persistence
│   ├── geminiService.js          # Prompt building, Gemini invocation, result shaping
│   ├── scoringService.js         # Post-processing of AI sub-scores, baseline trends
│   ├── scoringConfig.js          # Weight tables, stage thresholds, helper math
│   ├── s3Service.js              # Upload/presign/delete helpers for video storage
│   ├── emailService.js           # Resend templates + preference enforcement
│   ├── notificationService.js    # Monitoring webhook helpers
│   ├── analysisCache.js          # In-memory cache keyed by video/content hash
│   ├── parseActionItems.js       # Markdown parser for AI action-plan sections
│   └── scheduledEmails.js        # Cron-entry helpers for future automation
├── client/
│   ├── package.json              # Frontend dependencies & CRA scripts
│   └── src/
│       ├── AppRouter.jsx         # Routing, guards, journey-aware context
│       ├── pages/                # Route-level views (Analysis, Dashboard, Courses…)
│       ├── components/           # Reusable UI (Dashboard widgets, Layout, Modals)
│       ├── config/recordingPrompts.js # Predefined practice prompt catalog
│       └── index.js / index.css  # SPA bootstrap
├── supabase/                     # SQL schema and incremental migrations
│   ├── schema.sql                # Canonical table + policy definitions
│   └── migration_*.sql           # Feature-specific evolutions (journeys, prompts, etc.)
├── package.json                  # Root scripts, Express dependencies
└── README / docs/*.md            # Operational and product notes (outdated per request)
```

## Core Architecture & Data Flow

1. **Authentication & Context**
   - The React client uses Clerk for sign-in and writes user metadata into request headers (`X-Clerk-User-Id`, profile fields) when calling the API. `ProtectedRoute` inside `AppRouter.jsx` enforces onboarding before exposing app routes, storing onboarding context in localStorage and syncing to Supabase (`/api/user/profile`, `/api/user/onboarding`).

2. **Video Upload & Analysis**
   - `AnalysisPage.jsx` captures a recording (via file selector or webcam) along with optional practice prompt metadata, journey context, and video telemetry (duration/size).
   - `/api/analyze-video` (Express + Multer) validates size/duration, checks subscription limits (`canUserUploadAnalysis`), deduplicates via SHA-256 hash, and optionally uploads to S3.
   - The server composes a detailed Gemini prompt (`services/geminiService.js`), injects historical context (recent metrics, baselines, outstanding action items), and either reuses a cached result or invokes Gemini. Raw markdown + structured metrics return.

3. **Persistence & Scoring**
   - Analyses (metadata, AI markdown, S3 keys, context) persist via `saveAnalysis`. Supplemental processes:
     - `processAnalysisMetrics` normalizes AI sub-scores against baselines/global stats, applies anti-jump heuristics, and derives category + overall scores stored in `communication_metrics`.
     - Insights, action_items (parsed from markdown), achievements, and journeys update in parallel.
     - Free-tier quota flags (`markFreeAnalysisUsed`), module baselines, and global stats recalculations run asynchronously.

4. **User Experience Surfaces**
   - Dashboard and progress pages query `/api/communication/progress`, `/api/analyses`, `/api/action-items`, `/api/reflections`, etc. The backend composes journey-scoped datasets (metrics, insights, achievements, action items) leveraging Supabase joins and caching strategies.
   - Videos are replayed via short-lived S3 pre-signed URLs from `/api/analyses/:id/video-url`.

5. **Notifications & Emails**
   - `emailService.js` sends welcome and “analysis complete” emails if user preferences allow, leveraging Resend. Notification hooks (monitoring webhooks) emit analysis gate failures, journey enrollment, and storage events for observability.

## Key Components

- **`server.js`**
  - Centralizes Express middleware, header parsing, upload constraints, and route definitions for analyses, journeys, onboarding, metrics, action items, reflections, and email preference endpoints. Embeds retry-tolerant flows (e.g., continue when S3 fails, degrade gracefully when Supabase unavailable).

- **`services/geminiService.js`**
  - Encapsulates prompt engineering for multiple contexts (general practice vs. Module 1 baseline). Generates structured JSON (sub-scores, prompt focus, insights) in addition to markdown narratives, ensuring downstream processors have deterministic shapes.

- **`services/scoringService.js` & `scoringConfig.js`**
  - Apply domain-specific weighting, normalization, anti-jump rules, and stage classification to Gemini sub-scores. This layer decouples AI output from persisted metrics, allowing deterministic evolution via versioned processor IDs.

- **`services/supabaseService.js`**
  - Provides high-level CRUD helpers for users, journeys, analyses, metrics, insights, action items, reflections, achievements, baselines, and subscriptions. Implements journey-aware filtering, duplicate detection, email preference storage, and scheduled email scaffolding.

- **React `AppRouter.jsx` + `Dashboard.jsx`**
  - Manage journey selection, client-side caching of onboarding context, request header enrichment, and UI flows for uploading, viewing analyses, and tracking progress. They translate backend responses (metrics, action items, insights) into rich visualizations (Recharts) and UX cues.

- **`services/parseActionItems.js`**
  - Parses structured action plans from Gemini markdown, deduplicates titles, and generates practice prompt scaffolding (instant tip + micro practice). These action items feed dashboards and practice completion automation via `updateActionItemStatus`.

## User Flow

### First-Time User Journey

1. **Landing & Sign-Up**
   - New visitors land on the homepage with hero content, features, and social proof. They can sign up using Clerk authentication (email, social providers).
   - After authentication, first-time users are automatically redirected to the onboarding flow.

2. **Onboarding**
   - Users answer questions about their primary communication goal (confidence, interviews, presentations, dating, leadership, etc.), their current confidence level, and goal-specific context (e.g., "What type of interviews?" or "What size audiences?").
   - This creates their first "journey" - a personalized learning path focused on their specific needs. The system stores this context to tailor future analyses.

3. **Welcome Experience**
   - After onboarding, users land on the Dashboard. New users see an empty state with guidance to record their first practice video.
   - A welcome email is sent (if email notifications are enabled) introducing the platform and next steps.

### Core Practice Loop

4. **Recording a Video**
   - Users navigate to "New Analysis" from the Dashboard or navigation. They can either upload a pre-recorded video file or record directly in the browser using their webcam.
   - The interface provides recording tips (framing, lighting, duration, eye level) to help users capture effective practice footage.
   - Users can optionally select a practice prompt from their action items - these are specific exercises tied to areas they need to improve.

5. **Video Analysis**
   - After upload, the system validates the video (size, duration between 20 seconds and 10 minutes). The video is processed by AI to analyze body language, voice, clarity, authenticity, impact, and confidence.
   - Users see a loading state while analysis runs (typically 30-60 seconds). The system checks for duplicate uploads and subscription limits before processing.

6. **Viewing Results**
   - Once analysis completes, users see:
     - **Detailed Feedback**: A markdown-formatted analysis covering strengths, areas for improvement, and specific observations about their delivery.
     - **Scores**: Six category scores (Presence, Voice, Clarity, Authenticity, Impact, Confidence) plus an overall score (0-100) and stage title (e.g., "Emerging Communicator").
     - **Action Items**: 1-3 personalized, actionable steps with "Instant Tips" (what to do in the next real conversation) and optional micro-practice suggestions.
     - **Video Playback**: The original recording is available for review alongside the feedback.

7. **Self-Reflection**
   - After viewing results, users can optionally record a self-reflection: how confident they felt (1-5), their mood, and free-form notes. This helps track emotional state alongside performance metrics.

### Progress Tracking & Improvement

8. **Dashboard Overview**
   - The Dashboard provides a holistic view of progress:
     - **Latest Scores**: Most recent analysis scores with visual indicators of improvement or decline.
     - **Progress Charts**: Line charts showing trends across all six categories over time, with improvement deltas between sessions.
     - **Radar Chart**: A spider chart comparing current performance across all dimensions.
     - **Journal Insights**: AI-generated insights highlighting strengths and focus areas from recent analyses.
     - **Achievements**: Unlocked badges celebrating milestones (e.g., "First Analysis," "Consistent Practice," high scores in specific categories).
     - **To-Do List**: Pending action items from recent analyses, prioritized by recency.

9. **My Progress Page**
   - A dedicated page for deeper analytics:
     - Historical trend analysis with detailed score breakdowns.
     - Comparison against personal baseline (calculated from first few analyses).
     - Identification of weakest metrics to guide focus areas.
     - Progress over time with visualizations of improvement trajectories.

10. **My Analyses Page**
    - A chronological list of all past analyses with:
      - Quick score summaries and dates.
      - Ability to click through to view full analysis details.
      - Option to delete analyses (removes data and associated metrics).

### Action Items & Practice

11. **Working with Action Items**
    - Action items appear on the Dashboard and can be viewed in detail on the Analysis page. Each item includes:
      - **Title**: The specific improvement area (e.g., "Improve Eye Contact Consistency").
      - **Instant Tip**: A concrete behavioral cue to apply immediately in real conversations.
      - **Practice Prompt**: An optional structured exercise (if generated) with setup instructions, what to notice, and recording tips.
    - Users can mark action items as "completed" when they feel they've mastered the skill, or the system auto-completes them when a practice prompt is scored ≥7/10.

12. **Practice Prompts**
    - When action items include practice prompts, users can select them when recording a new video. The AI then evaluates how well they executed the specific practice focus, providing targeted feedback and automatically completing the action item if performance meets the threshold.

### Journey Management

13. **Multiple Journeys**
    - Users can create multiple "journeys" for different goals (e.g., one for job interviews, another for dating). Each journey maintains its own set of analyses, metrics, and action items.
    - The Dashboard includes a journey switcher to filter all views by the active journey. Users can create new journeys, set defaults, and archive old ones.

14. **Journey Context**
    - All analyses are associated with a journey, allowing users to track progress separately for different communication contexts. The system uses journey context to provide goal-specific feedback and scoring adjustments.

### Additional Features

15. **Courses**
    - Users can access structured courses (e.g., "First Impression Mastery - Module 1") that include baseline assessments and guided practice sequences. Course modules may have special analysis modes (e.g., warmth vs. competence scoring for first impressions).

16. **Settings & Preferences**
    - Users can manage email notification preferences (analysis complete emails, progress updates, marketing emails), view email history, and update profile information synced from authentication.

17. **Subscription Management**
    - Free users get one free analysis; paid subscriptions unlock unlimited analyses and monthly limits. Users can view subscription status and upgrade from the Subscription page.

### Email Notifications

18. **Automated Communications**
    - **Welcome Email**: Sent after completing onboarding, introducing the platform.
    - **Analysis Complete Email**: Sent when a new analysis finishes, with overall score and link to view results.
    - **Progress Updates**: (Planned) Weekly summaries of progress and achievements.
    - **Action Item Reminders**: (Planned) Notifications for pending action items older than 3 days.

### User Experience Patterns

- **Progressive Disclosure**: New users see simplified views; advanced features (journeys, detailed analytics) become available as they engage more.
- **Contextual Guidance**: Recording tips, practice prompts, and action items provide clear next steps at each stage.
- **Visual Feedback**: Charts, scores, and stage titles make abstract improvements tangible and motivating.
- **Flexible Practice**: Users can record anytime, review past analyses, and work through action items at their own pace.
- **Journey Isolation**: Multiple journeys allow users to practice for different contexts without mixing progress or metrics.

## Infrastructure & Configuration

- **Environment Variables**
  - `PORT`, `CLIENT_ORIGIN`, `API_KEY` (Gemini), `GEMINI_MODEL`, `MAX_VIDEO_SIZE_MB`, `MIN/MAX_VIDEO_DURATION_SECONDS`.
  - Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (expects service role, warns if anon).
  - AWS S3: `AWS_S3_BUCKET_NAME`, `AWS_REGION`, credential pair.
  - Email: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `APP_URL`.
  - Monitoring/Webhooks: `MONITORING_WEBHOOK_URL`.

- **Build & Deploy**
  - Root `npm run dev` launches Express via Nodemon; `npm run client` serves CRA dev server. Production build uses `npm run build` (alias for `npm run client:build`) before Express serves `client/build`.
  - `heroku-postbuild` hook exists for PaaS environments to build the client during deploy.

- **Storage & Security**
  - Videos pass through memory-only Multer buffers before optional S3 upload; metadata sanitization enforces ASCII-only keys.
  - S3 access is private; clients receive short-lived pre-signed URLs only when authorized.
  - Supabase service role key bypasses RLS, so backend enforces Clerk-authenticated ownership per request; schema enables RLS for future hardening.

- **Background & Operations**
  - `services/scheduledEmails.js` exposes cron-safe functions (weekly progress, action-item reminders) awaiting a scheduler.
  - Randomized global stats recalculation (10% chance per analysis) prevents expensive recalculations on every upload.
  - Monitoring webhooks capture gate failures (oversized videos, subscription limits, duplicates) for operational visibility.

---

This document reflects the current code and configuration, superseding legacy markdown docs in the repository.

