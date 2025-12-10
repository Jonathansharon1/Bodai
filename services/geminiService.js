import 'dotenv/config';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { GoogleGenAI } from "@google/genai";
import logger from './logger.js';
import { calculateOverallScore, getStageTitle } from './scoringConfig.js';

const capitalizeLabel = (value = '') => {
  if (!value || typeof value !== 'string') return '';
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
};

const formatTrendLine = (trends = {}) => {
  const entries = Object.entries(trends)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => {
      const arrow = value > 0 ? '↑' : '↓';
      const formatted = value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
      return `${capitalizeLabel(key)} ${arrow} ${formatted}`;
    });
  return entries.length ? `**Trend Indicators:**\n- ${entries.join('\n- ')}` : '';
};

const formatRecentAnalyses = (analyses = []) => {
  if (!Array.isArray(analyses) || analyses.length === 0) {
    return '';
  }

  const lines = analyses.map((session, index) => {
    const dateLabel = session?.date ? new Date(session.date).toISOString().split('T')[0] : `Session ${index + 1}`;
    const scores = [
      typeof session.overallScore === 'number' ? `Overall ${session.overallScore.toFixed(1)}` : null,
      typeof session.presence === 'number' ? `Presence ${session.presence.toFixed(1)}` : null,
      typeof session.voice === 'number' ? `Voice ${session.voice.toFixed(1)}` : null,
      typeof session.clarity === 'number' ? `Clarity ${session.clarity.toFixed(1)}` : null,
      typeof session.confidence === 'number' ? `Confidence ${session.confidence.toFixed(1)}` : null
    ].filter(Boolean).join(' • ');
    return `- ${dateLabel}: ${scores}`;
  });

  return lines.length ? `**Recent Analyses:**\n${lines.join('\n')}` : '';
};

const formatBaselineBlock = (baseline = {}) => {
  const entries = Object.entries(baseline)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => `${capitalizeLabel(key)} ${value.toFixed(1)}`);
  return entries.length ? `**Baseline Snapshot:**\n- ${entries.join(' • ')}` : '';
};

const formatActionItemsBlock = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return '';
  const lines = items.map((item) => {
    const status = item.status === 'completed' ? 'completed' : 'in progress';
    const prompt = item.practicePromptTitle ? ` • prompt: ${item.practicePromptTitle}` : '';
    return `- ${item.title} (${status}${prompt})`;
  });
  return lines.length ? `**Active Focus Items:**\n${lines.join('\n')}` : '';
};

const buildHistoricalContextBlock = (historicalContext = null) => {
  if (!historicalContext) return '';
  const sections = [];
  const recentAnalysesBlock = formatRecentAnalyses(historicalContext.recentAnalyses);
  if (recentAnalysesBlock) {
    sections.push(recentAnalysesBlock);
  }
  const trendBlock = formatTrendLine(historicalContext.trends);
  if (trendBlock) {
    sections.push(trendBlock);
  }
  const baselineBlock = formatBaselineBlock(historicalContext.baseline);
  if (baselineBlock) {
    sections.push(baselineBlock);
  }
  const actionItemsBlock = formatActionItemsBlock(historicalContext.recentActionItems);
  if (actionItemsBlock) {
    sections.push(actionItemsBlock);
  }
  return sections.length ? `${sections.join('\n')}\n` : '';
};



// 1. Lens Definitions for Analysis
const lensMapping = {
  'Content': {
    role: "Viral Content Strategist & Brand Expert",
    priority: "Attention retention, 'The Hook', energy levels, visual engagement, and entertainment value.",
    critical_question: "Would a stranger scroll past this in 1 second?"
  },
  'Face-to-Face Sales': {
    role: "Senior Sales Negotiator & Trust Expert",
    priority: "Building rapport, objection handling, closing signals, authority, and trustworthiness.",
    critical_question: "Would I buy from this person based on their vibe alone?"
  },
  'Leadership': {
    role: "Executive Communication Coach",
    priority: "Gravitas, calmness, pause utilization, vocal depth, and ability to inspire confidence.",
    critical_question: "Does this person command the room without trying too hard?"
  },
  'Interview': {
    role: "Fortune 500 HR Recruiter",
    priority: "Professionalism, structured thinking (STAR method), likability, and anxiety management.",
    critical_question: "Is this candidate competent and easy to work with?"
  },
  'Presentation': {
    role: "TED Talk Speaking Coach",
    priority: "Narrative flow, stage usage, gesture clarity, and audience connection.",
    critical_question: "Is the message memorable and structured?"
  },
  'Confidence': {
    role: "Behavioral Psychologist",
    priority: "Internal state vs. external expression, micro-expressions of fear, and grounding techniques.",
    critical_question: "Is the confidence genuine or a mask?"
  }
};

