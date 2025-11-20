import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeBodyLanguage } from './services/geminiService.js';
import crypto from 'crypto';
import { 
  getOrCreateUser, 
  saveAnalysis, 
  getUserAnalyses, 
  getAnalysisById, 
  canUserUploadAnalysis, 
  markFreeAnalysisUsed, 
  saveOnboardingAnswers, 
  getUserWithOnboarding,
  saveCommunicationMetrics,
  saveCommunicationInsights,
  checkAndUnlockAchievements,
  getUserCommunicationMetrics,
  getUserCommunicationInsights,
  getUserAchievements,
  getUserCommunicationProfile,
  getUserBaseline,
  getAllGlobalStats,
  getUserPreviousMetrics,
  calculateUserBaseline,
  calculateGlobalStats,
  saveActionItems,
  getUserActionItems,
  updateActionItemStatus,
  saveSelfReflection,
  getSelfReflections,
  getReflectionForAnalysis,
  getUserJourneys,
  createUserJourney,
  updateUserJourney,
  getJourneyForUser,
  getDefaultJourneyForUser,
  findAnalysisByVideoHash,
  deleteAnalysisForUser,
  checkPracticeCommitmentStatus,
  getWeeklyPracticeCount
} from './services/supabaseService.js';
import { processAnalysisMetrics, METRICS_PROCESSOR_VERSION } from './services/scoringService.js';
import { uploadVideoToS3, getVideoUrl } from './services/s3Service.js';
import { parseActionItems } from './services/parseActionItems.js';
import { buildAnalysisCacheKey, getCachedAnalysis, setCachedAnalysis } from './services/analysisCache.js';
import { notifyAnalysisGate, notifyJourneyEnrollment, notifyAnalysisStored } from './services/notificationService.js';

const app = express();
const port = process.env.PORT || 5000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
const MAX_VIDEO_SIZE_MB = Number(process.env.MAX_VIDEO_SIZE_MB || 250);
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const MIN_VIDEO_DURATION_SECONDS = Number(process.env.MIN_VIDEO_DURATION_SECONDS || 20);
const MAX_VIDEO_DURATION_SECONDS = Number(process.env.MAX_VIDEO_DURATION_SECONDS || 600);
const METRICS_VERSION = process.env.METRICS_VERSION || 'metrics.v2025.01';

const logAnalysisGate = (reason, details = {}) => {
  const payload = {
    ...details,
    timestamp: new Date().toISOString()
  };
  console.warn(`[ANALYSIS_GATE][${reason}]`, payload);
  notifyAnalysisGate(reason, payload).catch(() => {});
};

// CORS for development: allows the React dev server (port 3000) to call this API.
// Change CLIENT_ORIGIN in .env if your frontend runs elsewhere.
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
}));

// Multer configuration: keep uploaded video in memory (Buffer) instead of writing to disk.
// This is ideal because we immediately forward the data to the Gemini API.
// Note: increase fileSize limit if you need larger uploads.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_SIZE_BYTES,
  },
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Parse JSON body for user context
app.use(express.json());

// Middleware to extract Clerk user ID from header
const getClerkUserId = (req) => {
  // Clerk sends user info in x-clerk-user-id header or we can get it from auth token
  // For now, we'll use a custom header from frontend
  return req.headers['x-clerk-user-id'] || req.headers['authorization']?.split(' ')[1];
};

const roundScore = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Number(value.toFixed(1));
};

