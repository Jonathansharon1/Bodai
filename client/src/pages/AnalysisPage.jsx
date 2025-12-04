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
  Play
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
  const { t } = useTranslation();
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

  useEffect(() => {
    if (currentAnalysisData) return;
    // Don't auto-select - let user choose from action items
    setSelectedPrompt(null);
    setPracticeAcknowledged(true);
    setPracticeAckTouched(false);
  }, [actionPromptOption, currentAnalysisData]);

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

    let pollInterval = null;

    const fetchActionItems = async (isInitial = false) => {
      if (isInitial) {
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
          
          // Check if we need to poll for practice prompts
          const hasItemsWithoutPrompts = sorted.some(item => 
            !item.practice_prompt_generated && 
            !item.practice_prompt_title && 
            item.status === 'pending'
          );
          
          // If there are items without prompts, poll every 3 seconds for up to 30 seconds
          if (hasItemsWithoutPrompts && !pollInterval) {
            let pollCount = 0;
            const maxPolls = 10; // 10 polls * 3 seconds = 30 seconds max
            pollInterval = setInterval(() => {
              pollCount++;
              if (pollCount >= maxPolls || !isMounted) {
                if (pollInterval) {
                  clearInterval(pollInterval);
                  pollInterval = null;
                }
                return;
              }
              fetchActionItems(false);
            }, 3000);
          } else if (!hasItemsWithoutPrompts && pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        } else {
          setActionItemsError('Unable to load your latest action items right now.');
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch action items:', error);
          if (isMounted) {
            setActionItemsError('Unable to load your latest action items right now.');
          }
        }
      } finally {
        if (isMounted && isInitial) {
          setActionItemsLoading(false);
        }
      }
    };

    fetchActionItems(true);

    return () => {
      isMounted = false;
      controller.abort();
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [user, id, viewingAnalysis, activeJourneyId, refreshTrigger, result]);

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
    return latest?.analyses?.created_at
      ? new Date(latest.analyses.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : null;
  }, [recentActionItems]);

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
                {new Date(currentAnalysisData.created_at).toLocaleDateString('en-US', { 
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
                      {new Date(currentAnalysisData.created_at).toLocaleDateString('en-US', { 
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
                    <div className="analysisPage__nextStepsCard">
                      <div className="analysisPage__cardHeader">
                        <div className="analysisPage__cardHeaderIcon">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <p className="analysisPage__cardTitle">{t('analysisPage.nextSteps')}</p>
                          <span className="analysisPage__cardSubtitle">
                            {latestAnalysisDate ? t('analysisPage.basedOnSession', { date: latestAnalysisDate }) : t('analysisPage.basedOnLatest')}
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
                      <div className="analysisPage__stepList">
                        {actionItemsLoading && (
                          <>
                            {[1, 2, 3].map((skeleton) => (
                              <div key={skeleton} className="analysisPage__stepItem analysisPage__stepItem--skeleton">
                                <div className="analysisPage__stepIconPlaceholder" />
                                <div className="analysisPage__stepTextPlaceholder">
                                  <div className="analysisPage__stepLine line--short" />
                                  <div className="analysisPage__stepLine line--long" />
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {!actionItemsLoading && actionItemsError && (
                          <div className="analysisPage__emptyState">
                            <p>{actionItemsError}</p>
                          </div>
                        )}

                        {!actionItemsLoading && !actionItemsError && recentActionItems.length === 0 && (
                          <div className="analysisPage__emptyState">
                            <p>
                              {hasCompletedAnalysis
                                ? t('analysisPage.noTipsAvailable')
                                : t('analysisPage.completeFirstAnalysis')}
                            </p>
                          </div>
                        )}

                        {!actionItemsLoading && !actionItemsError && recentActionItems.length > 0 && (
                          recentActionItems.map((item, index) => (
                            <div key={item.id || index} className="analysisPage__stepItem">
                              <div className="analysisPage__stepIcon">
                                <CheckCircle2 size={18} />
                              </div>
                              <div className="analysisPage__stepContent">
                                <div className="analysisPage__stepTitle">{item.title}</div>
                                <div className="analysisPage__stepInstantLabel">{t('analysisPage.instantTipLabel')}</div>
                                <p className="analysisPage__stepDescription">
                                  {formatActionDescription(item)}
                                </p>
                                {item.practice_prompt_title && item.practice_prompt_description && (
                                  <button
                                    type="button"
                                    className="analysisPage__stepPracticeButton"
                                    onClick={() => item.practice_prompt_description && setSelectedPrompt({
                                      id: item.practice_prompt_id || item.id,
                                      title: item.practice_prompt_title,
                                      description: item.practice_prompt_description,
                                      setup: item.practice_prompt_setup,
                                      whatToNotice: item.practice_prompt_notice,
                                      recordingTip: item.practice_prompt_tip,
                                      targetMetric: item.practice_prompt_target_metric,
                                      difficulty: item.practice_prompt_difficulty,
                                      estimatedTime: item.practice_prompt_time,
                                      source: 'action',
                                      actionItemId: item.id
                                    })}
                                  >
                                    {t('analysisPage.optionalExercise')}
                                  </button>
                                )}
                              </div>
                              <span className="analysisPage__stepBadge">Step {index + 1}</span>
                            </div>
                          ))
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

                    <div className="analysisPage__upload analysisPage__uploadCard">
                      <UploadVideo file={file} onSelect={onSelect} onClear={onRemove} />
                      <div className="analysisPage__uploadNote">
                        <Timer size={14} />
                        <span>{t('analysisPage.minVideoDuration', { defaultValue: 'Minimum 30 seconds required for analysis' })}</span>
                      </div>
                    </div>

                    {file && (
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
                          <p className="analysisPage__cardTitle">{t('analysisPage.recordingTips')}</p>
                          <span className="analysisPage__cardSubtitle">{t('analysisPage.keepFundamentals')}</span>
                        </div>
                      </div>
                      <div className="analysisPage__tipsList">
                        {RECORDING_TIP_DEFS.map((tip) => {
                          const Icon = tip.icon;
                          const titleKey = `analysisPage.recordingTipsList.${tip.id}.title`;
                          const descriptionKey = `analysisPage.recordingTipsList.${tip.id}.description`;
                          return (
                            <div key={tip.id} className="analysisPage__tipItem">
                              <div className="analysisPage__tipIcon">
                                <Icon size={18} />
                              </div>
                              <div className="analysisPage__tipContent">
                                <div className="analysisPage__tipTitle">{t(titleKey)}</div>
                                <p className="analysisPage__tipDescription">{t(descriptionKey)}</p>
                              </div>
                            </div>
                          );
                        })}
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
                          {new Date().toLocaleDateString('en-US', { 
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
                  </div>
                </div>
                <div className="analysisPage__actions">
                  <button 
                    className="btn btn--primary" 
                    onClick={onBackToDashboard}
                  >
                    {t('analysisPage.viewInDashboard')}
                  </button>
                  <button 
                    className="btn btn--secondary" 
                    onClick={() => {
                      navigate('/new-analysis');
                      onRemove?.();
                      setVideoUrl(null);
                    }}
                  >
                    <Plus size={18} />
                    <span>{t('analysisPage.newAnalysis')}</span>
                  </button>
          {currentAnalysisId && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => handleDeleteAnalysis(currentAnalysisId)}
            >
              <Trash2 size={16} />
              <span>{t('analysisPage.deleteSession')}</span>
            </button>
          )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}