// Build dynamic prompt based on user context
const buildPrompt = (userContext = {}) => {
  // Check if this is a Module 1 baseline assessment
  const courseContext = userContext.courseContext || (typeof userContext === 'string' ? JSON.parse(userContext) : null);
  if (courseContext?.type === 'baseline' && courseContext?.moduleId === 'module-1') {
    return buildModule1BaselinePrompt(userContext.language || 'en');
  }

  const goal = userContext.primaryGoal || 'confidence';
  const confidence = userContext.confidenceLevel || 'medium';
  const language = userContext.language || 'en';
  const isHebrew = language === 'he';

  // Map user goals to Lens keys
  const goalToLens = {
    'content': 'Content',
    'leadership': 'Leadership',
    'confidence': 'Confidence',
    'presentation': 'Presentation',
    'interview': 'Interview',
    'sales': 'Face-to-Face Sales'
  };

  const focusArea = goalToLens[goal] || 'Confidence';
  const currentLens = lensMapping[focusArea] || lensMapping['Confidence'];
  
  const goalLabel = goal.replace(/-/g, ' ');
  const recordingPrompt = userContext.recordingPrompt || null;
  const historicalContextBlock = userContext.historicalContext ? buildHistoricalContextBlock(userContext.historicalContext) : '';
  
  // Tone based on confidence
  const tone = (confidence === 'very-low' || confidence === 'low') 
    ? 'gentle and encouraging' 
    : (confidence === 'medium' ? 'balanced' : 'direct and professional');

  // JSON schema
  const jsonSchema = recordingPrompt?.title 
    ? `{
  "sub_scores": {
    "voice": { "volume_stability": 0.0, "tone_variation": 0.0, "pace_control": 0.0, "articulation": 0.0, "warmth": 0.0 },
    "presence": { "eye_contact": 0.0, "facial_relaxation": 0.0, "body_posture": 0.0, "hand_naturalness": 0.0, "openness": 0.0 },
    "clarity": { "structure": 0.0, "focus": 0.0, "example_usage": 0.0, "transition_quality": 0.0, "repetition_control": 0.0 },
    "authenticity": { "naturalness": 0.0, "emotional_transparency": 0.0, "forced_expression_reduction": 0.0 },
    "impact": { "energy": 0.0, "engagement": 0.0, "persuasiveness": 0.0 },
    "confidence": { "filler_word_control": 0.0, "pause_control": 0.0, "physical_tension": 0.0, "vocal_stability": 0.0, "comfort_level": 0.0 }
  },
  "prompt_focus": {
    "prompt_id": "${recordingPrompt.actionItemId || 'baseline'}",
    "score": 0.0,
    "feedback": "Specific feedback on the practice focus execution",
    "target_metric": "${recordingPrompt.targetMetric || 'overall'}"
  },
  "final_scores": { "voice": 0.0, "presence": 0.0, "clarity": 0.0, "authenticity": 0.0, "impact": 0.0, "confidence": 0.0 },
  "overall_score": 0.0,
  "stage_title": "",
  "delivery_metrics": { 
    "speaking_rate_label": "slow|optimal|fast",
    "filler_word_level": "low|medium|high",
    "sentiment": "",
    "posture_flag": ""
  },
  "validation": { "jump_detected": false, "jump_explanation": "", "confidence": 0.0 },
  "insights": ["", "", ""]
}`
    : `{
  "sub_scores": {
    "voice": { "volume_stability": 0.0, "tone_variation": 0.0, "pace_control": 0.0, "articulation": 0.0, "warmth": 0.0 },
    "presence": { "eye_contact": 0.0, "facial_relaxation": 0.0, "body_posture": 0.0, "hand_naturalness": 0.0, "openness": 0.0 },
    "clarity": { "structure": 0.0, "focus": 0.0, "example_usage": 0.0, "transition_quality": 0.0, "repetition_control": 0.0 },
    "authenticity": { "naturalness": 0.0, "emotional_transparency": 0.0, "forced_expression_reduction": 0.0 },
    "impact": { "energy": 0.0, "engagement": 0.0, "persuasiveness": 0.0 },
    "confidence": { "filler_word_control": 0.0, "pause_control": 0.0, "physical_tension": 0.0, "vocal_stability": 0.0, "comfort_level": 0.0 }
  },
  "final_scores": { "voice": 0.0, "presence": 0.0, "clarity": 0.0, "authenticity": 0.0, "impact": 0.0, "confidence": 0.0 },
  "overall_score": 0.0,
  "stage_title": "",
  "delivery_metrics": { 
    "speaking_rate_label": "slow|optimal|fast",
    "filler_word_level": "low|medium|high",
    "sentiment": "",
    "posture_flag": ""
  },
  "validation": { "jump_detected": false, "jump_explanation": "", "confidence": 0.0 },
  "insights": ["", "", ""]
}`;

  // Language instruction
  const languageInstruction = isHebrew 
    ? `\n\n**IMPORTANT LANGUAGE RULES:**
1. Respond in Hebrew (עברית) for ALL content text including tips, explanations, descriptions, "Recording Note" content, "Quick Wins" content, JSON values for "sentiment" and "posture_flag", and the "insights" array.
2. Translate "The Game Changer", "Physical Tweak", and "Environment" sub-headers to Hebrew.
3. However, ALWAYS use these exact English section headers for the main sections: "**Key Strengths**", "**Focus Areas**", "**Communication Tips**", "**Body Language Tips**", "**Recording Note**", "**Quick Wins**".
4. For tips format, use Hebrew labels: "מה לתרגל:" and "למה זה חשוב:" instead of "What to practice:" and "Why it matters:".
5. The "insights" array should contain 3 brief summary sentences in Hebrew that describe the overall performance, key strengths, and main areas for improvement.
6. Only technical terms like JSON field names should remain in English.`
    : '';

  return `<role>
You are an elite AI Communication Coach combining the skills of a ${currentLens.role}.
Your goal is not just to judge, but to provide the specific *unlock* that takes the user to the next level.

**YOUR FOCUS LENS:**
- **Primary Objectives:** ${currentLens.priority}
- **The Golden Question:** "${currentLens.critical_question}"

${languageInstruction} 
</role>

<user_context>
**Goal:** ${goalLabel}
**Focus Area:** ${focusArea}
**Self-Reported Confidence:** ${confidence}
**Tone Target:** ${tone}
**History:** ${historicalContextBlock}
**Active Practice:** ${recordingPrompt?.title || "Free Practice"}
</user_context>

<analysis_protocol>
Use this specific methodology to analyze the video inputs:

1. **The Congruence Scan:** Check alignment between:
   ${userContext.includeEnvironmentFeedback !== false ? `   - Visuals (Attire, Background) vs. Goal (${goalLabel})` : `   - Visuals (Attire) vs. Goal (${goalLabel})`}
   - Body Language vs. Voice Tone (e.g., Confident voice but fidgeting hands?)

2. **The "Lens" Filter:** Apply the strict criteria of a ${currentLens.role}.
   - If "Sales": Are they closing? Are they listening?
   - If "Leadership": Is there gravitas? Is there calm?

3. **Evidence Extraction:**
   - **CRITICAL:** Whenever you cite a flaw or strength, you MUST try to reference a specific moment or quote. (e.g., "When you said 'I think so'...")
</analysis_protocol>
${userContext.includeEnvironmentFeedback === false ? `\n**IMPORTANT:** Do NOT provide feedback on background, camera angle, lighting, or environment setup. Focus ONLY on body language, speech, voice, and communication skills. Ignore visual setup issues. Do not mention background, camera positioning, lighting quality, or any environmental factors in your analysis.` : ''}

<scoring_reference>
**CRITICAL: Be STRICT and REALISTIC. Most users score 4-7, not 8-10. Reserve high scores (8.0+) for truly exceptional performance.**

SCALE (0-10):
- **8.0 - 10.0:** World Class. Mastery of the specific lens. Flawless execution. **RARE** - Only award if the user truly excels in ALL aspects.
- **6.0 - 7.9:** Proficient. Clear and effective, but lacks the "X-Factor" or emotional depth. **Most good videos fall here.**
- **4.0 - 5.9:** Average. Mechanics are there, but delivery is flat, inconsistent, or lacks intention. **Most average videos fall here.**
- **0.0 - 3.9:** Weak. Fundamental gaps in confidence, structure, or congruence. **Needs significant work.**

**Parameter Scoring Benchmarks (Key Metrics):**

**VOICE - pace_control:**
- 10: Perfect rhythm, strategic pauses, never rushed or dragging. Master-level pacing.
- 8: Good pace with minor inconsistencies. Occasional rushed moments or awkward pauses.
- 6: Adequate pace but noticeable speed variations. Some rushed or slow sections.
- 4: Poor pacing - consistently too fast/slow, or erratic rhythm that distracts.

**PRESENCE - eye_contact:**
- 10: Sustained, natural direct gaze throughout. Connects deeply with audience/camera.
- 8: Good eye contact with occasional natural breaks. Mostly engaging.
- 6: Intermittent eye contact. Looks away frequently or stares too fixedly.
- 4: Minimal eye contact, mostly looking down/away. Avoids direct connection.

**PRESENCE - openness:**
- 10: Fully open posture, welcoming gestures, approachable energy. No barriers.
- 8: Generally open with minor closed-off moments (crossed arms, turned away).
- 6: Mixed signals - some openness but also defensive or closed body language.
- 4: Closed posture, defensive gestures, appears guarded or uncomfortable.

**CLARITY - structure:**
- 10: Crystal-clear organization, logical flow, easy to follow. Professional structure.
- 8: Well-structured with minor organizational gaps. Mostly clear progression.
- 6: Basic structure present but jumps around or lacks clear transitions.
- 4: Disorganized, hard to follow, lacks clear beginning/middle/end.

**CLARITY - focus:**
- 10: Laser-focused, stays on topic, no tangents. Every word serves the message.
- 8: Focused with occasional minor digressions that don't derail the message.
- 6: Some focus but wanders off-topic or includes unnecessary details.
- 4: Unfocused, rambling, unclear main point. Loses thread frequently.

**AUTHENTICITY - naturalness:**
- 10: Completely natural, genuine, no forced elements. Authentic self-expression.
- 8: Mostly natural with minor forced moments or slight artificiality.
- 6: Somewhat natural but noticeable forced expressions or rehearsed feel.
- 4: Clearly forced, artificial, or overly rehearsed. Lacks genuine expression.

**IMPACT - energy:**
- 10: Exceptional enthusiasm that's authentic and contagious. Energizes the audience.
- 8: Strong energy that's engaging but not overwhelming. Good enthusiasm.
- 6: Moderate energy - adequate but not particularly engaging or inspiring.
- 4: Low energy, flat delivery, or forced enthusiasm that feels fake.

**IMPACT - engagement:**
- 10: Captivating throughout, holds attention completely. Creates strong connection.
- 8: Engaging with good connection, but some moments lose momentum.
- 6: Adequately engaging but lacks consistent connection or attention-holding power.
- 4: Low engagement, fails to hold attention, disconnects from audience.

**CONFIDENCE - comfort_level:**
- 10: Completely at ease, no visible anxiety, natural confidence. Owns the space.
- 8: Comfortable with minor nervous tells (brief fidgets, slight tension).
- 6: Somewhat comfortable but noticeable anxiety or self-consciousness.
- 4: Clearly uncomfortable, high anxiety, appears nervous or insecure.

**Strict Scoring Rules:**
- **Default range: 5.0-6.5** for average videos. Only deviate if clearly exceptional or clearly weak.
- If the user fails the "${currentLens.critical_question}", the overall score cannot exceed 7.5.
- **Be conservative:** If unsure between two scores, always choose the lower one.
- **Avoid score inflation:** A "good" video should score 6-7, not 8-9. Reserve 8+ for exceptional.
- **Use benchmarks above:** Compare each parameter to the benchmarks. Don't give 8+ unless it truly matches the 8+ description.
- Be precise with decimals (e.g., 5.8, 6.3, 7.1) based on weighted sub-metrics.
- **Sub-metrics must align:** If presence is 8.0 but voice is 4.0, the overall cannot be 8.0. Scores should be internally consistent.
- **Cross-validate:** If energy is 9.0, engagement should also be high (7.5+). If eye_contact is 4.0, presence cannot be 8.0.

**Delivery Metrics (Categorical Only):**
- For speaking_rate_label: Choose "slow", "optimal", or "fast" based on your assessment of pace impact (not exact WPM count).
- For filler_word_level: Choose "low", "medium", or "high" based on whether filler words are distracting (not exact count).
- Focus on the **impact** of these factors, not precise numeric measurements.
</scoring_reference>

<output_format>
Provide the output in the following structure specifically designed for our parsing engine.
**IMPORTANT:** Keep the section headers exactly as written below in English (even if writing the content in Hebrew).

**Key Strengths**
Identify 2 specific elements the user nailed based on the ${currentLens.role} perspective.

**Focus Areas**
Identify 2 specific elements that are blocking success. Focus on the "Low hanging fruit".

**Communication Tips**
Analyze the content structure, clarity, and word choice. Provide exactly 2 distinct tips.
Use numbered list format (1., 2.) for the tips.

For EACH tip, use this EXACT format (do not deviate):
1. [Tip Title/Name]
  - ${isHebrew ? 'מה לתרגל:' : 'What to practice:'} [Specific actionable instruction]
  - ${isHebrew ? 'למה זה חשוב:' : 'Why it matters:'} [Explanation of impact]

${isHebrew ? `דוגמה:
1. פתיחה חזקה (The Hook)
  - מה לתרגל: התחל ישר מהכאב או מהפתרון, ללא הקדמות ארוכות
  - למה זה חשוב: זה תופס את תשומת הלב של הצופה בשניות הראשונות
2. הפחתת מילות מילוי
  - מה לתרגל: עצור ל-2 שניות לפני שאתה מתחיל לדבר כדי לאסוף את המחשבות שלך
  - למה זה חשוב: ביטול "אמ" ו"אה" גורם לך להישמע יותר בטוח ומקצועי` : `Example:
1. Strong Opening (The Hook)
  - What to practice: Start directly with the pain point or solution, skip long intros
  - Why it matters: This grabs viewer attention in the first few seconds
2. Reduce filler words
  - What to practice: Pause for 2 seconds before speaking to gather your thoughts
  - Why it matters: Eliminating "um" and "uh" makes you sound more confident and professional`}

**Body Language Tips**
Analyze the visual delivery (Micro-signals, Posture, Eye Contact). Provide exactly 2 distinct tips.
Use numbered list format (1., 2.) for the tips.
*Pro Tip: Cite specific timestamps if possible.*

For EACH tip, use this EXACT format (do not deviate):
1. [Tip Title/Name]
  - ${isHebrew ? 'מה לתרגל:' : 'What to practice:'} [Specific actionable instruction]
  - ${isHebrew ? 'למה זה חשוב:' : 'Why it matters:'} [Explanation of impact]

${isHebrew ? `דוגמה:
1. שמירה על קשר עין
  - מה לתרגל: הסתכל ישירות על עדשת המצלמה למשך 3-5 שניות, ואז הסתכל הצידה באופן טבעי
  - למה זה חשוב: קשר עין ישיר בונה אמון ומעורבות עם הקהל שלך
2. שליטה בידיים
  - מה לתרגל: החזק את הידיים באזור "תיבת הכוח" (בין הבטן לחזה) והשתמש בהן להדגשה
  - למה זה חשוב: זה משדר ביטחון ומסייע להעביר את המסר בצורה ברורה יותר` : `Example:
1. Maintain eye contact
  - What to practice: Look directly at the camera lens for 3-5 seconds, then briefly look away naturally
  - Why it matters: Direct eye contact builds trust and engagement with your audience
2. Hand Control
  - What to practice: Keep hands in the "power box" zone (stomach to chest) and use for emphasis
  - Why it matters: This projects confidence and helps articulate your message clearly`}

**Recording Note**
A 2-sentence executive summary answering the "Golden Question": "${currentLens.critical_question}".
${isHebrew ? 'Write the answer entirely in Hebrew.' : 'Start with a direct answer (Yes/No/Almost) and explain why.'}

**Quick Wins**
${isHebrew ? 'Translate sub-headers to Hebrew:' : ''}
- **The Game Changer:** One major psychological or strategic shift.
- **Physical Tweak:** One immediate body adjustment (e.g., "Chin up", "Slow down").
${userContext.includeEnvironmentFeedback !== false ? '- **Environment:** Lighting/Audio/Background fix.' : ''}

**JSON Output:**
The JSON must include an "insights" array with exactly 3 brief summary sentences${isHebrew ? ' in Hebrew' : ''}:
- First insight: Overall performance summary (what stands out most)
- Second insight: Key strength or positive aspect
- Third insight: Main area for improvement or opportunity

${isHebrew ? 'כל שלושת ה-insights חייבים להיות בעברית.' : 'All three insights should be concise and actionable.'}

\`\`\`json
${jsonSchema}
\`\`\`
</output_format>

<rules>
1. **Be Constructively Tough:** Don't sugarcoat, but always explain *why* it matters for a ${currentLens.role}.
2. **Context is King:** A suit is good for "Interview" but maybe stiff for "Content". Judge according to the ${focusArea}.
3. **No Emojis** in the text analysis (unless specified).
4. ${recordingPrompt?.title ? `Evaluate strictly against the prompt: "${recordingPrompt.title}".` : ''}
</rules>`;
};