const formatISODate = (value) => {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const computeTrendDeltas = (metrics = []) => {
  if (!Array.isArray(metrics) || metrics.length < 2) return null;
  const first = metrics[0];
  const last = metrics[metrics.length - 1];
  const categories = [
    { key: 'overall', field: 'overall_score' },
    { key: 'presence', field: 'presence' },
    { key: 'voice', field: 'voice_expression' },
    { key: 'clarity', field: 'clarity' },
    { key: 'impact', field: 'impact' },
    { key: 'confidence', field: 'confidence' }
  ];
  const deltas = {};
  categories.forEach(({ key, field }) => {
    const start = typeof first?.[field] === 'number' ? first[field] : null;
    const end = typeof last?.[field] === 'number' ? last[field] : null;
    if (start === null || end === null) {
      return;
    }
    const change = roundScore(end - start);
    if (change && Math.abs(change) >= 0.1) {
      deltas[key] = change;
    }
  });
  return Object.keys(deltas).length ? deltas : null;
};

const CORE_METRIC_KEYS = ['presence', 'voice_expression', 'clarity', 'authenticity', 'impact', 'confidence'];

const determineWeakestMetricKey = (metricPayload = {}) => {
  const values = CORE_METRIC_KEYS
    .map((key) => {
      const value = parseFloat(metricPayload[key]);
      return { key, value };
    })
    .filter((entry) => Number.isFinite(entry.value));

  if (!values.length) {
    return 'overall';
  }

  values.sort((a, b) => a.value - b.value);
  return values[0].key;
};

const extractBaselineSummary = (baseline) => {
  if (!baseline) return null;
  if (baseline.baselines_json && Object.keys(baseline.baselines_json).length > 0) {
    const json = baseline.baselines_json;
    const candidate = json.categoryScores || json.category_scores || json;
    const summary = {};
    ['overall', 'presence', 'voice', 'clarity', 'authenticity', 'impact', 'confidence'].forEach((key) => {
      const value = typeof candidate[key] === 'number' ? candidate[key] :
        typeof candidate[`${key}_score`] === 'number' ? candidate[`${key}_score`] : null;
      if (typeof value === 'number') {
        summary[key] = roundScore(value);
      }
    });
    if (Object.keys(summary).length) {
      return summary;
    }
  }

  const categoryFields = {
    voice: [
      'voice_volume_stability_baseline',
      'voice_tone_variation_baseline',
      'voice_pace_control_baseline',
      'voice_articulation_baseline',
      'voice_warmth_baseline'
    ],
    presence: [
      'presence_eye_contact_baseline',
      'presence_facial_relaxation_baseline',
      'presence_body_posture_baseline',
      'presence_hand_naturalness_baseline',
      'presence_openness_baseline'
    ],
    clarity: [
      'clarity_structure_baseline',
      'clarity_focus_baseline',
      'clarity_example_usage_baseline',
      'clarity_transition_quality_baseline',
      'clarity_repetition_control_baseline'
    ],
    authenticity: [
      'authenticity_naturalness_baseline',
      'authenticity_emotional_transparency_baseline',
      'authenticity_forced_expression_reduction_baseline'
    ],
    impact: [
      'impact_energy_baseline',
      'impact_engagement_baseline',
      'impact_persuasiveness_baseline'
    ],
    confidence: [
      'confidence_filler_word_control_baseline',
      'confidence_pause_control_baseline',
      'confidence_physical_tension_baseline',
      'confidence_vocal_stability_baseline',
      'confidence_comfort_level_baseline'
    ]
  };

  const summary = {};
  Object.entries(categoryFields).forEach(([category, fields]) => {
    const values = fields
      .map((field) => (typeof baseline[field] === 'number' ? baseline[field] : null))
      .filter((value) => value !== null);
    if (values.length) {
      summary[category] = roundScore(values.reduce((acc, value) => acc + value, 0) / values.length);
    }
  });

  return Object.keys(summary).length ? summary : null;
};

const summarizeActionItems = (items = [], limit = 3) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const pending = items.filter((item) => item.status === 'pending');
  const sourceList = pending.length > 0 ? pending : items;
  const sorted = [...sourceList].sort((a, b) => {
    const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
    const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
    return bTime - aTime;
  });

  const summary = sorted.slice(0, limit).map((item) => ({
    title: item.title,
    status: item.status,
    createdAt: formatISODate(item.created_at),
    practicePromptTitle: item.practice_prompt_title || null,
    targetMetric: item.practice_prompt_target_metric || null
  }));

  return summary.length ? summary : null;
};

const buildHistoricalContextPayload = (previousMetrics = [], baseline = null, actionItems = []) => {
  const context = {};

  if (Array.isArray(previousMetrics) && previousMetrics.length) {
    context.recentAnalyses = previousMetrics.slice(-3).map((metric) => ({
      date: formatISODate(metric?.analyses?.created_at || metric?.created_at),
      overallScore: roundScore(metric?.overall_score),
      presence: roundScore(metric?.presence),
      voice: roundScore(metric?.voice_expression),
      clarity: roundScore(metric?.clarity),
      impact: roundScore(metric?.impact),
      confidence: roundScore(metric?.confidence)
    }));

    const trends = computeTrendDeltas(previousMetrics);
    if (trends) {
      context.trends = trends;
    }
  }

  const baselineSummary = extractBaselineSummary(baseline);
  if (baselineSummary) {
    context.baseline = baselineSummary;
  }

  const actionSummary = summarizeActionItems(actionItems);
  if (actionSummary) {
    context.recentActionItems = actionSummary;
  }

  return Object.keys(context).length ? context : null;
};

