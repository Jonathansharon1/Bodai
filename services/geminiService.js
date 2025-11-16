import 'dotenv/config';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { GoogleGenAI } from "@google/genai";

// Build dynamic prompt based on user context
const buildPrompt = (userContext = {}) => {
  const goal = userContext.primaryGoal || 'general';
  const confidence = userContext.confidenceLevel || 'medium';
  const goalSpecific = userContext.goalSpecificContext || {};

  // Map goals to specific focus areas
  const goalFocus = {
    'confidence': 'building self-confidence and presence',
    'interview': 'job interview preparation and professional presentation',
    'presentation': 'public speaking, presentations, and engaging audiences',
    'communication': 'interpersonal communication and social interactions',
    'leadership': 'leadership presence and commanding respect',
    'dating': 'romantic situations and making a positive impression',
    'social': 'social confidence and comfort in group settings',
    'general': 'overall body language improvement',
  };

  // Map goal-specific answers to readable context
  const getGoalSpecificContext = () => {
    if (!goalSpecific || Object.keys(goalSpecific).length === 0) {
      return '';
    }

    const contextParts = [];
    
    // Map question IDs to readable labels
    const question1Labels = {
      'confidence': {
        'work': 'Work/Professional situations',
        'social': 'Social gatherings',
        'dating': 'Dating/Romantic situations',
        'speaking': 'Public speaking',
        'new-people': 'Meeting new people',
        'general': 'General daily interactions',
      },
      'interview': {
        'technical': 'Technical interviews',
        'behavioral': 'Behavioral interviews',
        'panel': 'Panel interviews',
        'phone-video': 'Phone/Video interviews',
        'all-types': 'All types of interviews',
      },
      'presentation': {
        'small-team': 'Small team (5-10 people)',
        'large-conference': 'Large conference (50+ people)',
        'online': 'Online/Virtual presentations',
        'mixed': 'Mixed audience sizes',
      },
      'communication': {
        'one-on-one': 'One-on-one conversations',
        'team-meetings': 'Team meetings',
        'difficult-conversations': 'Difficult conversations',
        'networking': 'Networking events',
        'all-situations': 'All communication situations',
      },
      'leadership': {
        'team-lead': 'Leading a team',
        'meetings': 'Leading meetings',
        'presentations': 'Presenting to stakeholders',
        'conflict': 'Managing conflict',
        'all-leadership': 'All leadership situations',
      },
      'dating': {
        'first-dates': 'First dates',
        'online-dating': 'Online dating (video calls)',
        'meeting-family': 'Meeting parents/family',
        'long-term': 'Long-term relationships',
        'all-dating': 'All dating situations',
      },
      'social': {
        'parties': 'Parties and social gatherings',
        'networking': 'Networking events',
        'small-groups': 'Small group conversations',
        'new-people': 'Meeting new people',
        'all-social': 'All social situations',
      },
    };

    const question2Labels = {
      'confidence': {
        'comfort': 'Feel more comfortable in challenging situations',
        'impression': 'Make a better first impression',
        'overcome-fear': 'Overcome specific fears or anxieties',
        'self-assurance': 'Feel more self-assured overall',
      },
      'interview': {
        'nervousness': 'Nervousness/Anxiety',
        'answering': 'Answering questions clearly',
        'body-language': 'Body language/First impression',
        'technical-skills': 'Technical skills presentation',
        'all-concerns': 'All of the above',
      },
      'presentation': {
        'stage-fright': 'Stage fright/Nervousness',
        'engaging': 'Engaging the audience',
        'qa': 'Handling Q&A sessions',
        'structure': 'Structuring and delivering content',
      },
      'communication': {
        'listening': 'Better listening skills',
        'expressing': 'Expressing ideas clearly',
        'non-verbal': 'Using non-verbal cues effectively',
        'confidence': 'Feeling more confident while speaking',
      },
      'leadership': {
        'authority': 'Commanding authority and respect',
        'influence': 'Influencing and persuading',
        'presence': 'Building executive presence',
        'confidence': 'Feeling more confident as a leader',
      },
      'dating': {
        'first-impression': 'Making a good first impression',
        'relaxed': 'Being more relaxed and natural',
        'showing-interest': 'Showing interest effectively',
        'reading-cues': 'Reading body language cues',
      },
      'social': {
        'comfort': 'Feeling more comfortable',
        'starting-conversations': 'Starting conversations',
        'maintaining': 'Maintaining engaging conversations',
        'body-language': 'Using positive body language',
      },
    };

    if (goalSpecific.question1) {
      const label = question1Labels[goal]?.[goalSpecific.question1] || goalSpecific.question1;
      contextParts.push(`- Specific Context: ${label}`);
    }

    if (goalSpecific.question2) {
      const label = question2Labels[goal]?.[goalSpecific.question2] || goalSpecific.question2;
      contextParts.push(`- Primary Concern/Goal: ${label}`);
    }

    return contextParts.length > 0 ? contextParts.join('\n') : '';
  };

  const focusArea = goalFocus[goal] || goalFocus['general'];
  const goalLabel = goal === 'general' ? 'overall improvement' : goal.replace(/-/g, ' ');
  const specificContext = getGoalSpecificContext();

  // Adjust tone based on confidence level
  const getToneGuidance = () => {
    if (confidence === 'very-low' || confidence === 'low') {
      return 'Use a gentle, encouraging, and supportive tone. This user is already self-aware and may be sensitive. Focus on building them up, highlighting existing strengths, and providing small, manageable steps. Avoid overwhelming them with too many changes at once.';
    } else if (confidence === 'medium') {
      return 'Use a balanced, encouraging tone. Provide constructive feedback while acknowledging their self-awareness. Offer clear, actionable steps.';
    } else {
      return 'Use a professional, direct tone. This user is confident and ready for advanced feedback. Provide specific, detailed recommendations.';
    }
  };

  return `You are an expert body language coach specializing in helping professionals improve their presence and impact.

**User Context:**
- Primary Goal: ${goalLabel}
- Current Confidence Level: ${confidence}
- Focus Area: ${focusArea}
${specificContext ? specificContext : ''}

**Tone Guidance:**
${getToneGuidance()}

Analyze the following video with these goals and context in mind, and provide a concise, encouraging analysis that directly supports the user's objectives.
Note: DO NOT include emojis in your response.
**IMPORTANT: At the end of your response, include a structured metrics section in JSON format with detailed sub-scores:**

\`\`\`json
{
  "sub_scores": {
    "voice": {
      "volume_stability": 7.5,
      "tone_variation": 6.8,
      "pace_control": 7.2,
      "articulation": 6.5,
      "warmth": 7.0
    },
    "presence": {
      "eye_contact": 7.5,
      "facial_relaxation": 6.8,
      "body_posture": 7.2,
      "hand_naturalness": 6.5,
      "openness": 7.0
    },
    "clarity": {
      "structure": 7.5,
      "focus": 6.8,
      "example_usage": 7.2,
      "transition_quality": 6.5,
      "repetition_control": 7.0
    },
    "authenticity": {
      "naturalness": 7.5,
      "emotional_transparency": 6.8,
      "forced_expression_reduction": 7.2
    },
    "impact": {
      "energy": 7.5,
      "engagement": 6.8,
      "persuasiveness": 7.2
    },
    "confidence": {
      "filler_word_control": 7.5,
      "pause_control": 6.8,
      "physical_tension": 7.2,
      "vocal_stability": 6.5,
      "comfort_level": 7.0
    }
  },
  "final_scores": {
    "voice": 7.0,
    "presence": 7.0,
    "clarity": 7.0,
    "authenticity": 7.0,
    "impact": 7.0,
    "confidence": 7.0
  },
  "overall_score": 70.0,
  "stage_title": "Emerging Communicator",
  "analysis": {
    "overview": "Brief overview of overall performance",
    "strengths": "Key strengths identified",
    "focus_area": "Main area for improvement",
    "action_items": "Actionable steps",
    "personal_insight": "Personalized insight based on user context"
  },
  "validation": {
    "jump_detected": false,
    "jump_explanation": "",
    "confidence": 0.9
  },
  "insights": [
    "Your eye contact is strong and engaging, which builds trust immediately.",
    "Consider varying your vocal pace to add more energy to key points.",
    "Your natural gestures complement your words well, showing authenticity."
  ]
}
\`\`\`

**CRITICAL SCORING RULES - YOU MUST FOLLOW STRICTLY:**

**Sub-Metric Scoring Definitions (0-10 scale):**
- **0-3 (Weak)**: Clear issues, needs significant improvement, noticeable problems
- **4-6 (Average)**: Acceptable but room for improvement, some inconsistencies
- **7-10 (Strong)**: Good to excellent, effective, natural, engaging

**VOICE Sub-Metrics:**
- **volume_stability** (0-10): Consistent volume without sudden drops/spikes. 0-3: Frequent volume changes. 4-6: Some variation. 7-10: Steady, controlled volume.
- **tone_variation** (0-10): Vocal variety and expressiveness. 0-3: Monotone. 4-6: Some variation. 7-10: Dynamic, expressive tone.
- **pace_control** (0-10): Appropriate speaking speed, not too fast/slow. 0-3: Too fast/slow, hard to follow. 4-6: Generally appropriate. 7-10: Well-paced, easy to follow.
- **articulation** (0-10): Clear pronunciation, words are distinct. 0-3: Mumbling, unclear. 4-6: Mostly clear. 7-10: Very clear, crisp articulation.
- **warmth** (0-10): Friendly, approachable vocal quality. 0-3: Cold, distant. 4-6: Neutral. 7-10: Warm, inviting tone.

**PRESENCE Sub-Metrics:**
- **eye_contact** (0-10): Consistent, natural eye contact with camera/audience. 0-3: Avoiding eye contact, looking away. 4-6: Some eye contact. 7-10: Strong, consistent eye contact.
- **facial_relaxation** (0-10): Relaxed, natural facial expressions. 0-3: Tense, strained. 4-6: Some tension. 7-10: Relaxed, natural.
- **body_posture** (0-10): Upright, confident posture. 0-3: Slouched, closed. 4-6: Acceptable. 7-10: Upright, open, confident.
- **hand_naturalness** (0-10): Natural, purposeful gestures. 0-3: Stiff, no gestures, or excessive fidgeting. 4-6: Some gestures. 7-10: Natural, expressive gestures.
- **openness** (0-10): Open body language, approachable. 0-3: Closed, defensive. 4-6: Neutral. 7-10: Open, welcoming.

**CLARITY Sub-Metrics:**
- **structure** (0-10): Clear organization, logical flow. 0-3: Disorganized, confusing. 4-6: Some structure. 7-10: Well-organized, clear flow.
- **focus** (0-10): Stays on topic, clear main points. 0-3: Rambling, off-topic. 4-6: Generally focused. 7-10: Highly focused, clear points.
- **example_usage** (0-10): Effective use of examples/stories. 0-3: No examples, abstract. 4-6: Some examples. 7-10: Rich, relevant examples.
- **transition_quality** (0-10): Smooth transitions between ideas. 0-3: Abrupt, jarring. 4-6: Some transitions. 7-10: Smooth, natural transitions.
- **repetition_control** (0-10): Avoids unnecessary repetition. 0-3: Excessive repetition. 4-6: Some repetition. 7-10: Concise, no unnecessary repetition.

**AUTHENTICITY Sub-Metrics:**
- **naturalness** (0-10): Appears genuine, not forced. 0-3: Forced, unnatural. 4-6: Somewhat natural. 7-10: Very natural, authentic.
- **emotional_transparency** (0-10): Shows appropriate emotions. 0-3: Flat, no emotion. 4-6: Some emotion. 7-10: Genuine, appropriate emotions.
- **forced_expression_reduction** (0-10): Minimal forced or fake expressions. 0-3: Many forced expressions. 4-6: Some forced moments. 7-10: No forced expressions.

**IMPACT Sub-Metrics:**
- **energy** (0-10): Appropriate energy level, engaging. 0-3: Low energy, boring. 4-6: Moderate energy. 7-10: High, appropriate energy.
- **engagement** (0-10): Keeps audience engaged. 0-3: Disengaging. 4-6: Somewhat engaging. 7-10: Highly engaging.
- **persuasiveness** (0-10): Convincing, compelling delivery. 0-3: Not convincing. 4-6: Somewhat persuasive. 7-10: Very persuasive.

**CONFIDENCE Sub-Metrics:**
- **filler_word_control** (0-10): Minimal "um", "uh", "like". 0-3: Many fillers. 4-6: Some fillers. 7-10: Very few fillers.
- **pause_control** (0-10): Effective use of pauses. 0-3: No pauses or awkward pauses. 4-6: Some pauses. 7-10: Well-timed, effective pauses.
- **physical_tension** (0-10): Low physical tension, relaxed. 0-3: Very tense. 4-6: Some tension. 7-10: Relaxed, no tension.
- **vocal_stability** (0-10): Stable voice, no shaking/quivering. 0-3: Shaky, unstable. 4-6: Some instability. 7-10: Very stable.
- **comfort_level** (0-10): Appears comfortable on camera. 0-3: Very uncomfortable. 4-6: Somewhat comfortable. 7-10: Very comfortable.

**CRITICAL SCORING INSTRUCTIONS - BE STRICT AND CONSISTENT:**

1. **Score each sub-metric independently using the definitions above (0-10, use decimals like 7.5)**
   - Watch the video CAREFULLY and observe actual behavior
   - Do NOT give benefit of the doubt - score what you actually see
   - If you see problems, score them LOW (0-4)
   - If you see average performance, score it AVERAGE (4-6)
   - Only give 7+ if you see GENUINELY STRONG performance

2. **BE STRICT - This is critical:**
   - **7-10 (Strong)**: ONLY if the performance is genuinely excellent, professional, engaging, and effective
   - **4-6 (Average)**: If there are noticeable issues, inconsistencies, or room for improvement
   - **0-3 (Weak)**: If there are clear problems, mistakes, or significant issues
   - **DO NOT inflate scores** - be honest and critical
   - **If eye contact is poor** → score eye_contact 0-4
   - **If speech is monotone** → score tone_variation 0-4
   - **If there are many filler words** → score filler_word_control 0-4
   - **If energy is low** → score energy 0-4

3. **CONSISTENCY IS CRITICAL:**
   - The SAME video should receive the SAME scores every time
   - Base your scores ONLY on what you observe in THIS video
   - Do NOT be influenced by previous analyses or assumptions
   - If you analyze the same video twice, scores should be IDENTICAL

4. **Pay attention to DETAILS:**
   - Count actual filler words ("um", "uh", "like") - if many, score LOW
   - Measure actual eye contact percentage - if <50%, score LOW
   - Listen to actual tone variation - if monotone, score LOW
   - Observe actual energy level - if low/boring, score LOW
   - Notice actual mistakes, hesitations, or problems - score them LOW

5. **Focus Areas MUST reflect actual weaknesses:**
   - If you see problems, they MUST appear in Focus Areas
   - If eye contact is poor → MUST be in Focus Areas
   - If speech is monotone → MUST be in Focus Areas
   - If there are many mistakes → MUST be in Focus Areas
   - Do NOT hide problems - be honest and direct

6. Consider the user's context (${goalLabel}) when scoring, but DO NOT use it as an excuse to inflate scores

7. For each sub-score, provide brief evidence/explanation in your analysis - be specific about what you observed

8. Calculate final category scores as weighted averages (weights will be applied by backend)

9. Calculate overall_score: weighted average of final_scores (voice*0.15 + presence*0.15 + clarity*0.15 + authenticity*0.15 + impact*0.20 + confidence*0.20) * 10

10. Determine stage_title based on overall_score:
   - 0-40: "Beginning Communicator"
   - 41-60: "Emerging Communicator"
   - 61-75: "Developing Communicator"
   - 76-85: "Expressive Communicator"
   - 86-95: "Confident Communicator"
   - 96-100: "Master Communicator"

11. If you detect a significant jump from typical scores (>3 points), explain it in validation.jump_explanation

12. Set validation.confidence (0-1) based on how certain you are of the scores

13. Provide 2-3 brief insights for the communication journal

Structure your main response as follows:

**Overall Impression**
(A short emotional summary of how they come across overall)

**Key Strengths**  
2–3 main strengths directly supporting "${goalLabel}".  
Explain *why each matters* in their "${specificContext}" if relevant.
Do NOT use emojis in section headers - use plain text only.

**Focus Areas**    
2–3 areas that need improvement. Be HONEST and DIRECT about actual problems you observed.
- If eye contact is poor → mention it directly
- If speech is monotone → mention it directly  
- If there are many mistakes → mention them directly
- If energy is low → mention it directly
Explain each problem clearly + why improving it will help achieve "${goalLabel}".
Do NOT sugarcoat problems - be honest and constructive.
Do NOT use emojis in section headers - use plain text only.

**Action Plan**  
Start with a brief introduction (1-2 sentences) if helpful, then provide 3–4 personalized, practical steps.

**IMPORTANT:** 
- Each action item MUST start with "Action:" followed by the action title. Only lines starting with "Action:" will be displayed as actionable items with checkboxes.
- Do NOT use emojis in section headers - use plain text only.
- Format each action clearly with "What to do:", "Why it matters:", and "Example:" subsections.

Format:
- Brief intro text (optional, will be displayed as regular text)
- **Action: [Action Title]** (e.g., "Action: The '3-Point Map'")
  - **What to do**: Specific instructions (indented)
  - **Why it matters**: Link to "${goalLabel}"${specificContext ? ` and context` : ''} (indented)
  - **Example**: Specific, real-world situation (indented)

Do NOT use "Action:" for regular descriptive text. Only use it for actual actionable steps that users can check off.

**Quick Wins**  
1–2 simple, immediate actions that make visible impact.
Do NOT use emojis in section headers - use plain text only.


Keep tone: ${confidence === 'very-low' || confidence === 'low' ? 'Gentle, supportive, and empowering' : 'Warm, professional, and actionable'}.  
Speak like a real coach: clear, human, and growth-oriented.

**REMEMBER:**
- Be STRICT with scoring - only give high scores for genuinely strong performance
- Be HONEST about problems - if you see issues, mention them in Focus Areas
- Be CONSISTENT - the same video should get the same scores every time
- Pay attention to DETAILS - count filler words, measure eye contact, observe actual behavior
- Do NOT inflate scores or hide problems - users need honest feedback to improve`;

};