const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.05,  // Reduced from 0.15 for more consistent scoring
  topP: 0.1,          // Reduced from 0.2 for narrower sampling
  topK: 8,            // Reduced from 16 for fewer token choices
  candidateCount: 1,
  maxOutputTokens: 8192  // Increased from 2048 to prevent truncation (prompt requires ~6-8 tips + JSON + other sections)
};

const DEFAULT_METRICS_SCHEMA_VERSION = 'metrics.schema.v1';

const sanitizeGenerationConfig = (overrides = {}) => {
  return {
    ...DEFAULT_GENERATION_CONFIG,
    ...overrides
  };
};

export const analyzeBodyLanguage = async (videoBuffer, mimeType, options = {}) => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error("API key is not available. Please ensure it is properly configured.");
    }
    
    const INLINE_LIMIT_BYTES = 20 * 1024 * 1024; // 20MB
    const fallbackModel = 'gemini-2.5-flash';
    const modelName = options.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    let effectiveModel = modelName;
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    logger.info({ modelName, fallbackModel, videoSizeMB: (videoBuffer.byteLength / 1024 / 1024).toFixed(2) }, '[Gemini] Starting video analysis');
    
    // Build dynamic prompt based on user context
    const userContext = options.userContext || {};
    // Ensure language is included in userContext if provided in options
    if (options.language && !userContext.language) {
      userContext.language = options.language;
    }
    const PROMPT = buildPrompt(userContext);
    const generationConfig = sanitizeGenerationConfig(options.generationConfig);

    const videoMetadata = {};
    if (options.startOffset) videoMetadata.startOffset = options.startOffset; // e.g., '40s'
    if (options.endOffset) videoMetadata.endOffset = options.endOffset;       // e.g., '80s'
    if (options.fps) videoMetadata.fps = options.fps;                         // e.g., 0.5, 1, 5

    // Generic retry with exponential backoff + jitter
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const shouldRetry = (err) => {
      const code = err?.status || err?.code;
      const msg = (err?.message || '').toLowerCase();
      if (code === 503 || code === 429) return true;
      if (msg.includes('unavailable') || msg.includes('overloaded') || msg.includes('rate')) return true;
      return false;
    };
    const callWithRetry = async (fn, { maxAttempts = 5, baseDelayMs = 500 }) => {
      let attempt = 0;
      let lastErr;
      while (attempt < maxAttempts) {
        try {
          return await fn(attempt);
        } catch (err) {
          lastErr = err;
          if (!shouldRetry(err)) break;
          const jitter = Math.floor(Math.random() * 200);
          const delay = baseDelayMs * Math.pow(2, attempt) + jitter;
          await sleep(delay);
          attempt += 1;
        }
      }
      throw lastErr || new Error('Request failed');
    };

    let response;
    // Use Files API for >20MB, else inline
    if (videoBuffer.byteLength > INLINE_LIMIT_BYTES) {
      // Write buffer to a temporary file for upload
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bodai-'));
      const ext = mimeType.split('/')[1] || 'mp4';
      const tmpPath = path.join(tmpDir, `upload.${ext}`);
      fs.writeFileSync(tmpPath, videoBuffer);
      try {
        const exec = async () => {
          const myfile = await ai.files.upload({
            file: tmpPath,
            config: { mimeType },
          });
          const tryModel = effectiveModel || modelName;
          logger.info({ model: tryModel, videoSizeMB: (videoBuffer.byteLength / 1024 / 1024).toFixed(2), apiType: 'Files API' }, '[Gemini] Calling API');
          return await ai.models.generateContent({
            model: tryModel,
            generationConfig,
            contents: [
              {
                parts: [
                  {
                    fileData: {
                      fileUri: myfile.uri,
                      mimeType: myfile.mimeType || mimeType,
                    },
                    ...(Object.keys(videoMetadata).length ? { videoMetadata } : {}),
                  },
                  { text: PROMPT },
                ],
              },
            ],
          });
        };
        const execWithFallback = async (attempt) => {
          try {
            effectiveModel = modelName;
            return await exec();
          } catch (err) {
            const errorCode = err?.status || err?.code;
            const errorMsg = err?.message || '';
            logger.warn({ 
              model: effectiveModel || modelName, 
              attempt, 
              status: errorCode, 
              code: err?.code, 
              message: errorMsg.substring(0, 200),
              apiType: 'Files API'
            }, '[Gemini] Model failed');
            // Fallback to flash after 2 failed attempts on overload
            const canFallback = modelName !== fallbackModel;
            if (attempt >= 1 && shouldRetry(err) && canFallback) {
              logger.warn({ originalModel: effectiveModel || modelName, fallbackModel, attempt, apiType: 'Files API' }, '[Gemini] Falling back to fallback model');
              effectiveModel = fallbackModel;
              logger.info({ model: fallbackModel, apiType: 'Files API' }, '[Gemini] Calling API with fallback model');
              return await ai.models.generateContent({
                model: fallbackModel,
                generationConfig,
                contents: [
                  {
                    parts: [
                      // Reuse same uploaded file
                      {
                        fileData: {
                          fileUri: myfile.uri,
                          mimeType,
                        },
                        ...(Object.keys(videoMetadata).length ? { videoMetadata } : {}),
                      },
                      { text: PROMPT },
                    ],
                  },
                ],
              });
            }
            throw err;
          }
        };
        response = await callWithRetry(execWithFallback, { maxAttempts: 5, baseDelayMs: 500 });
      } finally {
        // Cleanup temp file
        try { fs.unlinkSync(tmpPath); } catch {}
        try { fs.rmdirSync(tmpDir); } catch {}
      }
    } else {
      // Inline path for smaller videos
      const videoPart = {
        inlineData: {
          mimeType,
          data: videoBuffer.toString('base64'),
        },
        ...(Object.keys(videoMetadata).length ? { videoMetadata } : {}),
      };
      const exec = async () => {
        const tryModel = effectiveModel || modelName;
        logger.info({ model: tryModel, videoSizeMB: (videoBuffer.byteLength / 1024 / 1024).toFixed(2), apiType: 'Inline API' }, '[Gemini] Calling API');
        return await ai.models.generateContent({
          model: tryModel,
          generationConfig,
          contents: [
            {
              parts: [
                videoPart,
                { text: PROMPT },
              ],
            },
          ],
        });
      };
      const execWithFallback = async (attempt) => {
        try {
          effectiveModel = modelName;
          return await exec();
        } catch (err) {
          const errorCode = err?.status || err?.code;
          const errorMsg = err?.message || '';
          logger.warn({ 
            model: effectiveModel || modelName, 
            attempt, 
            status: errorCode, 
            code: err?.code, 
            message: errorMsg.substring(0, 200),
            apiType: 'Inline API'
          }, '[Gemini] Model failed');
          const canFallback = modelName !== fallbackModel;
          if (attempt >= 1 && shouldRetry(err) && canFallback) {
            logger.warn({ originalModel: effectiveModel || modelName, fallbackModel, attempt, apiType: 'Inline API' }, '[Gemini] Falling back to fallback model');
            effectiveModel = fallbackModel;
            logger.info({ model: fallbackModel, apiType: 'Inline API' }, '[Gemini] Calling API with fallback model');
            return await ai.models.generateContent({
              model: fallbackModel,
              generationConfig,
              contents: [
                {
                  parts: [
                    videoPart,
                    { text: PROMPT },
                  ],
                },
              ],
            });
          }
          throw err;
        }
      };
      response = await callWithRetry(execWithFallback, { maxAttempts: 5, baseDelayMs: 500 });
    }

    const text = typeof response.text === 'function' ? await response.text() : (response.text ?? response.response?.text);
    
    // Check for truncation in main analysis response
    const finishReason = response.response?.candidates?.[0]?.finishReason || 
                         response.candidates?.[0]?.finishReason || 
                         response.finishReason;
    
    if (finishReason === 'MAX_TOKENS' || finishReason === 'OTHER') {
      logger.warn({ finishReason, model: effectiveModel }, '[Gemini] Analysis response may be truncated - consider increasing maxOutputTokens');
    } else if (finishReason) {
      logger.info({ finishReason, model: effectiveModel }, '[Gemini] Response finishReason');
    }
    
    // Parse structured metrics from the response
    let metrics = null;
    let parsedText = text || '';
    let rawMetricsPayload = null;
    let metricsVersion = DEFAULT_METRICS_SCHEMA_VERSION;
    
    // Try to extract JSON metrics block
    const jsonMatch = text?.match(/```json\s*([\s\S]*?)\s*```/) || text?.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const jsonContent = jsonMatch[1].trim();
        const parsed = JSON.parse(jsonContent);
        rawMetricsPayload = parsed;
        metricsVersion = parsed.schema_version || parsed.version || DEFAULT_METRICS_SCHEMA_VERSION;
        
        // Check if this is Module 1 baseline format (warmth_score, competence_score)
        if (parsed.warmth_score !== undefined && parsed.competence_score !== undefined) {
          // Module 1 baseline format
          metrics = {
            warmth_score: parsed.warmth_score,
            competence_score: parsed.competence_score,
            quadrant: parsed.quadrant || 'contempt',
            warmth_evidence: parsed.warmth_evidence || [],
            competence_evidence: parsed.competence_evidence || [],
            first_impression_analysis: parsed.first_impression_analysis || '',
            congruence: parsed.congruence || 'medium',
            recommendations: parsed.recommendations || []
          };
        } else if (parsed.sub_scores && parsed.final_scores) {
          // New format with sub-scores
          const calculatedOverallScore = calculateOverallScore(parsed.final_scores);
          metrics = {
            subScores: parsed.sub_scores,
            finalScores: parsed.final_scores,
            presence: parsed.final_scores.presence,
            voice_expression: parsed.final_scores.voice,
            clarity: parsed.final_scores.clarity,
            authenticity: parsed.final_scores.authenticity,
            impact: parsed.final_scores.impact,
            confidence: parsed.final_scores.confidence,
            overall_score: calculatedOverallScore,
            stage_title: getStageTitle(calculatedOverallScore),
            insights: parsed.insights || [],
            analysis: parsed.analysis || {},
            validation: parsed.validation || {}
          };
          if (parsed.prompt_focus) {
            metrics.prompt_focus = parsed.prompt_focus;
          }
        } else if (parsed.metrics && parsed.overall_score !== undefined) {
          // Old format (backward compatibility)
          metrics = {
            presence: parsed.metrics.presence,
            voice_expression: parsed.metrics.voice_expression,
            clarity: parsed.metrics.clarity,
            authenticity: parsed.metrics.authenticity,
            impact: parsed.metrics.impact,
            confidence: parsed.metrics.confidence,
            overall_score: parsed.overall_score,
            stage_title: parsed.stage_title || 'Emerging Communicator',
            insights: parsed.insights || []
          };
        }
        
        if (metrics) {
          if (parsed.delivery_metrics) {
            metrics.delivery = parsed.delivery_metrics;
          }
          // Remove the JSON block from the text response
          parsedText = text.replace(jsonMatch[0], '').trim();
        }
      } catch (e) {
        logger.warn({ error: e.message, model: effectiveModel }, '[Gemini] Failed to parse metrics JSON from AI response');
      }
    }
    
    logger.info({ effectiveModel, originalModel: modelName }, '[Gemini] Analysis completed successfully');
    
    return {
      text: parsedText,
      metrics: metrics,
      rawMetrics: rawMetricsPayload,
      metricsVersion,
      modelVersion: effectiveModel,
      finishReason: finishReason  // Include finishReason for validation
    };
};

