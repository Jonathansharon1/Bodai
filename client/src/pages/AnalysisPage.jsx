import React, { useState, useEffect, useMemo } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle2, 
  Sparkles,
  Lightbulb,
  Video,
  Sun,
  Timer,
  Eye
} from 'lucide-react';
import Logo from '../components/Logo';
import UploadVideo from '../components/UploadVideo';
import VideoPlayer from '../components/VideoPlayer';
import AnalysisResult from '../components/AnalysisResult';
import LoadingView from '../components/LoadingView';
import './AnalysisPage.css';
import { getPromptById } from '../config/recordingPrompts';

const RECORDING_TIPS = [
  {
    id: 'framing',
    title: 'Show full gestures',
    description: 'Frame yourself from mid-torso up so posture and hand movement stay in view.',
    icon: Video
  },
  {
    id: 'lighting',
    title: 'Balance your lighting',
    description: 'Face soft, even light and avoid backlighting so your expressions stay clear.',
    icon: Sun
  },
  {
    id: 'duration',
    title: 'Keep it concise',
    description: 'Aim for 2–3 minutes to spotlight one story or message with full energy.',
    icon: Timer
  },
  {
    id: 'eyeline',
    title: 'Match camera height',
    description: 'Place the camera at eye level to instantly boost presence and connection.',
    icon: Eye
  }
];

const PRACTICE_METRIC_LABELS = {
  presence: 'Presence',
  voice_expression: 'Voice',
  clarity: 'Clarity',
  authenticity: 'Authenticity',
  impact: 'Impact',
  confidence: 'Confidence',
  overall: 'Overall'
};

