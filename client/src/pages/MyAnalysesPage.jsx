import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { 
  Target,
  Dumbbell,
  Briefcase,
  Mic,
  MessageCircle,
  Award,
  Heart,
  Users,
  Sparkles,
  Plus
} from 'lucide-react';
import './MyAnalysesPage.css';
import { getPromptById } from '../config/recordingPrompts';
import JourneySwitcher from '../components/JourneySwitcher';

export default function MyAnalysesPage({
  onViewAnalysis,
  journeys = [],
  journeysLoading = false,
  activeJourneyId = null,
  onSelectJourney
}) {
  const navigate = useNavigate();
  const { user } = useUser();
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
      'interview': Briefcase,
      'presentation': Mic,
      'communication': MessageCircle,
      'leadership': Award,
      'dating': Heart,
      'social': Users,
      'general': Sparkles
    };
    const IconComponent = goalIcons[goal] || Target;
    return IconComponent;
  };

  const activeJourney = useMemo(
    () => journeys.find(journey => journey.id === activeJourneyId) || null,
    [journeys, activeJourneyId]
  );
  const focusLabel = activeJourney?.display_name || activeJourney?.focus_label || activeJourney?.focus_slug;

  if (loading) {
    return (
      <div className="myAnalysesPage">
        <div className="myAnalysesPage__loading">Loading your analyses...</div>
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
            <h1 className="myAnalysesPage__title">My Analyses</h1>
            <p className="myAnalysesPage__subtitle">
              {focusLabel ? `${focusLabel}: no sessions yet` : 'Start your first analysis to see it here.'}
            </p>
          </div>
          <button 
            className="btn btn--primary myAnalysesPage__newButton"
            onClick={() => navigate('/new-analysis')}
          >
            <Plus size={18} />
            <span>New Analysis</span>
          </button>
        </div>
        <div className="myAnalysesPage__empty">
          <p>
            {focusLabel
              ? `No analyses yet for ${focusLabel}. Upload a video to begin tracking this focus.`
              : 'No analyses yet. Start your first analysis to see it here.'}
          </p>
        </div>
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
          <h1 className="myAnalysesPage__title">My Analyses</h1>
          <p className="myAnalysesPage__subtitle">
            {focusLabel
              ? `${focusLabel}: ${analyses.length} ${analyses.length === 1 ? 'analysis' : 'analyses'} completed`
              : `${analyses.length} ${analyses.length === 1 ? 'analysis' : 'analyses'} completed`}
          </p>
        </div>
        <button 
          className="btn btn--primary myAnalysesPage__newButton"
          onClick={() => navigate('/new-analysis')}
        >
          <Plus size={18} />
          <span>New Analysis</span>
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
                    <p>Preview unavailable</p>
                  </div>
                )}
              </div>

              <div className="analysisCard__details">
                <div className="analysisCard__metaRow">
                  <span className="analysisCard__date">{formatDate(analysis.created_at)}</span>
                  <span className="analysisCard__goalChip">
                    <IconComponent size={16} />
                    {analysis.user_context?.primaryGoal || 'General'}
                  </span>
                </div>
                <div className="analysisCard__filename">{analysis.video_filename}</div>
                {promptDefinition && (
                  <div className="analysisCard__promptSnippet">
                    <strong>{promptDefinition.title}</strong>
                    {promptDefinition.description && (
                      <p>{promptDefinition.description}</p>
                    )}
                  </div>
                )}
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
                  View Analysis
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