export const generatePracticePromptFromAction = async ({
  title,
  details = {},
  userContext = {},
  targetMetric = 'overall',
  difficulty = 'intermediate',
  estimatedTime = '45 seconds',
  previousTitles = []
}) => {
  if (!process.env.API_KEY) {
    logger.warn({}, '[Gemini] Cannot generate practice prompt: API_KEY missing');
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const fallbackModel = 'gemini-2.5-flash';
  const modelName = process.env.GEMINI_PRACTICE_MODEL || 'gemini-2.5-flash';
  logger.info({ modelName, fallbackModel }, '[Gemini] Starting practice prompt generation');
  const goal = userContext.primaryGoal || 'confidence';
  const confidence = userContext.confidenceLevel || 'medium';
  const language = userContext.language || 'en';
  const isHebrew = language === 'he';
  
  // Use lens mapping for context if available
  const goalToLens = {
    'content': 'Content',
    'leadership': 'Leadership',
    'confidence': 'Confidence',
    'presentation': 'Presentation',
    'interview': 'Interview',
    'sales': 'Face-to-Face Sales'
  };
  const focusArea = goalToLens[goal] || 'Confidence';
  const currentLens = lensMapping[focusArea] || lensMapping['Confidence'];

  const detailText = [
    details.what_to_do ? `What to do: ${details.what_to_do}` : null,
    details.why_it_matters ? `Why it matters: ${details.why_it_matters}` : null,
    details.example ? `Example: ${details.example}` : null,
  ].filter(Boolean).join('\n');

  const priorList = previousTitles && previousTitles.length > 0
    ? `Previous drills already used for this user:\n${previousTitles.map(t => `- ${t}`).join('\n')}\n`
    : '';

  const languageInstruction = isHebrew 
    ? '\n\n**IMPORTANT: Respond entirely in Hebrew (עברית). All text fields (title, description, setup, what_to_notice, recording_tip) must be in Hebrew. Only JSON field names should remain in English.**'
    : '';

  const prompt = `You are an elite AI Coach specializing in ${currentLens.role}. Your goal is to design a quick 45-second practice drill that users can rehearse on their own.
${languageInstruction}

User Profile:
- Goal: ${goal} (${currentLens.priority})
- Confidence: ${confidence}
- Target Metric: ${targetMetric}
- Recommended Difficulty: ${difficulty}
- Recommended Duration: ${estimatedTime}

Context specific to their goal ("${focusArea}"):
${currentLens.critical_question}

Action Item to reinforce:
Title: ${title}
${detailText}
${priorList}

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
**CRITICAL REQUIREMENTS:**
1. The drill MUST be directly related to the Action Item title and details above. Do NOT generate generic drills.
2. The drill MUST align with the user's goal (${goal}). For example, if goal is "Content Creator", the drill should be about talking to camera for content, NOT about sales meetings.
3. The description must explicitly mention: "Record a ~45 second video where you [specific action related to the Action Item]"
4. The setup, what_to_notice, and recording_tip must be SPECIFIC and ACTIONABLE, not vague.
5. The drill must be PRACTICAL - something the user can do right now without special equipment.
6. Ensure the drill is distinct from prior ones if provided.
7. Remind the user the drill is self-practice, no upload required.`;

  const runGeneration = async (model) => {
    logger.info({ model }, '[Gemini] Calling API for practice prompt generation');
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });
    return typeof response.text === 'function' ? await response.text() : (response.text ?? response.response?.text);
  };

  try {
    let effectiveModel = modelName;
    let text = await runGeneration(modelName);
    if (!text && modelName !== fallbackModel) {
      logger.warn({ modelName, fallbackModel }, '[Gemini] Model returned empty response, trying fallback');
      effectiveModel = fallbackModel;
      text = await runGeneration(fallbackModel);
    }
    if (!text) {
      logger.error({ model: effectiveModel }, '[Gemini] Practice prompt generation failed - no response');
      return null;
    }
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed?.title || !parsed?.description) {
      logger.error({ model: effectiveModel }, '[Gemini] Practice prompt generation failed - invalid response');
      return null;
    }
    logger.info({ model: effectiveModel }, '[Gemini] Practice prompt generated successfully');
    return normalizePracticePrompt(parsed);
  } catch (err) {
    if (modelName !== fallbackModel) {
      try {
        logger.warn({ modelName, fallbackModel, error: err.message?.substring(0, 200) }, '[Gemini] Model failed, trying fallback');
        const text = await runGeneration(fallbackModel);
        if (!text) {
          logger.error({ model: fallbackModel }, '[Gemini] Practice prompt generation failed - no response from fallback');
          return null;
        }
        const cleaned = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (!parsed?.title || !parsed?.description) {
          logger.error({ model: fallbackModel }, '[Gemini] Practice prompt generation failed - invalid response from fallback');
          return null;
        }
        logger.info({ model: fallbackModel }, '[Gemini] Practice prompt generated successfully using fallback model');
        return normalizePracticePrompt(parsed);
      } catch (fallbackErr) {
        logger.error({ error: fallbackErr.message || fallbackErr, model: fallbackModel }, '[Gemini] Failed to generate practice prompt (fallback)');
        return null;
      }
    }
    logger.error({ error: err.message || err, model: modelName }, '[Gemini] Failed to generate practice prompt');
    return null;
  }
};

