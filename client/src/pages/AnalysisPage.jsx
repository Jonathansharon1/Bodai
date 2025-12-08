import React, { useState, useEffect, useMemo } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle2, 
  Sparkles,
  Lightbulb,
  Video,
  Sun,
  Timer,
  Eye,
  Trash2,
  Play,
  LayoutDashboard,
  Target
} from 'lucide-react';
import Logo from '../components/Logo';
import UploadVideo from '../components/UploadVideo';
import VideoPlayer from '../components/VideoPlayer';
import AnalysisResult from '../components/AnalysisResult';
import ReflectionPrompt from '../components/ReflectionPrompt';
import LoadingView from '../components/LoadingView';
import FirstUploadGuide from '../components/FirstUploadGuide';
import './AnalysisPage.css';
import { getPromptById } from '../config/recordingPrompts';

// Recording tips metadata (icons + IDs only; text is localized via i18n)
const RECORDING_TIP_DEFS = [
  {
    id: 'framing',
    icon: Video
  },
  {
    id: 'lighting',
    icon: Sun
  },
  {
    id: 'duration',
    icon: Timer
  },
  {
    id: 'eyeline',
    icon: Eye
  }
];

// Helper function to get practice metric labels with translations
const getPracticeMetricLabels = (t) => ({
  presence: t('parameters.metrics.presence'),
  voice_expression: t('parameters.metrics.voice'),
  clarity: t('parameters.metrics.clarity'),
  authenticity: t('parameters.metrics.authenticity'),
  impact: t('parameters.metrics.impact'),
  confidence: t('parameters.metrics.confidence'),
  overall: t('parameters.metrics.overall')
});

const formatMetricLabel = (metric, t) => {
  if (!metric) return null;
  const labels = getPracticeMetricLabels(t);
  return labels[metric] || metric.replace(/_/g, ' ');
};