// Analyze video endpoint
// Expects a multipart/form-data request with a single file under field name "video".
// Also accepts userContext in the request header and Clerk user ID
app.post('/api/analyze-video', upload.single('video'), async (req, res) => {
  try {
    if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'API key is missing on the server' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

  const fileSizeBytes = req.file.size || 0;
  if (fileSizeBytes > MAX_VIDEO_SIZE_BYTES) {
    logAnalysisGate('video_too_large', {
      clerkUserId: req.headers['x-clerk-user-id'] || null,
      sizeMB: Number((fileSizeBytes / 1024 / 1024).toFixed(2)),
      limitMB: MAX_VIDEO_SIZE_MB
    });
    return res.status(400).json({
      error: `Video is too large. Please keep uploads under ${MAX_VIDEO_SIZE_MB}MB.`,
      reason: 'video_too_large'
    });
  }
    
    const videoBuffer = req.file.buffer; // Node.js Buffer holding the video bytes
    const mimeType = req.file.mimetype;  // e.g., 'video/mp4'
    const clerkUserId = getClerkUserId(req);
  const durationSeconds = parseNumber(req.body?.video_duration_seconds ?? req.body?.videoDurationSeconds);
  const videoWidth = parseNumber(req.body?.video_width ?? req.body?.videoWidth);
  const videoHeight = parseNumber(req.body?.video_height ?? req.body?.videoHeight);

  if (!durationSeconds || durationSeconds <= 0) {
    logAnalysisGate('missing_duration_meta', {
      clerkUserId,
      provided: req.body?.video_duration_seconds ?? req.body?.videoDurationSeconds
    });
    return res.status(400).json({
      error: 'We could not read your video duration. Please re-upload the clip using the latest app.',
      reason: 'invalid_duration_metadata'
    });
  }

  if (durationSeconds < MIN_VIDEO_DURATION_SECONDS) {
    logAnalysisGate('video_too_short', {
      clerkUserId,
      durationSeconds,
      minSeconds: MIN_VIDEO_DURATION_SECONDS
    });
    return res.status(400).json({
      error: `Video is too short. Record at least ${MIN_VIDEO_DURATION_SECONDS} seconds to capture usable signal.`,
      reason: 'video_too_short'
    });
  }

  if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    logAnalysisGate('video_too_long', {
      clerkUserId,
      durationSeconds,
      maxSeconds: MAX_VIDEO_DURATION_SECONDS
    });
    return res.status(400).json({
      error: `Video is too long. Keep practice reps under ${MAX_VIDEO_DURATION_SECONDS / 60} minutes.`,
      reason: 'video_too_long'
    });
  }

    // Check if user can upload analysis (subscription limits)
    if (clerkUserId) {
      const canUpload = await canUserUploadAnalysis(clerkUserId);
      if (!canUpload.allowed) {
        logAnalysisGate('subscription_blocked', {
          clerkUserId,
          reason: canUpload.reason
        });
        return res.status(403).json({ 
          error: canUpload.message || 'Upload not allowed',
          reason: canUpload.reason,
          requiresUpgrade: canUpload.reason === 'free_limit_reached' || canUpload.reason === 'monthly_limit_reached'
        });
      }
    }

    // Parse user context from request header
    let userContext = {};
    if (req.headers['x-user-context']) {
      try {
        userContext = JSON.parse(req.headers['x-user-context']);
      } catch (e) {
        console.warn('Failed to parse userContext from header:', e);
      }
    }

    let journeyId = req.body?.journey_id || req.body?.journeyId || null;
    if (clerkUserId) {
      if (journeyId) {
        const journey = await getJourneyForUser(clerkUserId, journeyId);
        if (!journey) {
          return res.status(404).json({ error: 'Journey not found' });
        }
      } else {
        const defaultJourney = await getDefaultJourneyForUser(clerkUserId);
        journeyId = defaultJourney?.id || null;
      }
    }

    const recordingPromptMeta = {
      id: req.body?.recording_prompt_id || null,
      title: req.body?.recording_prompt_title || null,
      description: req.body?.recording_prompt_description || null,
      actionItemId: req.body?.recording_prompt_action_item_id || null,
      targetMetric: req.body?.recording_prompt_target_metric || null,
      source: req.body?.recording_prompt_source || null,
      setup: req.body?.recording_prompt_setup || null,
      notice: req.body?.recording_prompt_notice || null,
      tip: req.body?.recording_prompt_tip || null,
      difficulty: req.body?.recording_prompt_difficulty || null,
      estimatedTime: req.body?.recording_prompt_time || null,
      version: req.body?.recording_prompt_version || null
    };
    const hasRecordingPrompt = Object.values(recordingPromptMeta).some(value => value);
    const recordingPromptPayload = hasRecordingPrompt ? recordingPromptMeta : null;
    const completedPracticePrompts = [];
    if (recordingPromptPayload) {
      userContext.recordingPrompt = recordingPromptPayload;
    }

    const videoHash = crypto.createHash('sha256').update(videoBuffer).digest('hex');
    const contextHashSource = JSON.stringify({
      primaryGoal: userContext.primaryGoal || null,
      confidenceLevel: userContext.confidenceLevel || null,
      recordingPromptId: userContext.recordingPrompt?.actionItemId || userContext.recordingPrompt?.id || null
    });
    const contextHash = crypto.createHash('sha1').update(contextHashSource).digest('hex');
    const cacheKey = buildAnalysisCacheKey({ videoHash, contextHash });
    const normalizedVideoMeta = {
      durationSeconds,
      width: videoWidth ? Math.round(videoWidth) : null,
      height: videoHeight ? Math.round(videoHeight) : null
    };

    if (clerkUserId) {
      try {
        const duplicateAnalysis = await findAnalysisByVideoHash(clerkUserId, videoHash);
        if (duplicateAnalysis) {
          logAnalysisGate('duplicate_video', {
            clerkUserId,
            analysisId: duplicateAnalysis.id,
            videoHash
          });
          return res.status(409).json({
            error: 'Looks like this exact clip was already analyzed. Record a fresh take to unlock new insights.',
            reason: 'duplicate_video',
            analysisId: duplicateAnalysis.id
          });
        }
      } catch (dupError) {
        console.warn('Duplicate hash check failed, continuing:', dupError);
      }
    }

    // Get or create user first (required for saving analysis)
    let userId = null;
    let s3Key = null;
    
    if (clerkUserId) {
      try {
        userId = await getOrCreateUser(clerkUserId);
        console.log(`User ID retrieved: ${userId}`);
        
        // Ensure filename is properly encoded as UTF-8
        let filename = req.file.originalname;
        try {
          const decoded = Buffer.from(filename, 'latin1').toString('utf8');
          if (decoded !== filename && /[\u0080-\uFFFF]/.test(decoded)) {
            filename = decoded;
          }
        } catch (e) {
          console.warn('Filename encoding issue, using original:', e);
        }

        // Upload to S3 (optional - continue even if it fails)
        if (process.env.AWS_S3_BUCKET_NAME) {
          console.log('S3 configuration found, attempting to upload video...');
          console.log('S3 Config:', {
            bucket: process.env.AWS_S3_BUCKET_NAME,
            region: process.env.AWS_REGION || 'us-east-1',
            hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
          });
          try {
            const s3Result = await uploadVideoToS3(
              videoBuffer,
              filename,
              mimeType,
              userId
            );
            s3Key = s3Result.key;
            console.log(`✅ Video uploaded to S3 successfully: ${s3Key}`);
          } catch (s3Error) {
            console.error('❌ Failed to upload video to S3 (continuing anyway):', s3Error.message);
            console.error('S3 Error details:', {
              message: s3Error.message,
              code: s3Error.code,
              name: s3Error.name
            });
            // Continue with analysis even if S3 upload fails
          }
        } else {
          console.warn('⚠️  S3 not configured: AWS_S3_BUCKET_NAME is not set in .env file');
          console.warn('   Videos will not be stored in S3. Add AWS_S3_BUCKET_NAME to .env to enable S3 storage.');
        }
      } catch (userError) {
        console.error('Failed to get/create user:', userError);
        // If we can't get user ID, we can't save to database, but we can still return analysis
      }
    } else {
      console.warn('No Clerk user ID provided - analysis will not be saved to database');
    }

    // Build historical context for Gemini (if authenticated)
    let historicalContext = null;
    if (clerkUserId && userId) {
      try {
        const [previousMetrics, userBaseline, recentActionItems] = await Promise.all([
          getUserPreviousMetrics(clerkUserId, 3),
          getUserBaseline(clerkUserId),
          getUserActionItems(clerkUserId, null, journeyId)
        ]);
        historicalContext = buildHistoricalContextPayload(previousMetrics, userBaseline, recentActionItems);
      } catch (historyError) {
        console.warn('Failed to build historical context:', historyError.message || historyError);
      }
    }
    if (historicalContext) {
      userContext.historicalContext = historicalContext;
    }

    // Call Gemini service with video buffer + MIME type + user context
    // Returns { text, metrics } where text is markdown and metrics contains structured data
    let analysisResult = getCachedAnalysis(cacheKey);
    if (!analysisResult) {
      analysisResult = await analyzeBodyLanguage(videoBuffer, mimeType, { 
        userContext,
        model: GEMINI_MODEL,
        generationConfig: {
          temperature: 0.15,
          topP: 0.2,
          topK: 16,
          candidateCount: 1
        }
      });
      setCachedAnalysis(cacheKey, analysisResult, 1000 * 60 * 60 * 12); // 12 hours
    } else {
      console.log(`Reused cached Gemini result for ${cacheKey}`);
    }
    const resultMarkdown = analysisResult.text || analysisResult; // Support both old and new format
    const metrics = analysisResult.metrics || null;
    
    // Save to database if Supabase is configured and user is authenticated
    let analysisId = null;
    let unlockedAchievements = [];
    if (clerkUserId && userId) {
      try {
        // Ensure filename is properly encoded as UTF-8
        let filename = req.file.originalname;
        try {
          const decoded = Buffer.from(filename, 'latin1').toString('utf8');
          if (decoded !== filename && /[\u0080-\uFFFF]/.test(decoded)) {
            filename = decoded;
          }
        } catch (e) {
          console.warn('Filename encoding issue, using original:', e);
        }
        
        console.log(`Attempting to save analysis for user ${userId}...`);
        console.log('S3 Key to save:', s3Key || 'NULL (S3 not configured or upload failed)');
        const saved = await saveAnalysis(userId, {
          videoFilename: filename,
          videoSize: req.file.size,
          mimeType: mimeType,
          s3Key: s3Key, // Store S3 key in database (can be null if S3 not configured)
          userContext: userContext,
          analysisResult: resultMarkdown,
          videoHash,
          videoDurationSeconds: normalizedVideoMeta.durationSeconds,
          videoWidth: normalizedVideoMeta.width,
          videoHeight: normalizedVideoMeta.height,
          aiModelVersion: analysisResult.modelVersion || GEMINI_MODEL,
          metricsVersion: analysisResult.metricsVersion || METRICS_VERSION,
          rawMetrics: analysisResult.rawMetrics || null,
          recordingPrompt: recordingPromptPayload,
          journeyId: journeyId
        });
        
        if (saved && saved.s3_key) {
          console.log(`✅ Analysis saved with S3 key: ${saved.s3_key}`);
        } else if (saved && !saved.s3_key) {
          console.warn(`⚠️  Analysis saved but s3_key is NULL. S3 may not be configured or upload failed.`);
        }
        
        if (saved) {
          analysisId = saved.id;
          console.log(`Analysis saved successfully with ID: ${analysisId}`);
          notifyAnalysisStored({
            clerkUserId,
            analysisId,
            metricsVersion: analysisResult.metricsVersion || METRICS_VERSION,
            aiModelVersion: analysisResult.modelVersion || GEMINI_MODEL
          }).catch(() => {});
          
          // Process and save communication metrics if available
          if (metrics) {
            try {
              // Get user's primary goal for scoring weights
              const userData = await getUserWithOnboarding(clerkUserId);
              const userGoal = userData?.primary_goal || 'general';
              
              // Get baseline, global stats, and previous metrics for processing
              const [userBaseline, globalStatsMap, previousMetrics] = await Promise.all([
                getUserBaseline(clerkUserId),
                getAllGlobalStats(),
                getUserPreviousMetrics(clerkUserId, 3)
              ]);
              
              // Process metrics with new scoring system
              let processedMetrics = null;
              if (metrics.subScores) {
                // New format with sub-scores - process them
                try {
                  processedMetrics = processAnalysisMetrics({
                    rawSubScores: metrics.subScores,
                    userBaseline: userBaseline,
                    globalStatsMap: globalStatsMap,
                    previousMetrics: previousMetrics,
                    userGoal: userGoal
                  });
                  
                  console.log('Metrics processed with new scoring system');
                } catch (processError) {
                  console.error('Error processing metrics:', processError);
                  // Fall back to using LLM's final scores directly
                  processedMetrics = null;
                }
              }

              if (journeyId) {
                updateUserJourney(clerkUserId, journeyId, { lastActiveAt: new Date().toISOString() })
                  .catch(err => console.error('Failed to update journey activity timestamp:', err));
              }
              
              const modelVersion = analysisResult.modelVersion || GEMINI_MODEL;
              const processorVersion = processedMetrics?.processingVersion || METRICS_PROCESSOR_VERSION;
              
              // Prepare metrics for saving
              const metricsToSave = processedMetrics ? {
                // Use processed scores
                presence: processedMetrics.categoryScores.presence,
                voice_expression: processedMetrics.categoryScores.voice,
                clarity: processedMetrics.categoryScores.clarity,
                authenticity: processedMetrics.categoryScores.authenticity,
                impact: processedMetrics.categoryScores.impact,
                confidence: processedMetrics.categoryScores.confidence,
                overall_score: processedMetrics.overallScore,
                stage_title: processedMetrics.stageTitle,
                subScores: processedMetrics.subScores,
                subScoreEvidence: metrics.validation || {},
                validationMetadata: processedMetrics.validationResults || {},
                delivery: metrics.delivery || null,
                modelVersion,
                processorVersion
              } : {
                // Fall back to LLM's scores (backward compatibility)
                presence: metrics.presence,
                voice_expression: metrics.voice_expression,
                clarity: metrics.clarity,
                authenticity: metrics.authenticity,
                impact: metrics.impact,
                confidence: metrics.confidence,
                overall_score: metrics.overall_score,
                stage_title: metrics.stage_title,
                subScores: metrics.subScores || null,
                subScoreEvidence: metrics.validation || null,
                validationMetadata: null,
                delivery: metrics.delivery || null,
                modelVersion,
                processorVersion: METRICS_PROCESSOR_VERSION
              };
              const focusMetricKey = determineWeakestMetricKey(metricsToSave);
              
              // Save metrics
              await saveCommunicationMetrics(userId, analysisId, metricsToSave, journeyId);
              console.log('Communication metrics saved');
              
              // Save insights
              if (metrics.insights && metrics.insights.length > 0) {
                await saveCommunicationInsights(userId, analysisId, metrics.insights, journeyId);
                console.log('Communication insights saved');
              }
              
              // Parse and save action items from analysis result
              if (resultMarkdown) {
                try {
                  const actionItems = parseActionItems(resultMarkdown);
                  console.log(`Parsed ${actionItems.length} action items from analysis`);
                  if (actionItems.length > 0) {
                    console.log('Action items found:', actionItems.map(a => a.title));
                    const savedActionItems = await saveActionItems(userId, analysisId, actionItems, { 
                      userContext, 
                      journeyId,
                      maxActionItems: 1,
                      generatePracticePrompts: true,
                      focusMetricKey
                    });
                    console.log(`Saved ${savedActionItems.length} action items to database`);
                    if (savedActionItems.length === 0 && actionItems.length > 0) {
                      console.warn('No action items were saved - possible duplicates or errors');
                    }
                  } else {
                    console.log('No action items found in analysis result');
                  }
                } catch (actionItemsError) {
                  console.error('Error saving action items:', actionItemsError);
                  console.error('Error stack:', actionItemsError.stack);
                  // Don't fail the request if action items save fails
                }
              } else {
                console.log('No resultMarkdown available to parse action items from');
              }
              
              // Check and unlock achievements (use final scores for achievements)
              const achievementMetrics = {
                presence: metricsToSave.presence,
                voice_expression: metricsToSave.voice_expression,
                clarity: metricsToSave.clarity,
                authenticity: metricsToSave.authenticity,
                impact: metricsToSave.impact,
                confidence: metricsToSave.confidence,
                overall_score: metricsToSave.overall_score
              };
              unlockedAchievements = await checkAndUnlockAchievements(userId, achievementMetrics);
              if (unlockedAchievements.length > 0) {
                console.log(`Unlocked ${unlockedAchievements.length} achievements`);
              }

              if (
                recordingPromptPayload?.actionItemId &&
                metrics.prompt_focus?.prompt_id &&
                typeof metrics.prompt_focus.score === 'number'
              ) {
                const promptId = `${metrics.prompt_focus.prompt_id}`;
                const targetActionId = `${recordingPromptPayload.actionItemId}`;
                if (promptId === targetActionId) {
                const practiceScore = metrics.prompt_focus.score;
                if (practiceScore >= 7) {
                  try {
                    await updateActionItemStatus(clerkUserId, recordingPromptPayload.actionItemId, 'completed');
                    console.log(`Action item ${recordingPromptPayload.actionItemId} completed via prompt focus score (${practiceScore})`);
                    completedPracticePrompts.push({
                      actionItemId: recordingPromptPayload.actionItemId,
                      title: recordingPromptPayload.title,
                      score: practiceScore
                    });
                  } catch (completionErr) {
                    console.error('Failed to update action item status after prompt evaluation:', completionErr);
                  }
                  } else {
                    console.log(`Practice prompt score below completion threshold (${practiceScore}) for action item ${recordingPromptPayload.actionItemId}`);
                  }
                }
              }
              
              // Update baseline (async, don't wait)
              calculateUserBaseline(clerkUserId, 2).then(() => {
                console.log('User baseline updated');
              }).catch(err => {
                console.error('Failed to update baseline:', err);
              });
              
              // Trigger global stats calculation (async, don't wait - runs in background)
              // Only run if we have enough data (e.g., every 10th analysis)
              // For now, we'll run it less frequently to avoid performance issues
              if (Math.random() < 0.1) { // 10% chance to recalculate
                calculateGlobalStats().then(() => {
                  console.log('Global stats updated');
                }).catch(err => {
                  console.error('Failed to update global stats:', err);
                });
              }
            } catch (metricsError) {
              console.error('Failed to save metrics/insights:', metricsError);
              // Don't fail the request if metrics save fails
            }
          }
          
          // Mark free analysis as used if this is their first one
          try {
            await markFreeAnalysisUsed(clerkUserId);
            console.log('Free analysis marked as used');
          } catch (markError) {
            console.error('Failed to mark free analysis as used:', markError);
            // Don't fail the request if this fails
          }
        } else {
          console.warn('saveAnalysis returned null - analysis may not have been saved');
        }
      } catch (dbError) {
        console.error('Failed to save analysis to database:', dbError);
        console.error('Error details:', {
          message: dbError.message,
          stack: dbError.stack,
          userId: userId,
          clerkUserId: clerkUserId
        });
        // Don't fail the request if DB save fails - user still gets their analysis
      }
    } else {
      if (!clerkUserId) {
        console.warn('Cannot save analysis: No Clerk user ID provided');
      }
      if (!userId) {
        console.warn('Cannot save analysis: User ID not available');
      }
    }

    return res.json({ 
      result: resultMarkdown,
      analysisId: analysisId, // Return analysis ID for frontend reference
      metrics: metrics, // Return metrics if available
      unlockedAchievements: unlockedAchievements, // Return any newly unlocked achievements
      completedPracticePrompts: completedPracticePrompts
    });
  } catch (err) {
    // Basic error logging
    console.error('Analyze error:', err?.message || err);
    return res.status(500).json({ error: 'Failed to analyze video' });
  }
});

