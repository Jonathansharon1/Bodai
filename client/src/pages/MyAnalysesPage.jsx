import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Target,
  Dumbbell,
  Mic,
  Video,
  MessageCircle,
  Award,
  Heart,
  Users,
  Sparkles,
  Plus,
  Briefcase
} from 'lucide-react';
import './MyAnalysesPage.css';
import { getPromptById } from '../config/recordingPrompts';
import JourneySwitcher from '../components/JourneySwitcher';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function MyAnalysesPage({
  onViewAnalysis,
  journeys = [],
  journeysLoading = false,
  activeJourneyId = null,
  onSelectJourney
}) {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useTranslation();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewUrls, setPreviewUrls] = useState({});

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    } else {
      setAnalyses([]);
      setLoading(false);
    }
  }, [user, activeJourneyId]);

  useEffect(() => {
    if (!user?.id || analyses.length === 0) return;
    let isMounted = true;

    const loadPreviews = async () => {
      const urls = {};
      for (const analysis of analyses) {
        if (!analysis?.s3_key || previewUrls[analysis.id]) continue;
        try {
          const res = await fetch(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/analyses/${analysis.id}/video-url`,
            {
              headers: {
                'X-Clerk-User-Id': user.id,
                'Content-Type': 'application/json'
              }
            }
          );
          if (!res.ok) continue;
          const data = await res.json();
          if (data?.video_url) {
            urls[analysis.id] = data.video_url;
          }
        } catch (err) {
          console.warn(`Preview unavailable for ${analysis.id}:`, err);
        }
      }
      if (isMounted && Object.keys(urls).length > 0) {
        setPreviewUrls(prev => ({ ...prev, ...urls }));
      }
    };

    loadPreviews();
    return () => { isMounted = false; };
  }, [analyses, user?.id]);

  const fetchAnalyses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeJourneyId) {
        params.append('journeyId', activeJourneyId);
      }
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/analyses'}${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, {
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAnalyses(data.analyses || []);
      }
    } catch (err) {
      console.error('Failed to fetch analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGoalIcon = (goal) => {
    const goalIcons = {
      'confidence': Dumbbell,
      'content': Video,
      'presentation': Mic,
      'leadership': Award,
      'interview': Briefcase,
      'sales': Users
    };
    const IconComponent = goalIcons[goal] || Target;
    return IconComponent;
  };

  const activeJourney = useMemo(
    () => journeys.find(journey => journey.id === activeJourneyId) || null,
    [journeys, activeJourneyId]
  );
  
  const getGoalLabel = (goal) => {
    if (!goal) return null;
    // Prefer localized goal label from myProgress goals map
    const key = `myProgress.goals.${goal}`;
    const translated = t(key);
    // If translation exists, it will differ from the key string
    if (translated && translated !== key) {
      return translated;
    }
    // Fallback to onboarding goal label if defined
    const onboardingKey = `onboarding.goal.${goal}.label`;
    const onboardingLabel = t(onboardingKey);
    if (onboardingLabel && onboardingLabel !== onboardingKey) {
      return onboardingLabel;
    }
    // Final fallback – raw goal slug
    return goal;
  };
  
  const focusSlug = activeJourney?.focus_slug;
  const focusLabel = focusSlug ? getGoalLabel(focusSlug) : (activeJourney?.display_name || activeJourney?.focus_label || null);

  if (loading) {
    return (
      <div className="myAnalysesPage">
        <LoadingSpinner message={t('myAnalyses.loading')} size="large" />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="myAnalysesPage">
        <div className="myAnalysesPage__header">
          <div className="myAnalysesPage__headerContent">
            <JourneySwitcher
              className="dashboard__journeyTabs myAnalysesPage__journeyTabs"
              journeys={journeys}
              journeysLoading={journeysLoading}
              activeJourneyId={activeJourneyId}
              onSelectJourney={onSelectJourney}
            />
            <h1 className="myAnalysesPage__title">{t('myAnalyses.title')}</h1>
            <p className="myAnalysesPage__subtitle">
              {focusLabel
                ? t('myAnalyses.emptySubtitleWithFocus', { focusLabel })
                : t('myAnalyses.emptySubtitle')}
            </p>
          </div>
          <button 
            className="btn btn--primary myAnalysesPage__newButton"
            onClick={() => navigate('/new-analysis')}
          >
            <Plus size={18} />
            <span>{t('myAnalyses.newAnalysis')}</span>
          </button>
        </div>
        <EmptyState
          variant="analyses"
          title={focusLabel
            ? t('myAnalyses.emptyTitleWithFocus', { focusLabel })
            : t('myAnalyses.emptyTitle')}
          description={focusLabel
            ? t('myAnalyses.emptyDescriptionWithFocus', { focusLabel })
            : t('myAnalyses.emptyDescription')}
          actionLabel={t('myAnalyses.emptyAction')}
          onAction={() => navigate('/new-analysis')}
        />
      </div>
    );
  }

  return (
    <div className="myAnalysesPage">
      <div className="myAnalysesPage__header">
        <div className="myAnalysesPage__headerContent">
          <JourneySwitcher
            className="dashboard__journeyTabs myAnalysesPage__journeyTabs"
            journeys={journeys}
            journeysLoading={journeysLoading}
            activeJourneyId={activeJourneyId}
            onSelectJourney={onSelectJourney}
          />
          <h1 className="myAnalysesPage__title">{t('myAnalyses.title')}</h1>
          <p className="myAnalysesPage__subtitle">
            {focusLabel
              ? t('myAnalyses.subtitleWithFocus', {
                  focusLabel,
                  count: analyses.length,
                  unit: analyses.length === 1 ? 'analysis' : 'analyses'
                })
              : t('myAnalyses.subtitle', {
                  count: analyses.length,
                  unit: analyses.length === 1 ? 'analysis' : 'analyses'
                })}
          </p>
        </div>
        <button 
          className="btn btn--primary myAnalysesPage__newButton"
          onClick={() => navigate('/new-analysis')}
        >
          <Plus size={18} />
          <span>{t('myAnalyses.newAnalysis')}</span>
        </button>
      </div>
      
      <div className="myAnalysesPage__list">
        {analyses.map((analysis) => {
          const goal = analysis.user_context?.primaryGoal || 'general';
          const IconComponent = getGoalIcon(goal);
          const previewUrl = previewUrls[analysis.id];
          const promptDefinition = analysis.recording_prompt_title
            ? { title: analysis.recording_prompt_title, description: analysis.recording_prompt_description }
            : getPromptById(analysis.recording_prompt_id);
          
          return (
            <div key={analysis.id} className="analysisCard analysisCard--preview">
              <div className="analysisCard__media analysisCard__media--static">
                {previewUrl ? (
                  <video 
                    src={previewUrl}
                    preload="metadata"
                    muted
                    playsInline
                    controls={false}
                    onLoadedMetadata={(e) => {
                      try { e.currentTarget.currentTime = 0.1; } catch (_) {}
                      e.currentTarget.pause();
                    }}
                  />
                ) : (
                  <div className="analysisCard__mediaPlaceholder">
                    <div className="analysisCard__mediaIcon">🎞️</div>
                    <p>{t('myAnalyses.previewUnavailable')}</p>
                  </div>
                )}
              </div>

              <div className="analysisCard__details">
                <div className="analysisCard__metaRow">
                  <span className="analysisCard__date">{formatDate(analysis.created_at)}</span>
                  <span className="analysisCard__goalChip">
                    <IconComponent size={16} />
                    {analysis.user_context?.primaryGoal || t('myAnalyses.goalChip', { goal: 'General' })}
                  </span>
                </div>
                <div className="analysisCard__filename">{analysis.video_filename}</div>
                <div className="analysisCard__promptSnippet">
                  {promptDefinition ? (
                    <>
                      <strong>{promptDefinition.title}</strong>
                      {promptDefinition.description && (
                        <p>{promptDefinition.description}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <strong>{t('myAnalyses.freePracticeTitle')}</strong>
                      <p>{t('myAnalyses.freePracticeDescription')}</p>
                    </>
                  )}
                </div>
                <button 
                  className="btn btn--primary analysisCard__viewButton"
                  onClick={() => {
                    if (onViewAnalysis) {
                      onViewAnalysis(analysis);
                    } else {
                      navigate(`/analysis/${analysis.id}`);
                    }
                  }}
                >
                  {t('myAnalyses.viewAnalysis')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

