## My Progress – UX & Localization Brief (EN → HE)

### Overall page purpose
- **Primary goal**: Help the user *understand their progress over time* and *decide what to focus on next*.
- **Tone**: Encouraging, clear, non-technical. Feels like a coach, not a dashboard for data analysts.
- **Audience**: Everyday professionals, not researchers. Hebrew should be natural and conversational.

When translating, always ask:  
“What decision or feeling should this section create for the user?”

---

## 1. Header section

**Components**  
- Title: `myProgress.title`  
- Subtitle (no data): `myProgress.emptySubtitle` / `myProgress.emptySubtitleWithFocus`  
- Subtitle (with data): `myProgress.subtitle` / `myProgress.subtitleWithFocus`  
- Secondary subtitle (goal explanation): `myProgress.subtitleSecondary`

**Intent (EN)**  
- Title: Simple label for the page: “My Progress”.  
- Subtitle (empty): Invite the user to *start* tracking, without guilt.  
- Subtitle (with data): Summarize how much they’ve practiced (how many sessions, for which goal).  
- Secondary subtitle: Light “coach tip” – suggesting they run 1–2 missions this week.

**Hebrew tone guidelines**  
- Title: Short, clear, something like “ההתקדמות שלי”.  
- Use second person implied (“ההתקדמות שלך”) only where it makes sense; we already have “שלי” in the title.  
- Subtitles should feel like a friend nudging you, not a system message.

**Examples (already implemented)**  
- `myProgress.title`: “ההתקדמות שלי”  
- `myProgress.emptySubtitleWithFocus`: “{{focusLabel}}: עדיין אין סשנים”  
- `myProgress.emptySubtitle`: “עקוב אחרי מסע התקשורת שלך”  
- `myProgress.subtitleWithFocus`: “{{focusLabel}}: {{count}} {{unit}} במעקב”  
- `myProgress.subtitle`: “ההתפתחות התקשורתית שלך לאורך {{count}} {{unit}}”  
- `myProgress.subtitleSecondary`: “השבוע, המשך ללמוד דרך עשייה: בצע 1–2 משימות קצרות שמאתגרות את {{goal}} שלך וצפה בציונים עולים.”

---

## 2. Empty state (no metrics yet)

**Components**  
- `EmptyState` props for progress:
  - `myProgress.emptyTitleWithFocus`
  - `myProgress.emptyTitle`
  - `myProgress.emptyDescriptionWithFocus`
  - `myProgress.emptyDescription`
  - `analysisPage.newAnalysis` (button label reused)

**Intent (EN)**  
- Reassure the user that it’s normal to have no data at first.
- Explain why uploading *one video* will start their progress story.
- Make the CTA (“Start Your First Analysis”) feel low-friction and safe.

**Hebrew tone guidelines**  
- Avoid sounding like an error. Think “starting point” rather than “missing data”.
- Mention the **benefit** of uploading a video (seeing growth, getting insights).

**Example Hebrew (already in translations)**  
- Title with focus: “עדיין אין התקדמות עבור {{focusLabel}}”  
- Description: “העלה סרטון כדי להתחיל לעקוב אחרי מסע התקשורת שלך ב‑{{focusLabel}}. ראה את השיפור שלך במדדים המרכזיים לאורך הזמן.”

---

## 3. “How to Read This Page” guide

**Components**  
- Toggle button: `myProgress.guideToggle`  
- Intro paragraph: `myProgress.guideIntro`  
- Score legend: `myProgress.guideStrong`, `guideStrongText`, `guideAverage`, `guideAverageText`, `guideLow`, `guideLowText`  
- Category blurbs: `myProgress.*CategoryDescription` keys for each category (voice, presence, clarity, authenticity, impact, confidence).

**Intent (EN)**  
- Reduce anxiety: explain that 0–10 is a simple, understandable scale.
- Clearly define what each category means in plain language.
- Help the user know where to look first (e.g. 0–3 = priority).

**Hebrew tone guidelines**  
- Use everyday language, not academic terminology.
- Don’t over-translate metric names – often the English name is better kept as-is and explained in Hebrew.
- Example: “Voice Expression” → short Hebrew category name + explanation: “אופן השימוש בקול”.

**Example Hebrew keys**  
- `myProgress.guideToggle`: “איך לקרוא את העמוד הזה”  
- `myProgress.guideIntro`: one friendly paragraph explaining the 6 categories and 25 parameters.  
- `myProgress.guideStrong`: “חזק” / `guideStrongText`: “ביצוע מצוין, המשך כך!”  
- Category descriptions (concept):
  - Voice Expression: “איך אתה משתמש בקול שלך כדי לתקשר”  
  - Presence: “נוכחות פיזית ושפת גוף”  
  - Clarity: “עד כמה המסר שלך ברור ומאורגן”  
  - Authenticity: “כמה אתה נראה טבעי ואמיתי”  
  - Impact: “כמה אתה משכנע ומעורר עניין”  
  - Confidence: “כמה אתה נראה בטוח ונינוח”

