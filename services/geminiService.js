import 'dotenv/config';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { GoogleGenAI } from "@google/genai";

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

// Build Module 1 baseline prompt
const buildModule1BaselinePrompt = () => {
  return `You are an expert body language and social psychology analyst specializing in the Stereotype Content Model (Warmth vs Competence framework).

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

\`\`\`json
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
\`\`\`

Be honest and specific. This baseline will guide their learning journey.`;
};

// Build dynamic prompt based on user context
const buildPrompt = (userContext = {}) => {
  // Check if this is a Module 1 baseline assessment
  const courseContext = userContext.courseContext || (typeof userContext === 'string' ? JSON.parse(userContext) : null);
  if (courseContext?.type === 'baseline' && courseContext?.moduleId === 'module-1') {
    return buildModule1BaselinePrompt();
  }

  const goal = userContext.primaryGoal || 'confidence';
  const confidence = userContext.confidenceLevel || 'medium';

  // Map goals to specific focus areas (only active goals in the app)
  const goalFocus = {
    'content': 'content creation and talking to camera',
    'leadership': 'leadership presence and executive communication',
    'confidence': 'self-confidence and presence',
    'presentation': 'presentations and public speaking',
  };

  // Get focus area with fallback to confidence (default goal)
  const focusArea = goalFocus[goal] || goalFocus['confidence'];
  const goalLabel = goal.replace(/-/g, ' ');
  const recordingPrompt = userContext.recordingPrompt || null;
  const historicalContextBlock = userContext.historicalContext ? buildHistoricalContextBlock(userContext.historicalContext) : '';
  
  // Tone based on confidence
  const tone = (confidence === 'very-low' || confidence === 'low') 
    ? 'gentle and encouraging' 
    : (confidence === 'medium' ? 'balanced' : 'direct and professional');

  // Practice focus block - only if user is practicing a specific action item
  const practiceFocusBlock = recordingPrompt?.title ? `
PRACTICE FOCUS EVALUATION
The user is practicing: "${recordingPrompt.title}"
Action Item ID: ${recordingPrompt.actionItemId || 'baseline'}
Target: ${recordingPrompt.targetMetric || 'overall'}
Description: ${recordingPrompt.description || 'General practice'}

Evaluate how well they executed this specific practice. Score their performance on this focus area independently from overall analysis. The score determines if they pass (>=7) or need more practice (<7).
` : '';

  // JSON schema - using varied example values to prevent anchoring
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
  "delivery_metrics": { "speaking_rate_wpm": 0, "filler_word_count": 0, "sentiment": "", "posture_flag": "" },
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
  "delivery_metrics": { "speaking_rate_wpm": 0, "filler_word_count": 0, "sentiment": "", "posture_flag": "" },
  "validation": { "jump_detected": false, "jump_explanation": "", "confidence": 0.0 },
  "insights": ["", "", ""]
}`;

  // Build the prompt with XML structure (Gemini best practice)
  return `<role>
Communication and presence coach analyzing a practice video. You evaluate both verbal delivery (speech, clarity, pace) and non-verbal communication (body language, posture, gestures, eye contact).
</role>

<user_context>
Goal: ${goalLabel} (${focusArea})
Confidence Level: ${confidence}
Tone: ${tone}
${historicalContextBlock}${practiceFocusBlock}
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
- filler_word_count: count "um", "uh", "like", "ummm" and other filler words.
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
2 prioritized tips to improve speech and delivery. Format each as:
[Title]
- What to practice: [specific instruction]
- Why it matters: [how this helps achieve their ${goalLabel} goal]

**Body Language Tips**
2 prioritized tips to improve presence and non-verbal communication. Format each as:
[Title]
- What to practice: [specific instruction]
- Why it matters: [how this helps achieve their ${goalLabel} goal]

**Recording Note**
One sentence about camera setup, framing, or lighting ONLY if it significantly affected the analysis quality.

**Quick Wins**
1-2 simple actions they can try immediately in their next conversation or recording.

End with JSON metrics block:
\`\`\`json
${jsonSchema}
\`\`\`
</output_format>

<rules>
1. Score based ONLY on what you observe in the video. Do not copy placeholder values.
2. Replace all 0.0 with actual scores (use decimals like 6.5, 7.8).
3. Be strict: only give 7+ for genuinely strong performance.
4. If eye contact is poor, score eye_contact 0-4. If monotone, score tone_variation 0-4.
5. overall_score = (voice×0.15 + presence×0.15 + clarity×0.15 + authenticity×0.15 + impact×0.20 + confidence×0.20) × 10
6. ${recordingPrompt?.title ? `prompt_focus.score must reflect actual execution of "${recordingPrompt.title}". Score >=7 means pass, <7 means needs practice.` : 'No practice focus for this video.'}
7. Provide 3 specific insights for the communication journal.
8. Communication Tips focus on SPEECH: pace, clarity, structure, filler words, vocal variety.
9. Body Language Tips focus on NON-VERBAL: posture, gestures, eye contact, facial expressions, openness.
10. No emojis in the response.
</rules>`;
};