// Get user's analyses
app.get('/api/analyses', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let journeyId = req.query.journeyId || null;
    if (journeyId) {
      const journey = await getJourneyForUser(clerkUserId, journeyId);
      if (!journey) {
        return res.status(404).json({ error: 'Journey not found' });
      }
    }

    const analyses = await getUserAnalyses(clerkUserId, 50, journeyId);
    return res.json({ analyses });
  } catch (err) {
    console.error('Error fetching analyses:', err);
    return res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// Get practice commitment status
app.get('/api/practice-commitment/status', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const journeyId = req.query.journeyId || null;
    const status = await checkPracticeCommitmentStatus(clerkUserId, journeyId);
    return res.json(status);
  } catch (err) {
    console.error('Error checking practice commitment status:', err);
    return res.status(500).json({ error: 'Failed to check practice commitment status' });
  }
});

app.delete('/api/analyses/:id', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const analysisId = req.params.id;
    const deleted = await deleteAnalysisForUser(clerkUserId, analysisId);
    if (!deleted) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting analysis:', err);
    return res.status(500).json({ error: 'Failed to delete analysis' });
  }
});

// Get single analysis by ID
app.get('/api/analyses/:id', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const analysis = await getAnalysisById(req.params.id, clerkUserId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Generate pre-signed URL for video if S3 key exists
    let videoUrl = null;
    if (analysis.s3_key) {
      try {
        videoUrl = await getVideoUrl(analysis.s3_key, 3600); // 1 hour expiry
      } catch (s3Error) {
        console.error('Failed to generate video URL:', s3Error);
      }
    }

    return res.json({ 
      analysis: {
        ...analysis,
        video_url: videoUrl // Add pre-signed URL to response
      }
    });
  } catch (err) {
    console.error('Error fetching analysis:', err);
    return res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Get pre-signed URL for video
app.get('/api/analyses/:id/video-url', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const analysis = await getAnalysisById(req.params.id, clerkUserId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    if (!analysis.s3_key) {
      return res.status(404).json({ error: 'Video not found in storage' });
    }

    // Generate pre-signed URL (expires in 1 hour by default, or custom expiry)
    const expiresIn = parseInt(req.query.expiresIn) || 3600;
    const videoUrl = await getVideoUrl(analysis.s3_key, expiresIn);

    if (!videoUrl) {
      return res.status(500).json({ error: 'Failed to generate video URL' });
    }

    return res.json({ video_url: videoUrl });
  } catch (err) {
    console.error('Error generating video URL:', err);
    return res.status(500).json({ error: 'Failed to generate video URL' });
  }
});

// Save onboarding answers
app.post('/api/user/onboarding', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await saveOnboardingAnswers(clerkUserId, req.body || {});
    
    return res.json({ success: true });
  } catch (err) {
    console.error('Error saving onboarding:', err);
    return res.status(500).json({ error: 'Failed to save onboarding answers' });
  }
});

