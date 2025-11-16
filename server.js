import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeBodyLanguage } from './services/geminiService.js';
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
  updateActionItemStatus
} from './services/supabaseService.js';
import { processAnalysisMetrics } from './services/scoringService.js';
import { uploadVideoToS3, getVideoUrl } from './services/s3Service.js';
import { parseActionItems } from './services/parseActionItems.js';

const app = express();
const port = process.env.PORT || 5000;

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
    fileSize: 200 * 1024 * 1024, // 200MB max, adjust as needed
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
    
    const videoBuffer = req.file.buffer; // Node.js Buffer holding the video bytes
    const mimeType = req.file.mimetype;  // e.g., 'video/mp4'
    const clerkUserId = getClerkUserId(req);

    // Check if user can upload analysis (subscription limits)
    if (clerkUserId) {
      const canUpload = await canUserUploadAnalysis(clerkUserId);
      if (!canUpload.allowed) {
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
          try {
            const s3Result = await uploadVideoToS3(
              videoBuffer,
              filename,
              mimeType,
              userId
            );
            s3Key = s3Result.key;
            console.log(`Video uploaded to S3: ${s3Key}`);
          } catch (s3Error) {
            console.error('Failed to upload video to S3 (continuing anyway):', s3Error.message);
            // Continue with analysis even if S3 upload fails
          }
        }
      } catch (userError) {
        console.error('Failed to get/create user:', userError);
        // If we can't get user ID, we can't save to database, but we can still return analysis
      }
    } else {
      console.warn('No Clerk user ID provided - analysis will not be saved to database');
    }

    // Call Gemini service with video buffer + MIME type + user context
    // Returns { text, metrics } where text is markdown and metrics contains structured data
    const analysisResult = await analyzeBodyLanguage(videoBuffer, mimeType, { userContext });
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
        const saved = await saveAnalysis(userId, {
          videoFilename: filename,
          videoSize: req.file.size,
          mimeType: mimeType,
          s3Key: s3Key, // Store S3 key in database (can be null if S3 not configured)
          userContext: userContext,
          analysisResult: resultMarkdown
        });
        
        if (saved) {
          analysisId = saved.id;
          console.log(`Analysis saved successfully with ID: ${analysisId}`);
          
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
                validationMetadata: processedMetrics.validationResults || {}
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
                validationMetadata: null
              };
              
              // Save metrics
              await saveCommunicationMetrics(userId, analysisId, metricsToSave);
              console.log('Communication metrics saved');
              
              // Save insights
              if (metrics.insights && metrics.insights.length > 0) {
                await saveCommunicationInsights(userId, analysisId, metrics.insights);
                console.log('Communication insights saved');
              }
              
              // Parse and save action items from analysis result
              if (resultMarkdown) {
                try {
                  const actionItems = parseActionItems(resultMarkdown);
                  console.log(`Parsed ${actionItems.length} action items from analysis`);
                  if (actionItems.length > 0) {
                    console.log('Action items found:', actionItems.map(a => a.title));
                    const savedActionItems = await saveActionItems(userId, analysisId, actionItems);
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
      unlockedAchievements: unlockedAchievements // Return any newly unlocked achievements
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

    const analyses = await getUserAnalyses(clerkUserId);
    return res.json({ analyses });
  } catch (err) {
    console.error('Error fetching analyses:', err);
    return res.status(500).json({ error: 'Failed to fetch analyses' });
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

    const { primaryGoal, confidenceLevel, goalSpecificContext } = req.body;
    await saveOnboardingAnswers(clerkUserId, { 
      primaryGoal, 
      confidenceLevel,
      goalSpecificContext 
    });
    
    return res.json({ success: true });
  } catch (err) {
    console.error('Error saving onboarding:', err);
    return res.status(500).json({ error: 'Failed to save onboarding answers' });
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

    const [profile, metrics, insights, achievements, actionItems] = await Promise.all([
      getUserCommunicationProfile(clerkUserId),
      getUserCommunicationMetrics(clerkUserId, 20),
      getUserCommunicationInsights(clerkUserId, 50),
      getUserAchievements(clerkUserId),
      getUserActionItems(clerkUserId, 'pending') // Get pending action items for To-Do List
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
    const metrics = await getUserCommunicationMetrics(clerkUserId, limit);
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
    const insights = await getUserCommunicationInsights(clerkUserId, limit);
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
    const actionItems = await getUserActionItems(clerkUserId, status);
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