export const analyzeBodyLanguage = async (videoBuffer, mimeType, options = {}) => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error("API key is not available. Please ensure it is properly configured.");
    }
    
    const INLINE_LIMIT_BYTES = 20 * 1024 * 1024; // 20MB
    const modelName = options.model || 'gemini-2.5-pro';
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Build dynamic prompt based on user context
    const userContext = options.userContext || {};
    const PROMPT = buildPrompt(userContext);

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
            return await exec();
          } catch (err) {
            // Fallback to flash after 2 failed attempts on overload
            const canFallback = (options.model ?? modelName) !== 'gemini-2.5-flash';
            if (attempt >= 1 && shouldRetry(err) && canFallback) {
              return await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                  {
                    parts: [
                      // Reuse same uploaded file
                      {
                        fileData: {
                          fileUri: err?.fileUri || undefined, // not available; caller will reupload if needed in subsequent attempt
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
          return await exec();
        } catch (err) {
          const canFallback = (options.model ?? modelName) !== 'gemini-2.5-flash';
          if (attempt >= 1 && shouldRetry(err) && canFallback) {
            return await ai.models.generateContent({
              model: 'gemini-2.5-flash',
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
    
    // Try to extract JSON metrics block
    const jsonMatch = text?.match(/```json\s*([\s\S]*?)\s*```/) || text?.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const jsonContent = jsonMatch[1].trim();
        const parsed = JSON.parse(jsonContent);
        
        // Support both old format (metrics) and new format (sub_scores + final_scores)
        if (parsed.sub_scores && parsed.final_scores) {
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
          // Remove the JSON block from the text response
          parsedText = text.replace(jsonMatch[0], '').trim();
        }
      } catch (e) {
        console.warn('Failed to parse metrics JSON from AI response:', e);
      }
    }
    
    return {
      text: parsedText,
      metrics: metrics
    };
};