const normalizePracticePrompt = (parsed) => {
  if (!parsed?.title || !parsed?.description) {
    return null;
  }

  return {
    title: parsed.title.trim(),
    description: parsed.description.trim(),
    setup: parsed.setup?.trim?.() || null,
    whatToNotice: parsed.what_to_notice?.trim?.() || null,
    recordingTip: parsed.recording_tip?.trim?.() || null,
    targetMetric: parsed.target_metric || 'overall',
    difficulty: parsed.difficulty || null,
    estimatedTime: parsed.estimated_time || null,
    version: typeof parsed.version === 'number' ? parsed.version : null,
    source: parsed.source || 'ai'
  };
};

/**
 * Generate personalized practice missions for a specific parameter/weakness
 * Returns an array of 4-5 actionable practice steps
 */
export const generatePracticeMissions = async ({
  parameterKey,
  parameterLabel,
  parameterDescription,
  currentScore,
  targetScore = 7.5,
  userContext = {},
  trend = null,
  previousMissions = []
}) => {
  if (!process.env.API_KEY) {
    logger.warn({}, '[Gemini] Cannot generate practice missions: API_KEY missing');
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const fallbackModel = 'gemini-2.5-flash';
  const modelName = process.env.GEMINI_PRACTICE_MODEL || 'gemini-2.5-flash';
  
  logger.info({ parameterKey, modelName, fallbackModel }, '[Gemini] Starting practice missions generation');
  
  const goal = userContext.primaryGoal || 'confidence';
  const goalLabel = getGoalLabel(goal);
  const confidence = userContext.confidenceLevel || 'medium';
  const language = userContext.language || 'en';
  const isHebrew = language === 'he';
  
  const trendInfo = trend 
    ? `Trend: ${trend.direction === 'improving' ? 'Improving' : trend.direction === 'declining' ? 'Declining' : 'Stable'} (${trend.change > 0 ? '+' : ''}${trend.change.toFixed(1)} points)`
    : 'No trend data available';
  
  const previousMissionsText = previousMissions && previousMissions.length > 0
    ? `\nPrevious missions already shown to this user (avoid repeating these exact missions):\n${previousMissions.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n`
    : '';

  const languageInstruction = isHebrew 
    ? '\n\n**IMPORTANT: Respond entirely in Hebrew (עברית). All mission text must be in Hebrew. Only JSON field names should remain in English.**'
    : '';

  // Get goal-specific context for better personalization
  const goalContextMap = {
    'content': 'content creation and talking to camera (creating videos, vlogs, social media content)',
    'leadership': 'leadership presence and executive communication (leading teams, presenting to stakeholders)',
    'confidence': 'self-confidence and presence (general communication confidence)',
    'presentation': 'presentations and public speaking (formal presentations, speeches)',
    'interview': 'job and promotion interviews (interview skills, professional communication)',
    'sales': 'face-to-face sales conversations (sales pitches, client meetings)',
    'dating': 'dating and romantic communication',
    'social': 'social situations and networking',
    'general': 'general communication improvement'
  };
  const goalContext = goalContextMap[goal] || goalContextMap['general'];

  const prompt = `You are an expert communication coach creating personalized practice missions (actionable steps) for users to improve a specific communication skill.${languageInstruction}

USER CONTEXT:
- Goal: ${goalLabel} (${goal}) - ${goalContext}
- Confidence Level: ${confidence}
- Current Score: ${currentScore.toFixed(1)}/10
- Target Score: ${targetScore}/10
- Gap to Target: ${(targetScore - currentScore).toFixed(1)} points
${trendInfo}
${previousMissionsText}

PARAMETER TO IMPROVE:
- Name: ${parameterLabel}
- Key: ${parameterKey}
- Description: ${parameterDescription}

CRITICAL REQUIREMENTS:
1. **Contextualize for ${goalLabel}**: All missions MUST be relevant to ${goalContext}. 
   - If goal is "content creation", missions should involve video recording, talking to camera, creating content
   - If goal is "sales", missions should involve sales scenarios, client interactions
   - If goal is "interview", missions should involve interview practice, professional communication
   - DO NOT use generic examples that don't match the user's goal (e.g., don't mention "sales opening" if goal is "content creation")

2. **Language**: ${isHebrew ? 'ALL mission text MUST be in Hebrew (עברית). Write naturally in Hebrew.' : 'Write in English.'}

Generate exactly 2 PRACTICE MISSIONS (numbered steps) that are:
1. Specific and actionable (user can do them alone, no partner needed)
2. Progressive (start easier, build up)
3. Diverse (different types of exercises - recording, mirror practice, daily habits, etc.)
4. **Highly personalized to their ${goalLabel} goal** - missions must be relevant to ${goalContext}
5. Appropriate for their current score of ${currentScore.toFixed(1)}/10
6. Different from previous missions if provided

Each mission should be:
- 1-2 sentences max
- Clear what to do and how long (e.g., "Record a 1-minute video...", "Practice for 5 minutes daily...")
- Focused on improving ${parameterLabel} specifically
- **Contextualized for ${goalContext}** - use scenarios relevant to their goal

Respond ONLY with valid JSON (no markdown) in this format:
{
  "missions": [
    "First specific actionable step the user can do (contextualized for ${goalContext})",
    "Second specific actionable step (contextualized for ${goalContext})"
  ]
}`;

  const runGeneration = async (model) => {
    logger.info({ model, parameterKey }, '[Gemini] Calling API for practice missions generation');
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8, // Higher temperature for more diverse missions
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048 // Increased to prevent truncation
      }
    });
    
    // Check for truncation
    const finishReason = response.response?.candidates?.[0]?.finishReason || 
                         response.candidates?.[0]?.finishReason || 
                         response.finishReason;
    
    if (finishReason === 'MAX_TOKENS' || finishReason === 'OTHER') {
      logger.warn({ finishReason, model, parameterKey }, '[Gemini] Response may be truncated');
    }
    
    return typeof response.text === 'function' ? await response.text() : (response.text ?? response.response?.text);
  };

  try {
    let effectiveModel = modelName;
    let text = await runGeneration(modelName);
    
    if (!text && modelName !== fallbackModel) {
      logger.warn({ modelName, fallbackModel, parameterKey }, '[Gemini] Model returned empty response, trying fallback');
      effectiveModel = fallbackModel;
      text = await runGeneration(fallbackModel);
    }
    
    if (!text) {
      logger.error({ model: effectiveModel, parameterKey }, '[Gemini] Practice missions generation failed - no response');
      return null;
    }
    
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    if (!parsed?.missions || !Array.isArray(parsed.missions) || parsed.missions.length === 0) {
      logger.error({ model: effectiveModel, parameterKey }, '[Gemini] Practice missions generation failed - invalid response');
      return null;
    }
    
    // Filter out empty missions and trim
    const missions = parsed.missions
      .filter(m => m && typeof m === 'string' && m.trim().length > 0)
      .map(m => m.trim())
      .slice(0, 2); // Exactly 2 missions
    
    if (missions.length === 0) {
      logger.error({ model: effectiveModel, parameterKey }, '[Gemini] Practice missions generation failed - no valid missions in response');
      return null;
    }
    
    logger.info({ missionCount: missions.length, parameterKey, model: effectiveModel }, '[Gemini] Generated practice missions successfully');
    return missions;
    
  } catch (err) {
    if (modelName !== fallbackModel) {
      try {
        logger.warn({ modelName, fallbackModel, error: err.message?.substring(0, 200), parameterKey }, '[Gemini] Model failed, trying fallback');
        const text = await runGeneration(fallbackModel);
        if (!text) {
          logger.error({ model: fallbackModel, parameterKey }, '[Gemini] Practice missions generation failed - no response from fallback');
          return null;
        }
        const cleaned = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (!parsed?.missions || !Array.isArray(parsed.missions) || parsed.missions.length === 0) {
          logger.error({ model: fallbackModel, parameterKey }, '[Gemini] Practice missions generation failed - invalid response from fallback');
          return null;
        }
        const missions = parsed.missions
          .filter(m => m && typeof m === 'string' && m.trim().length > 0)
          .map(m => m.trim())
          .slice(0, 2);
        logger.info({ missionCount: missions.length, parameterKey, model: fallbackModel }, '[Gemini] Generated practice missions successfully using fallback model');
        return missions;
      } catch (fallbackErr) {
        logger.error({ error: fallbackErr.message || fallbackErr, model: fallbackModel, parameterKey }, '[Gemini] Failed to generate practice missions (fallback)');
        return null;
      }
    }
    logger.error({ error: err.message || err, model: modelName, parameterKey }, '[Gemini] Failed to generate practice missions');
    return null;
  }
};

// Helper function to get goal label (reused from buildPrompt)
const getGoalLabel = (goal) => {
  const goalMap = {
    'confidence': 'Build Confidence',
    'content': 'Content Creator',
    'presentation': 'Presentation Skills',
    'communication': 'Better Communication',
    'leadership': 'Executive Presence',
    'dating': 'Dating & Romantic',
    'social': 'Social Confidence',
    'interview': 'Job Interviews',
    'sales': 'Face-to-face Sales',
    'general': 'General Improvement'
  };
  return goalMap[goal] || goal;
};