const renderPromptMeta = (label, value) => {
  if (!value) return null;
  return (
    <div className="analysisPage__promptMeta">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
};

export default function AnalysisPage({ 
  file, 
  onSelect, 
  onRemove, 
  onAnalyze, 
  isLoading, 
  result, 
  viewingAnalysis,
  onBackToDashboard,
  currentAnalysisId,
  userContext,
  activeJourneyId,
  practiceCompletionNotices = [],
  hasCompletedAnalysis = false,
  onDismissPracticeNotices,
  refreshTrigger
}) {
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [videoUrl, setVideoUrl] = useState(null);
  const [loadedAnalysis, setLoadedAnalysis] = useState(null);
  const [recentActionItems, setRecentActionItems] = useState([]);
  const [actionItemsLoading, setActionItemsLoading] = useState(true);
  const [actionItemsError, setActionItemsError] = useState(null);
  const currentAnalysisData = viewingAnalysis || loadedAnalysis;
  const currentPromptDefinition = currentAnalysisData
    ? currentAnalysisData.recording_prompt_title
      ? { title: currentAnalysisData.recording_prompt_title, description: currentAnalysisData.recording_prompt_description }
      : (currentAnalysisData.recording_prompt_id ? getPromptById(currentAnalysisData.recording_prompt_id) : null)
    : null;
  const activeGoal = currentAnalysisData?.user_context?.primaryGoal || userContext?.primaryGoal || 'general';
  const actionPromptOption = useMemo(() => {
    if (currentAnalysisData) return null;
    if (!recentActionItems || recentActionItems.length === 0) return null;
    const pending = recentActionItems.find(item => item.practice_prompt_title && item.status !== 'completed');
    if (!pending) return null;
    return {
      id: pending.practice_prompt_id || `action-${pending.id}`,
      title: pending.practice_prompt_title,
      description: pending.practice_prompt_description,
      setup: pending.practice_prompt_setup,
      whatToNotice: pending.practice_prompt_notice,
      recordingTip: pending.practice_prompt_tip,
      difficulty: pending.practice_prompt_difficulty,
      estimatedTime: pending.practice_prompt_time,
      version: pending.practice_prompt_version,
      source: pending.practice_prompt_source || 'action',
      actionItemId: pending.id,
      targetMetric: pending.practice_prompt_target_metric || null
    };
  }, [recentActionItems, currentAnalysisData]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [practiceAcknowledged, setPracticeAcknowledged] = useState(false);
  const [practiceAckTouched, setPracticeAckTouched] = useState(false);
  const [showFirstUploadGuide, setShowFirstUploadGuide] = useState(() => {
    // Show guide on first visit to /new-analysis if user hasn't completed an analysis
    if (!hasCompletedAnalysis && !id) {
      return !localStorage.getItem('bodai_first_upload_guide_seen');
    }
    return false;
  });

  // --- New Personalization Logic ---
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [streakData, setStreakData] = useState({ count: 0, period: 'day', label: 'Day Streak', progress: 0, target: 0 });
  const [personalizedChecklist, setPersonalizedChecklist] = useState([]);

  const calculateSmartStreak = (analyses, commitment = 'regular') => {
    if (!analyses || !analyses.length) return;

    let streak = 0;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Helper to check if same day
    const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    
    // Helper to get ISO week number
    const getWeek = (d) => {
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };
    
    // Helper to get Year-Week string (e.g., "2023-45")
    const getYearWeek = (d) => `${d.getFullYear()}-${getWeek(d)}`;

    if (commitment === 'intensive') {
      // Daily streak
      let currentCheck = new Date(today);
      
      // Check if today has analysis
      const hasToday = analyses.some(a => isSameDay(new Date(a.created_at), today));
      
      // If NOT today, start check from yesterday
      if (!hasToday) {
         currentCheck.setDate(currentCheck.getDate() - 1);
      }
      
      while (true) {
        const hasAnalysis = analyses.some(a => isSameDay(new Date(a.created_at), currentCheck));
        if (hasAnalysis) {
          streak++;
          currentCheck.setDate(currentCheck.getDate() - 1);
        } else {
            break; 
        }
      }
      setStreakData({ count: streak, period: 'day', label: t('streak.dayStreak') || 'Day Streak', progress: hasToday ? 1 : 0, target: 1 });
    } else {
      // Weekly streak (Casual or Regular)
      const target = commitment === 'regular' ? 3 : 1;
      const analysesByWeek = {};
      
      analyses.forEach(a => {
        const yw = getYearWeek(new Date(a.created_at));
        analysesByWeek[yw] = (analysesByWeek[yw] || 0) + 1;
      });

      let currentWeek = new Date(today);
      const currentYW = getYearWeek(currentWeek);
      const currentCount = analysesByWeek[currentYW] || 0;
      
      // Check previous weeks
      let checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 7); // Start from last week
      
      while (true) {
        const yw = getYearWeek(checkDate);
        if ((analysesByWeek[yw] || 0) >= target) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 7);
        } else {
          break;
        }
      }
      
      // Add current week if target met
      if (currentCount >= target) streak++;
      
      setStreakData({ 
        count: streak, 
        period: 'week', 
        label: t('streak.weekStreak') || 'Week Streak', 
        progress: Math.min(currentCount, target), 
        target 
      });
    }
  };

  const generateChecklist = (analyses) => {
     if (!analyses || analyses.length < 1) {
         setPersonalizedChecklist([
             { id: 'default1', key: 'checklist.default1', text: 'Check your lighting' },
             { id: 'default2', key: 'checklist.default2', text: 'Ensure clear audio' },
             { id: 'default3', key: 'checklist.default3', text: 'Look at the lens' }
         ]);
         return;
     }

     // Calculate average metrics from last 3 analyses
     const recent = analyses.slice(0, 3);
     const metrics = ['presence', 'voice_expression', 'clarity', 'authenticity', 'impact', 'confidence'];
     const averages = metrics.map(m => {
         const sum = recent.reduce((acc, a) => acc + (a.metrics?.[m] || 0), 0);
         return { metric: m, score: sum / recent.length };
     });
     
     // Find 3 weakest
     const weakest = averages.sort((a, b) => a.score - b.score).slice(0, 3);
     
     const checklistMap = {
         presence: t('checklist.presence') || 'Stand tall and fill the frame',
         voice_expression: t('checklist.voice') || 'Vary your tone and pace',
         clarity: t('checklist.clarity') || 'Structure your opening clearly',
         authenticity: t('checklist.authenticity') || 'Be yourself, relax shoulders',
         impact: t('checklist.impact') || 'Focus on your key message',
         confidence: t('checklist.confidence') || 'Maintain steady eye contact'
     };
     
     setPersonalizedChecklist(weakest.map((w, i) => ({
         id: `weak-${i}`,
         text: checklistMap[w.metric] || w.metric,
         metric: w.metric
     })));
  };

  // Recalculate checklist when history or language changes
  useEffect(() => {
    generateChecklist(metricsHistory);
  }, [metricsHistory, t]);

  // Fetch history for personalization
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${apiBase}/api/analyses`, {
          headers: { 'X-Clerk-User-Id': user.id }
        });
        if (res.ok) {
          const data = await res.json();
          const validAnalyses = (data.analyses || [])
            .filter(a => a.status === 'completed')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          setMetricsHistory(validAnalyses.slice(0, 10)); 
          calculateSmartStreak(validAnalyses, userContext?.practiceCommitment);
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    };
    fetchHistory();
  }, [user?.id, apiBase, userContext?.practiceCommitment]);

  useEffect(() => {
    if (currentAnalysisData) return;
    // Don't auto-select - let user choose from action items
    setSelectedPrompt(null);
    setPracticeAcknowledged(true);
    setPracticeAckTouched(false);
  }, [currentAnalysisData]);

  const handleAnalyzeClick = () => {
    // Only require acknowledgment if user selected a prompt
    if (selectedPrompt && !practiceAcknowledged) {
      setPracticeAckTouched(true);
      return;
    }
    onAnalyze({ recordingPrompt: selectedPrompt });
  };

  const handleDismissCompletionNotices = () => {
    if (onDismissPracticeNotices) {
      onDismissPracticeNotices();
    }
  };

  const handleDeleteAnalysis = async (analysisIdToDelete) => {
    if (!analysisIdToDelete || !user?.id) return;
    const confirmed = window.confirm(t('analysisPage.deleteConfirm'));
    if (!confirmed) return;
    try {
      const res = await fetch(`${apiBase}/api/analyses/${analysisIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        if (onBackToDashboard) {
          onBackToDashboard();
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    }
  };

  // Fetch analysis data if viewing by ID from URL
  useEffect(() => {
    if (id && user?.id && !viewingAnalysis && !loadedAnalysis) {
      fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/analyses/${id}`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json'
          }
        }
      )
        .then(res => res.json())
        .then(data => {
          if (data.analysis) {
            setLoadedAnalysis(data.analysis);
          }
        })
        .catch(err => {
          console.error('Failed to fetch analysis:', err);
          navigate('/dashboard');
        });
    }
  }, [id, user, viewingAnalysis, loadedAnalysis, navigate]);

  // Fetch video URL if viewing an existing analysis
  useEffect(() => {
    const analysis = viewingAnalysis || loadedAnalysis;
    if (analysis?.s3_key && user?.id && !videoUrl) {
      fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/analyses/${analysis.id}/video-url`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json'
          }
        }
      )
        .then(res => res.json())
        .then(data => {
          if (data.video_url) {
            setVideoUrl(data.video_url);
          }
        })
        .catch(err => console.error('Failed to fetch video URL:', err));
    } else if (!analysis) {
      setVideoUrl(null);
    }
  }, [viewingAnalysis, loadedAnalysis, user, videoUrl]);

  // Fetch most recent action items for Next Steps panel (only on new analysis view)
  useEffect(() => {
    if (!user?.id) return;
    if (id) return; // Viewing an existing analysis via URL param

    let isMounted = true;
    const controller = new AbortController();
    let timeoutId = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 10; // Max 30 seconds (10 * 3s)

    const fetchActionItems = async () => {
      // Only show loading on first attempt
      if (attempts === 0) {
        setActionItemsLoading(true);
      }
      setActionItemsError(null);
      
      try {
        const params = new URLSearchParams({ status: 'pending' });
        if (activeJourneyId) {
          params.append('journeyId', activeJourneyId);
        }
        const res = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/action-items?${params.toString()}`,
          {
            headers: {
              'X-Clerk-User-Id': user.id,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          }
        );

        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data.actionItems) ? data.actionItems : [];

          const sorted = [...items].sort((a, b) => {
            const dateA = new Date(a?.analyses?.created_at || a?.created_at || 0);
            const dateB = new Date(b?.analyses?.created_at || b?.created_at || 0);
            return dateB - dateA;
          });

          setRecentActionItems(sorted.slice(0, 2));
          
          // Check if we need to poll for practice prompts (if items are pending generation)
          const hasItemsWithoutPrompts = sorted.some(item => 
            !item.practice_prompt_generated && 
            !item.practice_prompt_title && 
            item.status === 'pending'
          );
          
          // If there are items without prompts, schedule next poll
          if (hasItemsWithoutPrompts && attempts < MAX_ATTEMPTS) {
            attempts++;
            timeoutId = setTimeout(fetchActionItems, 3000);
          }
        } else {
          if (attempts === 0) {
            setActionItemsError('Unable to load your latest action items right now.');
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch action items:', error);
          if (isMounted && attempts === 0) {
            setActionItemsError('Unable to load your latest action items right now.');
          }
        }
      } finally {
        if (isMounted && attempts === 0) {
          setActionItemsLoading(false);
        }
      }
    };

    fetchActionItems();

    return () => {
      isMounted = false;
      controller.abort();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user?.id, id, activeJourneyId, refreshTrigger]); // Reduced dependencies to prevent restarts

  const isViewingExisting = Boolean(currentAnalysisData);
  const showNewAnalysisFlow = !isViewingExisting && !isLoading && !result;

  const formatActionDescription = (item) => {
    if (!item) return '';
    if (item.instantTip) return item.instantTip;
    const details = item.details || {};
    const description = details.why_it_matters 
      || details.what_to_do 
      || (Array.isArray(details.all_details) ? details.all_details[0] : '')
      || t('analysisPage.defaultActionTip', 'Keep this cue top of mind for your next recording.');

    return description; // Show full text, no truncation
  };

  const latestAnalysisDate = useMemo(() => {
    if (!recentActionItems || recentActionItems.length === 0) return null;
    const latest = recentActionItems[0];
    const locale = i18n.language === 'he' ? 'he-IL' : 'en-US';
    return latest?.analyses?.created_at
      ? new Date(latest.analyses.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
      : null;
  }, [recentActionItems, i18n.language]);

  return (
    <div className="analysisPage">
      <FirstUploadGuide 
        isOpen={showFirstUploadGuide}
        onClose={() => setShowFirstUploadGuide(false)}
        userGoal={activeGoal}
      />
      {/* Top Navigation Bar */}
      <div className="analysisPage__topNav">
        <div className="analysisPage__topNavContent">
          <a className="analysisPage__logo" href="/" onClick={(e) => {
            e.preventDefault();
            onBackToDashboard();
          }}>
            <Logo size={28} className="analysisPage__logoIcon" />
            <span className="analysisPage__logoText">BodAI</span>
          </a>
          <div className="analysisPage__topNavRight">
            <button 
              className="analysisPage__navButton"
              onClick={onBackToDashboard}
            >
              <ArrowLeft size={18} />
              <span>{t('analysisPage.dashboard')}</span>
            </button>
            <div className="analysisPage__userButton">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="analysisPage__header">
        {currentAnalysisData ? (
          <div className="analysisPage__headerContent analysisPage__headerContent--view">
            <div className="analysisPage__headerText">
                <span className="analysisPage__crumb">{t('analysisPage.analysisOverview')}</span>
              <h1 className="analysisPage__title analysisPage__title--compact">
                {currentAnalysisData?.video_filename}
              </h1>
              <p className="analysisPage__subtitle analysisPage__subtitle--muted">
                {new Date(currentAnalysisData.created_at).toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="analysisPage__headerContent">
            <div className="analysisPage__headerText">
              <h1 className="analysisPage__title">{t('analysisPage.title')}</h1>
              <p className="analysisPage__subtitle">{t('analysisPage.subtitle')}</p>
            </div>
          </div>
        )}
      </div>

      <div className="analysisPage__content">
        {/* Viewing existing analysis */}
        {currentAnalysisData ? (
          <>
            <div className="analysisPage__viewLayout">
              <div className="analysisPage__viewColumn analysisPage__viewColumn--result">
                <div className="analysisPage__result analysisPage__result--compact">
                  <AnalysisResult 
                    markdown={currentAnalysisData.analysis_result} 
                    loading={false}
                    analysisId={currentAnalysisData.id}
                    viewingAnalysis={currentAnalysisData}
                  />
                  {currentAnalysisData.id && (
                    <div className="analysisPage__actions analysisPage__actions--inline">
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => handleDeleteAnalysis(currentAnalysisData.id)}
                      >
                        <Trash2 size={16} />
                        <span>{t('analysisPage.deleteAnalysis')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="analysisPage__viewColumn">
                <div className="analysisPage__analysisMetaCard">
                  <div className="analysisPage__analysisMetaRow">
                    <span className="analysisPage__metaLabel">{t('analysisPage.uploadedOn')}</span>
                    <span className="analysisPage__metaValue">
                      {new Date(currentAnalysisData.created_at).toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="analysisPage__analysisMetaRow">
                    <span className="analysisPage__metaLabel">{t('analysisPage.fileName')}</span>
                    <span className="analysisPage__metaValue">{currentAnalysisData.video_filename}</span>
                  </div>
                  {currentPromptDefinition && (
                    <div className="analysisPage__analysisMetaRow analysisPage__analysisMetaRow--stacked">
                      <span className="analysisPage__metaLabel">{t('analysisPage.sessionPrompt')}</span>
                      <div className="analysisPage__promptMeta">
                        <strong>{currentPromptDefinition.title}</strong>
                        {currentPromptDefinition.description && (
                          <p>{currentPromptDefinition.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="analysisPage__videoCard">
                  <h4 className="analysisPage__videoTitle">{t('analysisPage.videoPreview')}</h4>
                  {videoUrl ? (
                    <div className="analysisPage__videoFrame">
                      <VideoPlayer 
                        videoUrl={videoUrl} 
                        mimeType={currentAnalysisData.mime_type}
                      />
                    </div>
                  ) : (
                    <div className="analysisPage__videoPlaceholder">
                      <div className="analysisPage__videoPlaceholderIcon">🎥</div>
                      <p>{t('analysisPage.videoNotAvailable')}</p>
                    </div>
                  )}
                </div>

                <div className="analysisPage__quickActions">
                  <button 
                    className="btn btn--primary btn--fullWidth" 
                    onClick={() => {
                      navigate('/new-analysis');
                      onRemove?.();
                      setVideoUrl(null);
                    }}
                  >
                    <Plus size={18} />
                    <span>{t('analysisPage.newAnalysis')}</span>
                  </button>
                  <button 
                    className="btn btn--secondary btn--fullWidth" 
                    onClick={() => navigate('/practice')}
                  >
                    <Target size={18} />
                    <span>{t('analysisPage.goToPractice')}</span>
                  </button>
                  <button 
                    className="btn btn--secondary btn--fullWidth" 
                    onClick={onBackToDashboard}
                  >
                    <LayoutDashboard size={18} />
                    <span>{t('analysisPage.dashboard')}</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* New analysis flow */}
            {showNewAnalysisFlow && (
              <>
                <div className="analysisPage__newLayout">
                  <div className="analysisPage__mainColumn">
                    <div className="analysisPage__dashboardContainer">
                      {/* Streak Section */}
                      <div className="analysisPage__streakCard">
                        <div className="analysisPage__streakHeader">
                          <div className="analysisPage__streakCount">
                            <span className="analysisPage__fireIcon">🔥</span>
                            <span className="analysisPage__streakNumber">{streakData.count}</span>
                            <span className="analysisPage__streakLabel">{streakData.label}</span>
                          </div>
                        </div>
                        <div className="analysisPage__streakProgress">
                           <div className="analysisPage__progressBar">
                              <div 
                                 className="analysisPage__progressFill" 
                                 style={{ width: `${(streakData.progress / (streakData.target || 1)) * 100}%` }} 
                              />
                           </div>
                           <span className="analysisPage__progressText">
                              {streakData.progress} / {streakData.target} {t('streak.videosThisPeriod') || 'videos'}
                           </span>
                        </div>
                      </div>
                      {practiceCompletionNotices && practiceCompletionNotices.length > 0 && (
                        <div className="analysisPage__completionNotice">
                          <div>
                            {practiceCompletionNotices.map((notice) => (
                              <div key={notice.actionItemId || notice.title}>
                                <strong>{notice.title || t('analysisPage.optionalExercise')}</strong>
                                {notice.score !== undefined && (
                                  <span> • {t('analysisPage.score', { score: notice.score.toFixed(1) })}</span>
                                )}
                                <p>{t('analysisPage.greatWork')}</p>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="analysisPage__completionDismiss"
                            onClick={handleDismissCompletionNotices}
                          >
                            {t('common.buttons.dismiss')}
                          </button>
                        </div>
                      )}
                      <div className="analysisPage__focusSection">
                        {actionItemsLoading ? (
                          <div className="analysisPage__heroSkeleton" />
                        ) : recentActionItems.length > 0 ? (
                           <>
                             {/* Hero Card */}
                             <div className="analysisPage__heroCard">
                               <div className="analysisPage__heroHeader">
                                  <h3>{recentActionItems[0].title}</h3>
                               </div>
                               <div className="analysisPage__heroContent">
                                  <p>{formatActionDescription(recentActionItems[0])}</p>
                                  {recentActionItems[0].practice_prompt_description && (
                                    <button 
                                      className="analysisPage__heroAction"
                                      onClick={() => setSelectedPrompt({
                                          id: recentActionItems[0].practice_prompt_id || recentActionItems[0].id,
                                          title: recentActionItems[0].practice_prompt_title,
                                          description: recentActionItems[0].practice_prompt_description,
                                          setup: recentActionItems[0].practice_prompt_setup,
                                          whatToNotice: recentActionItems[0].practice_prompt_notice,
                                          recordingTip: recentActionItems[0].practice_prompt_tip,
                                          targetMetric: recentActionItems[0].practice_prompt_target_metric,
                                          difficulty: recentActionItems[0].practice_prompt_difficulty,
                                          estimatedTime: recentActionItems[0].practice_prompt_time,
                                          source: 'action',
                                          actionItemId: recentActionItems[0].id
                                      })}
                                    >
                                       <Play size={16} fill="currentColor" /> {t('analysisPage.practiceThis') || 'Practice This'}
                                    </button>
                                  )}
                               </div>
                             </div>
                             
                             {/* Secondary Focus - UPDATED */}
                             {recentActionItems.length > 1 && (
                               <div className="analysisPage__secondaryCard">
                                  <div className="analysisPage__secondaryHeader">
                                      <div className="analysisPage__secondaryTitleRow">
                                          <Target size={16} className="analysisPage__secondaryIcon" />
                                          <h4>{recentActionItems[1].title}</h4>
                                      </div>
                                      <span className="analysisPage__secondaryLabel">{t('analysisPage.secondaryFocus')}</span>
                                  </div>
                                  <div className="analysisPage__secondaryBody">
                                      <p>{formatActionDescription(recentActionItems[1])}</p>
                                      {recentActionItems[1].practice_prompt_description && (
                                          <button
                                              className="analysisPage__secondaryAction"
                                              onClick={() => setSelectedPrompt({
                                                  id: recentActionItems[1].practice_prompt_id || recentActionItems[1].id,
                                                  title: recentActionItems[1].practice_prompt_title,
                                                  description: recentActionItems[1].practice_prompt_description,
                                                  setup: recentActionItems[1].practice_prompt_setup,
                                                  whatToNotice: recentActionItems[1].practice_prompt_notice,
                                                  recordingTip: recentActionItems[1].practice_prompt_tip,
                                                  targetMetric: recentActionItems[1].practice_prompt_target_metric,
                                                  difficulty: recentActionItems[1].practice_prompt_difficulty,
                                                  estimatedTime: recentActionItems[1].practice_prompt_time,
                                                  source: 'action',
                                                  actionItemId: recentActionItems[1].id
                                              })}
                                          >
                                              <Play size={14} /> {t('analysisPage.practiceThis')}
                                          </button>
                                      )}
                                  </div>
                               </div>
                             )}
                           </>
                        ) : (
                           <div className="analysisPage__emptyState">
                              <p>{t('analysisPage.completeFirstAnalysis')}</p>
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Only show practice prompt section for returning users */}
                    {hasCompletedAnalysis && recentActionItems.length > 0 && (
                      <>
                    <div className="analysisPage__promptCard">
                      <div className="analysisPage__cardHeader">
                        <div className="analysisPage__cardHeaderIcon analysisPage__cardHeaderIcon--prompt">
                          <Video size={18} />
                        </div>
                        <div>
                              <p className="analysisPage__cardTitle">{t('analysisPage.optionalExercise')}</p>
                          <span className="analysisPage__cardSubtitle">
                                {selectedPrompt ? t('analysisPage.focus', { title: selectedPrompt.title }) : t('analysisPage.tryQuickDrill')}
                          </span>
                        </div>
                      </div>
                      {selectedPrompt?.source === 'action' && (
                            <span className="analysisPage__promptBadge">{t('analysisPage.fromYourTips')}</span>
                      )}
                      {selectedPrompt ? (
                        <div className="analysisPage__promptBody">
                          <div className="analysisPage__promptHeaderRow">
                            <h4>{selectedPrompt.title}</h4>
                            <button
                              type="button"
                              className="analysisPage__promptClear"
                              onClick={() => setSelectedPrompt(null)}
                            >
                                  {t('analysisPage.clear')}
                            </button>
                          </div>
                          {selectedPrompt.description && <p>{selectedPrompt.description}</p>}
                          <div className="analysisPage__promptMetaStack">
                            {renderPromptMeta('Setup', selectedPrompt.setup)}
                            {renderPromptMeta('What to notice', selectedPrompt.whatToNotice)}
                            {renderPromptMeta('Recording tip', selectedPrompt.recordingTip)}
                          </div>
                          {(selectedPrompt.targetMetric || selectedPrompt.difficulty || selectedPrompt.estimatedTime) && (
                            <div className="analysisPage__promptChips">
                              {selectedPrompt.targetMetric && (
                                <span className="analysisPage__promptChip">
                                  {formatMetricLabel(selectedPrompt.targetMetric, t)}
                                </span>
                              )}
                              {selectedPrompt.difficulty && (
                                <span className="analysisPage__promptChip">
                                  {selectedPrompt.difficulty.charAt(0).toUpperCase() + selectedPrompt.difficulty.slice(1)}
                                </span>
                              )}
                              {selectedPrompt.estimatedTime && (
                                <span className="analysisPage__promptChip">
                                  {selectedPrompt.estimatedTime}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="analysisPage__promptBody analysisPage__promptBody--empty">
                              <p>{t('analysisPage.tapToTry')}</p>
                        </div>
                      )}
                    </div>

                        
                      </>
                    )}

                    {!isLoading && (
                      <div className="analysisPage__upload analysisPage__uploadCard">
                        <UploadVideo file={file} onSelect={onSelect} onClear={onRemove} />
                        <div className="analysisPage__uploadNote">
                          <Timer size={14} />
                          <span>{t('analysisPage.minVideoDuration', { defaultValue: 'Minimum 30 seconds required for analysis' })}</span>
                        </div>
                      </div>
                    )}

                    {file && !isLoading && (
                      <div className="analysisPage__actions analysisPage__actions--left">
                        <button 
                          className="analysisPage__analyzeButton" 
                          onClick={handleAnalyzeClick} 
                          disabled={!file || isLoading}
                        >
                          <span>{t('analysisPage.analyzeVideo')}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="analysisPage__sideColumn">
                    <div className="analysisPage__tipsCard">
                      <div className="analysisPage__cardHeader">
                        <div className="analysisPage__cardHeaderIcon analysisPage__cardHeaderIcon--gold">
                          <Lightbulb size={18} />
                        </div>
                        <div>
                          <p className="analysisPage__cardTitle">{t('analysisPage.preFlightCheck') || 'Pre-Flight Check'}</p>
                        </div>
                      </div>
                      <div className="analysisPage__tipsList">
                        {personalizedChecklist.map((item) => (
                          <div key={item.id} className="analysisPage__tipItem">
                            <div className="analysisPage__tipIcon">
                              <CheckCircle2 size={18} />
                            </div>
                            <div className="analysisPage__tipContent">
                              <p className="analysisPage__tipDescription">
                                {item.key ? t(item.key) : item.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {file ? (
                      <div className="analysisPage__preview analysisPage__preview--floating">
                        <VideoPlayer file={file} />
                      </div>
                    ) : (
                      <div className="analysisPage__previewPlaceholder">
                        <div className="analysisPage__previewText">
                          <p>{t('analysisPage.readyWhenYouAre')}</p>
                          <span>{t('analysisPage.uploadPreview')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {isLoading && (
              <div className="analysisPage__loading">
                <LoadingView active />
              </div>
            )}

            {result && !isLoading && (
              <>
                <div className="analysisPage__viewLayout">
                  <div className="analysisPage__viewColumn analysisPage__viewColumn--result">
                    <div className="analysisPage__result">
                      <AnalysisResult 
                        markdown={result} 
                        loading={false}
                        analysisId={currentAnalysisId}
                      />
                      {currentAnalysisId && (
                        <ReflectionPrompt
                          analysisId={currentAnalysisId}
                          journeyId={activeJourneyId}
                        />
                      )}
                    </div>
                  </div>
                  <div className="analysisPage__viewColumn">
                    <div className="analysisPage__analysisMetaCard">
                      <div className="analysisPage__analysisMetaRow">
                        <span className="analysisPage__metaLabel">{t('analysisPage.uploadedOn')}</span>
                        <span className="analysisPage__metaValue">
                          {new Date().toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {file?.name && (
                        <div className="analysisPage__analysisMetaRow">
                          <span className="analysisPage__metaLabel">{t('analysisPage.fileName')}</span>
                          <span className="analysisPage__metaValue">{file.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="analysisPage__videoCard">
                      <h4 className="analysisPage__videoTitle">{t('analysisPage.videoPreview')}</h4>
                      {file ? (
                        <div className="analysisPage__videoFrame">
                          <VideoPlayer file={file} />
                        </div>
                      ) : (
                        <div className="analysisPage__videoPlaceholder">
                          <div className="analysisPage__videoPlaceholderIcon">🎥</div>
                          <p>{t('analysisPage.videoNotAvailableSession')}</p>
                        </div>
                      )}
                    </div>

                    <div className="analysisPage__quickActions">
                      <button 
                        className="btn btn--primary btn--fullWidth" 
                        onClick={() => {
                          navigate('/new-analysis');
                          onRemove?.();
                          setVideoUrl(null);
                        }}
                      >
                        <Plus size={18} />
                        <span>{t('analysisPage.newAnalysis')}</span>
                      </button>
                      <button 
                        className="btn btn--secondary btn--fullWidth" 
                        onClick={() => navigate('/practice')}
                      >
                        <Target size={18} />
                        <span>{t('analysisPage.goToPractice')}</span>
                      </button>
                      <button 
                        className="btn btn--secondary btn--fullWidth" 
                        onClick={onBackToDashboard}
                      >
                        <LayoutDashboard size={18} />
                        <span>{t('analysisPage.dashboard')}</span>
                      </button>
                      {currentAnalysisId && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--fullWidth"
                          onClick={() => handleDeleteAnalysis(currentAnalysisId)}
                          style={{ marginTop: '8px', color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }}
                        >
                          <Trash2 size={16} />
                          <span>{t('analysisPage.deleteSession')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}