// Journeys CRUD
app.get('/api/journeys', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const journeys = await getUserJourneys(clerkUserId);
    return res.json({ journeys });
  } catch (err) {
    console.error('Error fetching journeys:', err);
    return res.status(500).json({ error: 'Failed to fetch journeys' });
  }
});

app.post('/api/journeys', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      primaryGoal,
      confidenceLevel,
      goalSpecificContext,
      displayName,
      setDefault = true,
      templateId,
      difficultyBaseline,
      commitmentLevel,
      practiceCommitment,
      consentVersion,
      consentAcceptedAt
    } = req.body || {};

    if (!primaryGoal) {
      return res.status(400).json({ error: 'primaryGoal is required' });
    }

    const journey = await createUserJourney(clerkUserId, {
      primaryGoal,
      confidenceLevel,
      goalSpecificContext,
      displayName,
      templateId,
      difficultyBaseline,
      commitmentLevel,
      practiceCommitment,
      consentVersion,
      consentAcceptedAt,
      isDefault: setDefault,
      startedFrom: 'dashboard'
    });

    notifyJourneyEnrollment({
      clerkUserId,
      journey,
      templateId
    }).catch(() => {});

    return res.json({ journey });
  } catch (err) {
    console.error('Error creating journey:', err);
    return res.status(500).json({ error: 'Failed to create journey' });
  }
});