---

## 4. Momentum cards (streak & cohort)

**Components**  
- `myProgress.momentumStreakLabel`, `momentumStreakKeepAlive`, `momentumStreakExtend`  
- `myProgress.momentumCohortLabel`, `momentumCohortWithFocus`, `momentumCohortGeneric`

**Intent (EN)**  
- “Weekly streak”: reward consistency and gently warn when streak is about to break.
- “Cohort percentile”: a light brag – you’re ahead of X% of people like you.

**Hebrew tone guidelines**  
- Streak text should feel like progress, not pressure.
- Cohort wording: avoid sounding like a school test; think “אתה בקצה העליון של הקבוצה”.

**Example Hebrew (already defined)**  
- `momentumStreakLabel`: “רצף שבועי”  
- `momentumStreakKeepAlive`: “העלה הקלטה בתוך {{days}} ימים כדי לשמור על הרצף”  
- `momentumCohortWithFocus`: “מקדימה {{percent}}% מהמשתמשים ב‑{{focusLabel}}”

---

## 5. Recent Sessions list

**Components**  
- Section title/subtitle: `myProgress.recentSessionsTitle`, `recentSessionsSubtitle`  
- Metric labels: `overallLabel`, `speakingRateLabel`, `fillerWordsLabel`

**Intent (EN)**  
- Make the last few sessions easy to scan:
  - When was it?
  - Overall score?
  - Speaking rate?
  - Filler words?
- Subtle: show direction of change without overwhelming with numbers.

**Hebrew tone guidelines**  
- Use short labels that fit well in a tight space.
- For speaking rate, show units clearly: “מילים לדקה”.

**Example keys**  
- `overallLabel`: “כללי”  
- `speakingRateLabel`: “קצב דיבור”  
- `fillerWordsLabel`: “מילות מילוי”

---

## 6. Self vs AI card

**Components**  
- Titles and labels:
  - `selfVsAiTitle`, `selfRating`, `aiOverall`, `delta`, `trend`, `vsPrevious`
  - `aiHigher`, `youHigher`, `match`
  - `insightAiHigher`, `insightYouHigher`, `moodCheckIn`

**Intent (EN)**  
- Help the user compare how they see themselves vs how AI scores them.
- Provide a small insight when there’s a larger gap:
  - AI higher → you might be underestimating yourself.
  - You higher → look at AI’s feedback for blind spots.

**Hebrew tone guidelines**  
- Keep it non-judgmental. “אתה ממעיט בערך עצמך” is okay; avoid harsh language.
- Explain what the difference *means*, not just that there *is* a difference.

**Example**  
- `insightAiHigher`: explain that AI scored higher, encourage more self-confidence.  
- `insightYouHigher`: suggest paying attention to AI’s specific tips.

---

## 7. Focus areas (“Areas to Focus On”)

**Components**  
- Section title/subtitle: `areasToFocusTitle`, `areasToFocusSubtitle`  
- Button: `practiceThis`

**Intent (EN)**  
- Clearly highlight **2–3 weakest parameters** as the user’s “current practice menu”.
- Encourage action (go to practice) rather than just showing a red warning.

**Hebrew tone guidelines**  
- Title: “אזורי מיקוד לשיפור” or similar – strong but not shaming.
- Button: verb form (“תרגל את זה”) to feel like a direct action.

---

## 8. “What’s Getting Better” & Strengths

**Components**  
- `whatsGettingBetterTitle`, `whatsGettingBetterSubtitle`  
- `yourStrengthsTitle`, `yourStrengthsSubtitle`, `averageScore`

**Intent (EN)**  
- Remind the user that things *are* improving (not only show problems).
- Show consistent strengths so they don’t only focus on weaknesses.

**Hebrew tone guidelines**  
- Celebrate progress without overhyping.
- Strengths wording can be slightly more “proud”.

---

## 9. Complete Parameter Analysis

**Components**  
- `completeAnalysisTitle`, `completeAnalysisSubtitle`, `categoryScoreLabel`, `parameterImprovement`

**Intent (EN)**  
- For users who want detail: show all 25 parameters and their latest scores.
- Highlight where a parameter has clearly improved from first to latest.

**Hebrew tone guidelines**  
- Keep labels short and clear; explanations already exist in the guide section.
- “From X to Y (+Z)” should still read naturally right-to-left.

**Example**  
- `parameterImprovement`: “מ‑{{first}} ל‑{{latest}} (+{{change}})”

---

## How to use this brief when translating other pages

1. **Copy this structure** for each major page:
   - Break into sections as the user sees them.
   - For each section: components → intent → tone → example EN/HE.
2. **Only then** fill or refine the keys in `en/translation.json` and `he/translation.json`.
3. During implementation:
   - Keep the brief open while writing Hebrew so you translate *intent*, not just words.
   - After updating translations, review the real UI in Hebrew and adjust wording/spacing as needed.


