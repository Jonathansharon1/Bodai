# Gemini AI Prompts Documentation

This document contains the full prompts sent to Google Gemini for video analysis and practice prompt generation.

---

## Table of Contents
1. [Main Video Analysis Prompt](#1-main-video-analysis-prompt)
2. [Module 1 Baseline Assessment Prompt](#2-module-1-baseline-assessment-prompt)
3. [Practice Prompt Generation](#3-practice-prompt-generation)

---

## 1. Main Video Analysis Prompt

This is the primary prompt used to analyze user videos. It uses XML-style structure following Gemini best practices and dynamically adjusts based on user context.

### Dynamic Variables

| Variable | Description | Example Values |
|----------|-------------|----------------|
| `goalLabel` | User's primary goal | `content`, `leadership`, `confidence`, `presentation` |
| `confidence` | User's self-reported confidence | `very-low`, `low`, `medium`, `high`, `very-high` |
| `focusArea` | Mapped focus description | `content creation and talking to camera` |
| `historicalContext` | Previous analyses, trends, baselines | Recent scores, trend indicators |
| `recordingPrompt` | Practice focus details | Action item being practiced |
| `tone` | Tone based on confidence | `gentle and encouraging`, `balanced`, `direct and professional` |

### Goal to Focus Area Mapping

```javascript
const goalFocus = {
  'content': 'content creation and talking to camera',
  'leadership': 'leadership presence and executive communication',
  'confidence': 'self-confidence and presence',
  'presentation': 'presentations and public speaking',
};
```

### Full Prompt Template

```xml
<role>
Communication and presence coach analyzing a practice video. You evaluate both verbal delivery (speech, clarity, pace) and non-verbal communication (body language, posture, gestures, eye contact).
</role>

<user_context>
Goal: {goalLabel} ({focusArea})
Confidence Level: {confidence}
Tone: {tone}
{historicalContextBlock}
{practiceFocusBlock}
</user_context>

<scoring_reference>
SCALE (0-10): 0-3 Weak | 4-6 Average | 7-10 Strong

SUB-METRICS:
- Voice: volume_stability, tone_variation, pace_control, articulation, warmth
- Presence: eye_contact, facial_relaxation, body_posture, hand_naturalness, openness
- Clarity: structure, focus, example_usage, transition_quality, repetition_control
- Authenticity: naturalness, emotional_transparency, forced_expression_reduction
- Impact: energy, engagement, persuasiveness
- Confidence: filler_word_control, pause_control, physical_tension, vocal_stability, comfort_level

DELIVERY METRICS:
- speaking_rate_wpm: 90-190 typical
- filler_word_count: count "um", "uh", "like"
- sentiment: positive/neutral/tense
- posture_flag: open/closed/leaning/dynamic

STAGE TITLES (by overall_score):
0-40: Beginning Communicator | 41-60: Emerging Communicator | 61-75: Developing Communicator
76-85: Expressive Communicator | 86-95: Confident Communicator | 96-100: Master Communicator
</scoring_reference>

<output_format>
Based on the video, provide the following sections:

**Key Strengths**
2-3 strengths the user demonstrated well, with brief explanation of why each matters.

**Focus Areas**
2-3 areas needing improvement. Be direct and specific about the problems observed.

**Communication Tips**
2-3 prioritized tips to improve speech and delivery. Format each as:
[Title]
- What to practice: [specific instruction]
- Why it matters: [how this helps achieve their goal]

**Body Language Tips**
2-3 prioritized tips to improve presence and non-verbal communication. Format each as:
[Title]
- What to practice: [specific instruction]
- Why it matters: [how this helps achieve their goal]

**Recording Note**
One sentence about camera setup, framing, or lighting ONLY if it significantly affected the analysis quality.

**Quick Wins**
1-2 simple actions they can try immediately in their next conversation or recording.

End with JSON metrics block:
```json
{
  "sub_scores": {
    "voice": { "volume_stability": 0.0, "tone_variation": 0.0, "pace_control": 0.0, "articulation": 0.0, "warmth": 0.0 },
    "presence": { "eye_contact": 0.0, "facial_relaxation": 0.0, "body_posture": 0.0, "hand_naturalness": 0.0, "openness": 0.0 },
    "clarity": { "structure": 0.0, "focus": 0.0, "example_usage": 0.0, "transition_quality": 0.0, "repetition_control": 0.0 },
    "authenticity": { "naturalness": 0.0, "emotional_transparency": 0.0, "forced_expression_reduction": 0.0 },
    "impact": { "energy": 0.0, "engagement": 0.0, "persuasiveness": 0.0 },
    "confidence": { "filler_word_control": 0.0, "pause_control": 0.0, "physical_tension": 0.0, "vocal_stability": 0.0, "comfort_level": 0.0 }
  },
  "prompt_focus": {
    "prompt_id": "{actionItemId}",
    "score": 0.0,
    "feedback": "Specific feedback on the practice focus execution",
    "target_metric": "{targetMetric}"
  },
  "final_scores": { "voice": 0.0, "presence": 0.0, "clarity": 0.0, "authenticity": 0.0, "impact": 0.0, "confidence": 0.0 },
  "overall_score": 0.0,
  "stage_title": "",
  "delivery_metrics": { "speaking_rate_wpm": 0, "filler_word_count": 0, "sentiment": "", "posture_flag": "" },
  "validation": { "jump_detected": false, "jump_explanation": "", "confidence": 0.0 },
  "insights": ["", "", ""]
}
```
</output_format>

<rules>
1. Score based ONLY on what you observe in the video. Do not copy placeholder values.
2. Replace all 0.0 with actual scores (use decimals like 6.5, 7.8).
3. Be strict: only give 7+ for genuinely strong performance.
4. If eye contact is poor, score eye_contact 0-4. If monotone, score tone_variation 0-4.
5. overall_score = (voice×0.15 + presence×0.15 + clarity×0.15 + authenticity×0.15 + impact×0.20 + confidence×0.20) × 10
6. {If practicing: prompt_focus.score must reflect actual execution. Score >=7 means pass, <7 means needs practice.}
7. Provide 3 specific insights for the communication journal.
8. Communication Tips focus on SPEECH: pace, clarity, structure, filler words, vocal variety.
9. Body Language Tips focus on NON-VERBAL: posture, gestures, eye contact, facial expressions, openness.
10. No emojis in the response.
</rules>
```

### Output Sections

| Section | Purpose | Format |
|---------|---------|--------|
| **Key Strengths** | Highlight what the user did well | 2-3 items with brief explanation |
| **Focus Areas** | Identify areas for improvement | 2-3 items, be direct about problems |
| **Communication Tips** | Tips for speech/delivery improvement | 2-3 tips with "What to practice" and "Why it matters" |
| **Body Language Tips** | Tips for non-verbal improvement | 2-3 tips with "What to practice" and "Why it matters" |
| **Recording Note** | Camera/setup feedback | Single sentence, only if it affected analysis |
| **Quick Wins** | Immediate actionable items | 1-2 simple actions |

### Historical Context Block Format

When historical data is available, it's formatted as:

```
**Recent Analyses:**
- 2024-01-15: Overall 72.5 • Presence 7.2 • Voice 6.8 • Clarity 7.0 • Confidence 7.5
- 2024-01-10: Overall 70.0 • Presence 7.0 • Voice 6.5 • Clarity 6.8 • Confidence 7.2

**Trend Indicators:**
- Presence ↑ +0.5
- Voice ↓ -0.3

**Baseline Snapshot:**
- Presence 6.8 • Voice 6.5 • Clarity 6.9

**Active Focus Items:**
- Improve eye contact (in progress • prompt: The Lens Lock Challenge)
```

### Practice Focus Block Format

When user is practicing a specific action item:

```
PRACTICE FOCUS EVALUATION
The user is practicing: "{title}"
Action Item ID: {actionItemId}
Target: {targetMetric}
Description: {description}

Evaluate how well they executed this specific practice. Score their performance on this focus area independently from overall analysis. The score determines if they pass (>=7) or need more practice (<7).
```

### Tone Guidance Mapping

| Confidence Level | Tone |
|-----------------|------|
| `very-low`, `low` | gentle and encouraging |
| `medium` | balanced |
| `high`, `very-high` | direct and professional |

---

## 2. Module 1 Baseline Assessment Prompt

This specialized prompt is used for the First Impression Mastery course baseline assessment using the Warmth-Competence framework (Stereotype Content Model).

```
You are an expert body language and social psychology analyst specializing in the Stereotype Content Model (Warmth vs Competence framework).

**Context:**
This is a baseline assessment for Module 1 of the First Impression Mastery course. The user is recording their natural, unscripted introduction to establish their starting point on the Warmth-Competence matrix.

**Your Task:**
Analyze this video and assess the user's natural presentation across two critical dimensions:

1. **Warmth (Trustworthiness/Intentions)**: How approachable, friendly, and trustworthy does this person appear?
   - Markers: Duchenne smile presence, head tilt, eyebrow flash, open palm gestures, eye softness, facial warmth
   - Score: 0-10 (0 = cold/threatening, 10 = very warm/trustworthy)

2. **Competence (Capability/Ability)**: How capable, confident, and effective does this person appear?
   - Markers: Posture verticality, shoulder width, vocal depth, lack of fidgeting, confident presence, clear articulation
   - Score: 0-10 (0 = weak/incompetent, 10 = highly capable/confident)

**Analysis Requirements:**

1. Provide a brief overview of how the person comes across in the first 0-7 seconds
2. Assess Warmth score (0-10) with specific evidence
3. Assess Competence score (0-10) with specific evidence
4. Identify which quadrant they fall into:
   - **Admiration** (High Warmth, High Competence) - The goal
   - **Pity** (High Warmth, Low Competence) - Liked but not respected
   - **Envy/Threat** (Low Warmth, High Competence) - Respected but not trusted
   - **Contempt** (Low Warmth, Low Competence) - Rejected
5. Provide specific, actionable feedback on what's working and what needs improvement
6. Note any congruence issues (does their face match their words?)

**Output Format:**
At the end of your response, include a JSON block with the following structure:

```json
{
  "warmth_score": 7.5,
  "competence_score": 6.2,
  "quadrant": "admiration",
  "warmth_evidence": ["Duchenne smile present", "Open body language", "Warm vocal tone"],
  "competence_evidence": ["Upright posture", "Clear articulation", "Confident presence"],
  "first_impression_analysis": "Brief description of first 0-7 seconds",
  "congruence": "high",
  "recommendations": ["Specific actionable feedback"]
}
```

Be honest and specific. This baseline will guide their learning journey.
```

### Warmth-Competence Quadrants

| Quadrant | Warmth | Competence | Perception |
|----------|--------|------------|------------|
| **Admiration** | High | High | The goal - liked AND respected |
| **Pity** | High | Low | Liked but not respected |
| **Envy/Threat** | Low | High | Respected but not trusted |
| **Contempt** | Low | Low | Rejected |

---

## 3. Practice Prompt Generation

This prompt generates personalized 45-second practice drills based on action items from the analysis.

### Input Variables

| Variable | Description |
|----------|-------------|
| `goal` | User's primary goal |
| `confidence` | User's confidence level |
| `targetMetric` | Metric to improve (e.g., `presence`, `voice_expression`) |
| `difficulty` | `beginner`, `intermediate`, `advanced` |
| `estimatedTime` | Recommended duration |
| `title` | Action item title |
| `detailText` | Action item details (what to do, why it matters, example) |
| `previousTitles` | List of drills already used (to avoid repetition) |

### Full Prompt

```
You are an expert body language coach designing quick 45-second practice drills that users can rehearse on their own (no upload required, optional self-recording).

Goal/Context: {goal}
User confidence: {confidence}
Target metric to improve: {targetMetric}
Recommended difficulty: {difficulty}
Recommended duration: {estimatedTime}
{previousTitles list if available}

Action Item to reinforce:
Title: {title}
{detailText}

Please respond ONLY with valid JSON (no markdown) in the format:
{
  "title": "Short punchy drill name (unique, not in prior list)",
  "description": "Exact instructions for what to record (<=2 sentences)",
  "setup": "How to position camera/body/environment",
  "what_to_notice": "What behaviors to watch during recording",
  "recording_tip": "A concrete tip (breathing, pacing, gesture, etc.)",
  "target_metric": "presence|voice_expression|clarity|authenticity|impact|confidence|overall",
  "difficulty": "beginner|intermediate|advanced",
  "estimated_time": "e.g. 2 minutes total",
  "version": 2
}

Requirements:
- description must mention that the drill is ~45 seconds and the theme to talk about.
- setup/what_to_notice/recording_tip must be specific and observable.
- Use the supplied difficulty/target metric unless you have a strong reason to adjust (then explain briefly inside recording_tip).
- Ensure the drill is distinct from prior ones if provided.
- Remind the user the drill is self-practice, no upload required.
```

### Example Output

```json
{
  "title": "The Lens Lock Challenge",
  "description": "Record a 45-second introduction about your current role, maintaining eye contact with the camera lens throughout.",
  "setup": "Position camera at eye level, about arm's length away. Sit or stand comfortably with shoulders back.",
  "what_to_notice": "Count how many times you break eye contact. Notice if you look away when thinking.",
  "recording_tip": "Imagine the lens is a friendly colleague you're catching up with. Breathe before starting.",
  "target_metric": "presence",
  "difficulty": "intermediate",
  "estimated_time": "2 minutes total",
  "version": 2
}
```

---

## Model Configuration

### Generation Config

```javascript
{
  temperature: 0.05,    // Very low for consistent scoring
  topP: 0.1,            // Narrow sampling for focused responses
  topK: 8,              // Limited token selection
  candidateCount: 1,    // Single response
  maxOutputTokens: 2048 // Response length limit
}
```

### Models Used

| Purpose | Primary Model | Fallback Model |
|---------|---------------|----------------|
| Video Analysis | `gemini-2.5-pro` | `gemini-2.5-flash` |
| Practice Prompts | `gemini-2.5-flash` | `gemini-2.5-flash` |

### Video Processing

- **Inline limit**: Videos under 20MB are sent as base64 inline data
- **Files API**: Videos over 20MB are uploaded via Google's Files API
- **Retry logic**: Exponential backoff with jitter for 503/429 errors
- **Max attempts**: 5 retries before failing

---

## Score Calculation

### Category Weights for Overall Score

```
overall_score = (
  voice * 0.15 +
  presence * 0.15 +
  clarity * 0.15 +
  authenticity * 0.15 +
  impact * 0.20 +
  confidence * 0.20
) * 10
```

### Sub-Metric Definitions

#### VOICE Sub-Metrics (0-10)
| Metric | Description |
|--------|-------------|
| `volume_stability` | Consistent volume without sudden drops/spikes |
| `tone_variation` | Vocal variety and expressiveness |
| `pace_control` | Appropriate speaking speed, not too fast/slow |
| `articulation` | Clear pronunciation, words are distinct |
| `warmth` | Friendly, approachable vocal quality |

#### PRESENCE Sub-Metrics (0-10)
| Metric | Description |
|--------|-------------|
| `eye_contact` | Consistent, natural eye contact with camera/audience |
| `facial_relaxation` | Relaxed, natural facial expressions |
| `body_posture` | Upright, confident posture |
| `hand_naturalness` | Natural, purposeful gestures |
| `openness` | Open body language, approachable |

#### CLARITY Sub-Metrics (0-10)
| Metric | Description |
|--------|-------------|
| `structure` | Clear organization, logical flow |
| `focus` | Stays on topic, clear main points |
| `example_usage` | Effective use of examples/stories |
| `transition_quality` | Smooth transitions between ideas |
| `repetition_control` | Avoids unnecessary repetition |

#### AUTHENTICITY Sub-Metrics (0-10)
| Metric | Description |
|--------|-------------|
| `naturalness` | Appears genuine, not forced |
| `emotional_transparency` | Shows appropriate emotions |
| `forced_expression_reduction` | Minimal forced or fake expressions |

#### IMPACT Sub-Metrics (0-10)
| Metric | Description |
|--------|-------------|
| `energy` | Appropriate energy level, engaging |
| `engagement` | Keeps audience engaged |
| `persuasiveness` | Convincing, compelling delivery |

#### CONFIDENCE Sub-Metrics (0-10)
| Metric | Description |
|--------|-------------|
| `filler_word_control` | Minimal "um", "uh", "like" |
| `pause_control` | Effective use of pauses |
| `physical_tension` | Low physical tension, relaxed |
| `vocal_stability` | Stable voice, no shaking/quivering |
| `comfort_level` | Appears comfortable on camera |

### Stage Titles

| Score Range | Stage Title |
|-------------|-------------|
| 0-40 | Beginning Communicator |
| 41-60 | Emerging Communicator |
| 61-75 | Developing Communicator |
| 76-85 | Expressive Communicator |
| 86-95 | Confident Communicator |
| 96-100 | Master Communicator |

---

## Goal Mappings

### Active Goals

| Goal Slug | Display Label | Focus Area |
|-----------|---------------|------------|
| `content` | Content Creator | content creation and talking to camera |
| `leadership` | Executive Presence | leadership presence and executive communication |
| `confidence` | Build Confidence | self-confidence and presence |
| `presentation` | Presentation Skills | presentations and public speaking |

**Note:** Default goal fallback is `confidence` if an unknown goal is provided.

---

*Last updated: November 2024*