app.patch('/api/journeys/:id', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const journeyId = req.params.id;
    const updates = {};
    if (req.body?.displayName !== undefined) {
      updates.displayName = req.body.displayName;
    }
    if (req.body?.status) {
      updates.status = req.body.status;
    }
    if (req.body?.isDefault !== undefined) {
      updates.is_default = req.body.isDefault;
    }
    if (req.body?.primaryGoal) {
      updates.primaryGoal = req.body.primaryGoal;
    }
    if (req.body?.confidenceLevel) {
      updates.confidenceLevel = req.body.confidenceLevel;
    }
    if (req.body?.goalSpecificContext) {
      updates.goalSpecificContext = req.body.goalSpecificContext;
    }
  if (req.body?.templateId) {
    updates.templateId = req.body.templateId;
  }
  if (req.body?.difficultyBaseline) {
    updates.difficultyBaseline = req.body.difficultyBaseline;
  }
  if (req.body?.commitmentLevel) {
    updates.commitmentLevel = req.body.commitmentLevel;
  }
  if (req.body?.practiceCommitment) {
    updates.practiceCommitment = req.body.practiceCommitment;
  }
  if (req.body?.consentVersion) {
    updates.consentVersion = req.body.consentVersion;
  }
  if (req.body?.consentAcceptedAt) {
    updates.consentAcceptedAt = req.body.consentAcceptedAt;
  }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const journey = await updateUserJourney(clerkUserId, journeyId, updates);

    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    return res.json({ journey });
  } catch (err) {
    console.error('Error updating journey:', err);
    return res.status(500).json({ error: 'Failed to update journey' });
  }
});