const formatMetricLabel = (metric) => {
  if (!metric) return null;
  return PRACTICE_METRIC_LABELS[metric] || metric.replace(/_/g, ' ');
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

  useEffect(() => {
    if (currentAnalysisData) return;
    if (actionPromptOption) {
      setSelectedPrompt(actionPromptOption);
    } else {
      setSelectedPrompt(null);
    }
  }, [actionPromptOption, currentAnalysisData]);

  const handleAnalyzeClick = () => {
    onAnalyze({ recordingPrompt: selectedPrompt });
  };

  const handleDismissCompletionNotices = () => {
    if (onDismissPracticeNotices) {
      onDismissPracticeNotices();
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

          setRecentActionItems(sorted.slice(0, 4));
          
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
      || 'Keep this cue top of mind for your next recording.';

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
              <span>Dashboard</span>
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
                <span className="analysisPage__crumb">Analysis overview</span>
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
              <h1 className="analysisPage__title">Upload your practice video</h1>
              <p className="analysisPage__subtitle">Each recording unlocks sharper coaching for your focus journey.</p>
            </div>
          </div>
        )}
      </div>

      <div className="analysisPage__content">
        {/* Viewing existing analysis */}
        {currentAnalysisData ? (
          <>
            <div className="analysisPage__viewLayout">
              <div className="analysisPage__viewColumn">
                <div className="analysisPage__analysisMetaCard">
                  <div className="analysisPage__analysisMetaRow">
                    <span className="analysisPage__metaLabel">Uploaded on</span>
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
                    <span className="analysisPage__metaLabel">File name</span>
                    <span className="analysisPage__metaValue">{currentAnalysisData.video_filename}</span>
                  </div>
                  {currentPromptDefinition && (
                    <div className="analysisPage__analysisMetaRow analysisPage__analysisMetaRow--stacked">
                      <span className="analysisPage__metaLabel">Session prompt</span>
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
                  <h4 className="analysisPage__videoTitle">Video Preview</h4>
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
                      <p>Video preview is not available for this analysis.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="analysisPage__viewColumn analysisPage__viewColumn--result">
                <div className="analysisPage__result analysisPage__result--compact">
                  <AnalysisResult 
                    markdown={currentAnalysisData.analysis_result} 
                    loading={false}
                    analysisId={currentAnalysisData.id}
                    viewingAnalysis={currentAnalysisData}
                  />
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
                          <p className="analysisPage__cardTitle">Next Steps for Your Next Video</p>
                          <span className="analysisPage__cardSubtitle">
                            {latestAnalysisDate ? `Based on your ${latestAnalysisDate} session` : 'Based on your latest session'}
                          </span>
                        </div>
                      </div>
                      {practiceCompletionNotices && practiceCompletionNotices.length > 0 && (
                        <div className="analysisPage__completionNotice">
                          <div>
                            {practiceCompletionNotices.map((notice) => (
                              <div key={notice.actionItemId || notice.title}>
                                <strong>{notice.title || 'Practice prompt'}</strong>
                                {notice.score !== undefined && (
                                  <span> • score {notice.score.toFixed(1)}/10</span>
                                )}
                                <p>Great work! This focus is now completed. We’ll surface a new action item after your next analysis.</p>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="analysisPage__completionDismiss"
                            onClick={handleDismissCompletionNotices}
                          >
                            Dismiss
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
                                ? 'No action items are available right now. Upload another analysis to receive a new personalized focus.'
                                : 'Complete your first analysis to unlock personalized next steps.'}
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
                                <div className="analysisPage__stepInstantLabel">Instant Tip</div>
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
                                    Try optional practice
                                  </button>
                                )}
                              </div>
                              <span className="analysisPage__stepBadge">Step {index + 1}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="analysisPage__promptCard">
                      <div className="analysisPage__cardHeader">
                        <div className="analysisPage__cardHeaderIcon analysisPage__cardHeaderIcon--prompt">
                          <Video size={18} />
                        </div>
                        <div>
                          <p className="analysisPage__cardTitle">Optional Practice Prompt</p>
                          <span className="analysisPage__cardSubtitle">
                            {selectedPrompt ? `Focus: ${selectedPrompt.title}` : 'Try a quick drill when you’re ready—totally optional'}
                          </span>
                        </div>
                      </div>
                      {selectedPrompt?.source === 'action' && (
                        <span className="analysisPage__promptBadge">From your action plan</span>
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
                              Clear drill
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
                                  {formatMetricLabel(selectedPrompt.targetMetric)}
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
                          <p>Practice is optional. Tap “Try optional practice” on any focus when you want a 60-second drill.</p>
                        </div>
                      )}
                    </div>

                    <p className="analysisPage__reminder">
                      Need a reminder? Use this prompt to guide your next recording.
                    </p>

                    <div className="analysisPage__upload analysisPage__uploadCard">
                      <UploadVideo file={file} onSelect={onSelect} onClear={onRemove} />
                    </div>

                    {file && (
                      <div className="analysisPage__actions analysisPage__actions--left">
                        <button 
                          className="btn btn--primary" 
                          onClick={handleAnalyzeClick} 
                          disabled={!file || isLoading}
                        >
                          Analyze Video
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
                          <p className="analysisPage__cardTitle">Recording Tips</p>
                          <span className="analysisPage__cardSubtitle">Keep these fundamentals every session</span>
                        </div>
                      </div>
                      <div className="analysisPage__tipsList">
                        {RECORDING_TIPS.map((tip) => {
                          const Icon = tip.icon;
                          return (
                            <div key={tip.id} className="analysisPage__tipItem">
                              <div className="analysisPage__tipIcon">
                                <Icon size={18} />
                              </div>
                              <div className="analysisPage__tipContent">
                                <div className="analysisPage__tipTitle">{tip.title}</div>
                                <p className="analysisPage__tipDescription">{tip.description}</p>
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
                          <p>Ready when you are.</p>
                          <span>Upload a clip to preview your framing before sending it for analysis.</span>
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
                  <div className="analysisPage__viewColumn">
                    <div className="analysisPage__analysisMetaCard">
                      <div className="analysisPage__analysisMetaRow">
                        <span className="analysisPage__metaLabel">Uploaded</span>
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
                          <span className="analysisPage__metaLabel">File</span>
                          <span className="analysisPage__metaValue">{file.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="analysisPage__videoCard">
                      <h4 className="analysisPage__videoTitle">Video Preview</h4>
                      {file ? (
                        <div className="analysisPage__videoFrame">
                          <VideoPlayer file={file} />
                        </div>
                      ) : (
                        <div className="analysisPage__videoPlaceholder">
                          <div className="analysisPage__videoPlaceholderIcon">🎥</div>
                          <p>Video preview is not available for this session.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="analysisPage__viewColumn analysisPage__viewColumn--result">
                    <div className="analysisPage__result">
                      <AnalysisResult 
                        markdown={result} 
                        loading={false}
                        analysisId={currentAnalysisId}
                      />
                    </div>
                  </div>
                </div>
                <div className="analysisPage__actions">
                  <button 
                    className="btn btn--primary" 
                    onClick={onBackToDashboard}
                  >
                    View in Dashboard
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
                    <span>New Analysis</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}