const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.05,  // Reduced from 0.15 for more consistent scoring
  topP: 0.1,          // Reduced from 0.2 for narrower sampling
  topK: 8,            // Reduced from 16 for fewer token choices
  candidateCount: 1,
  maxOutputTokens: 2048
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
    const modelName = options.model || 'gemini-2.5-pro';
    let effectiveModel = modelName;
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Build dynamic prompt based on user context
    const userContext = options.userContext || {};
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
          const tryModel = modelName;
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
            // Fallback to flash after 2 failed attempts on overload
            const canFallback = modelName !== fallbackModel;
            if (attempt >= 1 && shouldRetry(err) && canFallback) {
              effectiveModel = fallbackModel;
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
        return await ai.models.generateContent({
          model: modelName,
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
          const canFallback = modelName !== fallbackModel;
          if (attempt >= 1 && shouldRetry(err) && canFallback) {
            effectiveModel = fallbackModel;
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
          // New format with sub-scores
          metrics = {
            subScores: parsed.sub_scores,
            finalScores: parsed.final_scores,
            presence: parsed.final_scores.presence,
            voice_expression: parsed.final_scores.voice,
            clarity: parsed.final_scores.clarity,
            authenticity: parsed.final_scores.authenticity,
            impact: parsed.final_scores.impact,
            confidence: parsed.final_scores.confidence,
            overall_score: parsed.overall_score,
            stage_title: parsed.stage_title || 'Emerging Communicator',
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
        console.warn('Failed to parse metrics JSON from AI response:', e);
      }
    }
    
    console.log(`[Gemini] Analysis completed using model: ${effectiveModel}`);
    
    return {
      text: parsedText,
      metrics: metrics,
      rawMetrics: rawMetricsPayload,
      metricsVersion,
      modelVersion: effectiveModel
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
    console.warn('Cannot generate practice prompt: API_KEY missing');
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const fallbackModel = 'gemini-2.5-flash';
  const modelName = process.env.GEMINI_PRACTICE_MODEL || 'gemini-2.5-flash';
  const goal = userContext.primaryGoal || 'confidence';
  const confidence = userContext.confidenceLevel || 'medium';
  const detailText = [
    details.what_to_do ? `What to do: ${details.what_to_do}` : null,
    details.why_it_matters ? `Why it matters: ${details.why_it_matters}` : null,
    details.example ? `Example: ${details.example}` : null,
  ].filter(Boolean).join('\n');

  const priorList = previousTitles && previousTitles.length > 0
    ? `Previous drills already used for this user:\n${previousTitles.map(t => `- ${t}`).join('\n')}\n`
    : '';

  const prompt = `You are an expert body language coach designing quick 45-second practice drills that users can rehearse on their own (no upload required, optional self-recording).

Goal/Context: ${goal}
User confidence: ${confidence}
Target metric to improve: ${targetMetric}
Recommended difficulty: ${difficulty}
Recommended duration: ${estimatedTime}
${priorList}

Action Item to reinforce:
Title: ${title}
${detailText}

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
- Remind the user the drill is self-practice, no upload required.`;

  const runGeneration = async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });
    return typeof response.text === 'function' ? await response.text() : (response.text ?? response.response?.text);
  };

  try {
    let text = await runGeneration(modelName);
    if (!text && modelName !== fallbackModel) {
      text = await runGeneration(fallbackModel);
    }
    if (!text) return null;
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed?.title || !parsed?.description) {
      return null;
    }
    return normalizePracticePrompt(parsed);
  } catch (err) {
    if (modelName !== fallbackModel) {
      try {
        const text = await runGeneration(fallbackModel);
        if (!text) return null;
        const cleaned = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (!parsed?.title || !parsed?.description) {
          return null;
        }
        return normalizePracticePrompt(parsed);
      } catch (fallbackErr) {
        console.error('Failed to generate practice prompt (fallback):', fallbackErr.message || fallbackErr);
        return null;
      }
    }
    console.error('Failed to generate practice prompt:', err.message || err);
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