// Get user profile with onboarding data
app.get('/api/user/profile', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Try to get user, create if doesn't exist (first login)
    let userData = await getUserWithOnboarding(clerkUserId);
    
    if (!userData) {
      // User doesn't exist yet - create them (first login)
      try {
        const userId = await getOrCreateUser(clerkUserId);
        // Fetch the newly created user
        userData = await getUserWithOnboarding(clerkUserId);
      } catch (createError) {
        console.error('Error creating user:', createError);
        return res.status(500).json({ error: 'Failed to create user' });
      }
    }

    // If still no user data, return error
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: userData });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get communication progress data for dashboard
app.get('/api/communication/progress', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let journeyId = req.query.journeyId || null;
    if (journeyId) {
      const journey = await getJourneyForUser(clerkUserId, journeyId);
      if (!journey) {
        return res.status(404).json({ error: 'Journey not found' });
      }
    }

    const [profile, metrics, insights, achievements, actionItems] = await Promise.all([
      getUserCommunicationProfile(clerkUserId, journeyId),
      getUserCommunicationMetrics(clerkUserId, 20, journeyId),
      getUserCommunicationInsights(clerkUserId, 50, journeyId),
      getUserAchievements(clerkUserId),
      getUserActionItems(clerkUserId, 'pending', journeyId) // Get pending action items for To-Do List
    ]);

    return res.json({
      profile,
      metrics,
      insights,
      achievements,
      actionItems
    });
  } catch (err) {
    console.error('Error fetching communication progress:', err);
    return res.status(500).json({ error: 'Failed to fetch communication progress' });
  }
});

// Get communication metrics only (for charts)
app.get('/api/communication/metrics', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limit = parseInt(req.query.limit) || 20;
    let journeyId = req.query.journeyId || null;
    if (journeyId) {
      const journey = await getJourneyForUser(clerkUserId, journeyId);
      if (!journey) {
        return res.status(404).json({ error: 'Journey not found' });
      }
    }
    const metrics = await getUserCommunicationMetrics(clerkUserId, limit, journeyId);
    return res.json({ metrics });
  } catch (err) {
    console.error('Error fetching communication metrics:', err);
    return res.status(500).json({ error: 'Failed to fetch communication metrics' });
  }
});

// Get communication insights (journal)
app.get('/api/communication/insights', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limit = parseInt(req.query.limit) || 50;
    let journeyId = req.query.journeyId || null;
    if (journeyId) {
      const journey = await getJourneyForUser(clerkUserId, journeyId);
      if (!journey) {
        return res.status(404).json({ error: 'Journey not found' });
      }
    }
    const insights = await getUserCommunicationInsights(clerkUserId, limit, journeyId);
    return res.json({ insights });
  } catch (err) {
    console.error('Error fetching communication insights:', err);
    return res.status(500).json({ error: 'Failed to fetch communication insights' });
  }
});

// Get action items (To-Do List)
app.get('/api/action-items', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const status = req.query.status || null; // 'pending' or 'completed' or null for all
    let journeyId = req.query.journeyId || null;
    if (journeyId) {
      const journey = await getJourneyForUser(clerkUserId, journeyId);
      if (!journey) {
        return res.status(404).json({ error: 'Journey not found' });
      }
    }
    const actionItems = await getUserActionItems(clerkUserId, status, journeyId);
    return res.json({ actionItems });
  } catch (err) {
    console.error('Error fetching action items:', err);
    return res.status(500).json({ error: 'Failed to fetch action items' });
  }
});

// Update action item status
app.patch('/api/action-items/:id/status', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "pending" or "completed"' });
    }

    const updated = await updateActionItemStatus(clerkUserId, id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Action item not found' });
    }

    return res.json({ actionItem: updated });
  } catch (err) {
    console.error('Error updating action item status:', err);
    return res.status(500).json({ error: 'Failed to update action item status' });
  }
});

app.post('/api/reflections', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { confidenceRating, mood, notes, analysisId, journeyId } = req.body || {};
    if (!confidenceRating || Number.isNaN(Number(confidenceRating))) {
      return res.status(400).json({ error: 'confidenceRating (1-5) is required' });
    }

    const payload = await saveSelfReflection(clerkUserId, {
      confidenceRating: Math.max(1, Math.min(5, Number(confidenceRating))),
      mood,
      notes,
      analysisId,
      journeyId
    });

    if (!payload) {
      return res.status(500).json({ error: 'Failed to save reflection' });
    }

    return res.json({ reflection: payload });
  } catch (err) {
    console.error('Error saving reflection:', err);
    return res.status(500).json({ error: 'Failed to save reflection' });
  }
});

app.get('/api/reflections', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { analysisId } = req.query;
    const journeyId = req.query.journeyId || null;
    const limit = parseInt(req.query.limit) || 20;

    if (analysisId) {
      const reflection = await getReflectionForAnalysis(clerkUserId, analysisId);
      return res.json({ reflection });
    }

    const reflections = await getSelfReflections(clerkUserId, limit, journeyId);
    return res.json({ reflections });
  } catch (err) {
    console.error('Error fetching reflections:', err);
    return res.status(500).json({ error: 'Failed to fetch reflections' });
  }
});

// Get user achievements
app.get('/api/communication/achievements', async (req, res) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const achievements = await getUserAchievements(clerkUserId);
    return res.json({ achievements });
  } catch (err) {
    console.error('Error fetching achievements:', err);
    return res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Serve React build in production
// In ES modules, __dirname is not available; this reconstructs it safely.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuildPath = path.join(__dirname, 'client', 'build');

// Static hosting of the React build output (only effective after `npm run build` in client)
app.use(express.static(clientBuildPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

