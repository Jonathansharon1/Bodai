import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Target,
  Sparkles,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  ArrowRight,
  MessageSquare,
  Eye,
  Video,
  Play
} from 'lucide-react';
import './PracticePage.css';
import JourneySwitcher from '../components/JourneySwitcher';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonCard } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { GOAL_EXPLANATIONS } from '../components/OnboardingQuestions';

const PARAMETER_CATEGORIES = {
  voice: {
    name: 'Voice Expression',
    icon: MessageSquare,
    color: '#3b82f6',
    parameters: [
      { key: 'voice_volume_stability', label: 'Volume Stability' },
      { key: 'voice_tone_variation', label: 'Tone Variation' },
      { key: 'voice_pace_control', label: 'Pace Control' },
      { key: 'voice_articulation', label: 'Articulation' },
      { key: 'voice_warmth', label: 'Vocal Warmth' }
    ]
  },
  presence: {
    name: 'Presence',
    icon: Eye,
    color: '#10b981',
    parameters: [
      { key: 'presence_eye_contact', label: 'Eye Contact' },
      { key: 'presence_facial_relaxation', label: 'Facial Relaxation' },
      { key: 'presence_body_posture', label: 'Body Posture' },
      { key: 'presence_hand_naturalness', label: 'Hand Naturalness' },
      { key: 'presence_openness', label: 'Openness' }
    ]
  },
  clarity: {
    name: 'Clarity',
    icon: MessageSquare,
    color: '#f59e0b',
    parameters: [
      { key: 'clarity_structure', label: 'Structure' },
      { key: 'clarity_focus', label: 'Focus' },
      { key: 'clarity_example_usage', label: 'Example Usage' },
      { key: 'clarity_transition_quality', label: 'Transition Quality' },
      { key: 'clarity_repetition_control', label: 'Repetition Control' }
    ]
  },
  authenticity: {
    name: 'Authenticity',
    icon: MessageSquare,
    color: '#8b5cf6',
    parameters: [
      { key: 'authenticity_naturalness', label: 'Naturalness' },
      { key: 'authenticity_emotional_transparency', label: 'Emotional Transparency' },
      { key: 'authenticity_forced_expression_reduction', label: 'Forced Expression Reduction' }
    ]
  },
  impact: {
    name: 'Impact',
    icon: MessageSquare,
    color: '#ef4444',
    parameters: [
      { key: 'impact_energy', label: 'Energy' },
      { key: 'impact_engagement', label: 'Engagement' },
      { key: 'impact_persuasiveness', label: 'Persuasiveness' }
    ]
  },
  confidence: {
    name: 'Confidence',
    icon: MessageSquare,
    color: '#06b6d4',
    parameters: [
      { key: 'confidence_filler_word_control', label: 'Filler Word Control' },
      { key: 'confidence_pause_control', label: 'Pause Control' },
      { key: 'confidence_physical_tension', label: 'Physical Tension' },
      { key: 'confidence_vocal_stability', label: 'Vocal Stability' },
      { key: 'confidence_comfort_level', label: 'Comfort Level' }
    ]
  }
};

export default function PracticePage({
  journeys = [],
  journeysLoading = false,
  activeJourneyId = null,
  onSelectJourney
}) {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [actionItems, setActionItems] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [practiceMissions, setPracticeMissions] = useState({});
  const [loadingMissions, setLoadingMissions] = useState({});
  const [expandedWeaknesses, setExpandedWeaknesses] = useState(new Set());
  const [missionCompletions, setMissionCompletions] = useState({}); // { practiceMissionId: { missionIndex: true } }
  const [completionStats, setCompletionStats] = useState(null);
  const [completingMission, setCompletingMission] = useState({});
  const [celebratingMission, setCelebratingMission] = useState(null);

  const activeJourney = useMemo(
    () => journeys.find(journey => journey.id === activeJourneyId) || null,
    [journeys, activeJourneyId]
  );

  const getGoalLabel = (goal) => {
    const goalMap = {
      'confidence': 'Build Confidence',
      'content': 'Content Creator',
      'presentation': 'Presentation Skills',
      'leadership': 'Executive Presence',
      'interview': 'Job Interviews',
      'sales': 'Face-to-face Sales'
    };
    return goalMap[goal] || goal;
  };

  const focusSlug = activeJourney?.focus_slug;
  const focusLabel = focusSlug ? getGoalLabel(focusSlug) : (activeJourney?.display_name || activeJourney?.focus_label || null);
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const focusGoalExplanation = focusSlug ? GOAL_EXPLANATIONS[focusSlug] : null;

  // Check for focus filter in URL
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const focusFilter = urlParams.get('focus');

  const fetchCompletionData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const headers = {
        'X-Clerk-User-Id': user.id,
        'Content-Type': 'application/json'
      };

      // Fetch completions
      const completionsParams = new URLSearchParams();
      if (activeJourneyId) {
        completionsParams.append('journeyId', activeJourneyId);
      }
      const completionsRes = await fetch(`${apiBase}/api/practice-missions/completions?${completionsParams.toString()}`, { headers });
      if (completionsRes.ok) {
        const completionsData = await completionsRes.json();
        const completionsMap = {};
        completionsData.completions?.forEach(completion => {
          if (!completionsMap[completion.practice_mission_id]) {
            completionsMap[completion.practice_mission_id] = {};
          }
          completionsMap[completion.practice_mission_id][completion.mission_index] = true;
        });
        setMissionCompletions(completionsMap);
      }

      // Fetch stats
      const statsParams = new URLSearchParams();
      if (activeJourneyId) {
        statsParams.append('journeyId', activeJourneyId);
      }
      const statsRes = await fetch(`${apiBase}/api/practice-missions/stats?${statsParams.toString()}`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setCompletionStats(statsData.stats);
      }
    } catch (err) {
      console.error('Failed to fetch completion data:', err);
    }
  }, [apiBase, user?.id, activeJourneyId]);

  const fetchPracticeMissions = useCallback(async (weakness, forceRefresh = false) => {
    const { key, label, current, trend, description } = weakness;

    // Use a ref-like pattern: check current state synchronously
    let shouldProceed = false;
    let alreadyHasMissions = false;

    // Check loading state
    setLoadingMissions(prev => {
      if (prev[key]) {
        // Already loading, don't proceed
        return prev;
      }
      shouldProceed = true;
      return { ...prev, [key]: true }; // Mark as loading
    });

    if (!shouldProceed) {
      console.log(`[PracticePage] Already loading missions for ${key}, skipping duplicate call`);
      return;
    }

    // Check if missions already exist (using functional state update)
    if (!forceRefresh) {
      setPracticeMissions(prev => {
        const existingMissions = prev[key];
        if (existingMissions) {
          const missionsArray = Array.isArray(existingMissions) ? existingMissions : existingMissions.missions;
          if (missionsArray && missionsArray.length > 0 && !existingMissions.isStale) {
            // Missions already exist and are valid, don't fetch
            alreadyHasMissions = true;
            return prev; // Return unchanged state
          }
        }
        return prev; // Continue with fetch
      });

      if (alreadyHasMissions) {
        // Reset loading state since we're not fetching
        setLoadingMissions(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
        return;
      }
    }

    setLoadingMissions(prev => ({ ...prev, [key]: true }));

    try {
      const response = await fetch(`${apiBase}/api/practice-missions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user?.id || ''
        },
        body: JSON.stringify({
          parameterKey: key,
          parameterLabel: label,
          parameterDescription: description || '',
          currentScore: current,
          journeyId: activeJourneyId,
          forceRegenerate: forceRefresh, // Regenerate if user clicks refresh
          userContext: {
            primaryGoal: focusSlug || 'confidence',
            confidenceLevel: activeJourney?.confidence_level || 'medium'
          },
          trend: trend ? {
            direction: trend.direction,
            change: trend.change
          } : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.missions && data.missions.length > 0) {
          const practiceMissionId = data.practiceMissionId || data.id;
          setPracticeMissions(prev => ({
            ...prev,
            [key]: {
              missions: data.missions,
              isStale: data.isStale || false,
              fromCache: data.fromCache || false,
              createdAt: data.createdAt,
              practiceMissionId: practiceMissionId,
              id: practiceMissionId
            }
          }));
          // Fetch completions for this mission after it's loaded
          if (practiceMissionId) {
            setTimeout(() => {
              fetchCompletionData();
            }, 300);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching practice missions:', err);
    } finally {
      setLoadingMissions(prev => ({ ...prev, [key]: false }));
    }
  }, [apiBase, user?.id, focusSlug, activeJourney, activeJourneyId, fetchCompletionData]);

  const fetchData = useCallback(async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const headers = {
        'X-Clerk-User-Id': user.id,
        'Content-Type': 'application/json'
      };

      // FIRST: Load existing practice missions from database BEFORE calculating weaknesses
      let loadedMissions = {};
      const missionsParams = new URLSearchParams();
      if (activeJourneyId) {
        missionsParams.append('journeyId', activeJourneyId);
      }
      const missionsRes = await fetch(`${apiBase}/api/practice-missions?${missionsParams.toString()}`, { headers });
      if (missionsRes.ok) {
        const missionsData = await missionsRes.json();
        if (missionsData.missions) {
          loadedMissions = missionsData.missions;
          setPracticeMissions(missionsData.missions);
        }
      }

      // Fetch action items
      const actionParams = new URLSearchParams({ status: 'pending' });
      if (activeJourneyId) {
        actionParams.append('journeyId', activeJourneyId);
      }
      const actionRes = await fetch(`${apiBase}/api/action-items?${actionParams.toString()}`, { headers });
      if (actionRes.ok) {
        const actionData = await actionRes.json();
        setActionItems(actionData.actionItems || []);
      }

      // Fetch metrics to calculate weaknesses
      const metricsParams = new URLSearchParams({ limit: '50' });
      if (activeJourneyId) {
        metricsParams.append('journeyId', activeJourneyId);
      }
      const metricsRes = await fetch(`${apiBase}/api/communication/metrics?${metricsParams.toString()}`, { headers });
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        const metricsList = metricsData.metrics || [];
        setMetrics(metricsList);

        // Calculate weaknesses
        if (metricsList.length > 0) {
          const latest = metricsList[metricsList.length - 1];
          const first = metricsList.length >= 2 ? metricsList[0] : null;
          const weaknessesList = [];

          Object.values(PARAMETER_CATEGORIES).forEach(category => {
            category.parameters.forEach(param => {
              const current = parseFloat(latest[param.key]) || 0;
              const firstValue = first ? (parseFloat(first[param.key]) || 0) : null;
              let isDeclining = false;

              if (first && metricsList.length >= 2 && firstValue !== null) {
                isDeclining = current < firstValue - 0.3;
              }

              if (current < 6.0 || isDeclining) {
                const trend = first && firstValue !== null ? {
                  direction: current < firstValue - 0.3 ? 'declining' : 'stable',
                  change: Math.abs(current - firstValue)
                } : null;

                weaknessesList.push({
                  key: param.key,
                  label: param.label,
                  description: param.description || '',
                  category: category.name,
                  categoryColor: category.color,
                  current,
                  isDeclining,
                  trend
                });
              }
            });
          });

          // Sort by severity
          weaknessesList.sort((a, b) => {
            if (a.isDeclining && !b.isDeclining) return -1;
            if (!a.isDeclining && b.isDeclining) return 1;
            return a.current - b.current;
          });

          // Filter by focus if specified, otherwise show top 2 by default (progressive disclosure)
          let filtered = focusFilter
            ? weaknessesList.filter(w => w.key === focusFilter)
            : weaknessesList;

          // IMPORTANT: Only show missions for parameters that are CURRENTLY weaknesses
          // This ensures missions are relevant to the user's current state
          setWeaknesses(filtered);

          // Note: Mission fetching is handled separately in a useEffect to avoid circular dependencies
          // We just set the weaknesses here, and another effect will handle fetching missions
        }
      }
    } catch (err) {
      console.error('Failed to fetch practice data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeJourneyId, apiBase, focusFilter]);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchCompletionData();
    } else {
      setLoading(false);
    }
  }, [user, activeJourneyId, fetchData, fetchCompletionData]);

  // Separate useEffect to fetch missions for weaknesses that don't have them
  // This runs when weaknesses change, but only fetches if missions don't exist
  useEffect(() => {
    if (!user?.id || weaknesses.length === 0) return;

    // Use a ref-like pattern: check current state and fetch only if needed
    weaknesses.forEach(weakness => {
      // Check if we already have valid missions for this weakness
      setPracticeMissions(prev => {
        const existing = prev[weakness.key];
        const hasValidMissions = existing && 
          Array.isArray(existing.missions) && 
          existing.missions.length > 0 && 
          !existing.isStale;
        
        // Only fetch if we don't have valid missions and we're not already loading
        if (!hasValidMissions && !loadingMissions[weakness.key]) {
          // Use setTimeout to avoid state updates during render
          setTimeout(() => {
            fetchPracticeMissions(weakness);
          }, 0);
        }
        return prev; // Don't modify state in this setter
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weaknesses, user?.id]); // Only depend on weaknesses, not practiceMissions or fetchPracticeMissions

  const handleMissionToggle = async (practiceMissionId, missionIndex, parameterKey, shouldComplete) => {
    if (!practiceMissionId || !user?.id) return;

    const key = `${practiceMissionId}-${missionIndex}`;
    setCompletingMission(prev => ({ ...prev, [key]: true }));

    try {
      const headers = {
        'X-Clerk-User-Id': user.id,
        'Content-Type': 'application/json'
      };

      if (shouldComplete) {
        const res = await fetch(`${apiBase}/api/practice-missions/complete`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            practiceMissionId,
            missionIndex,
            parameterKey,
            journeyId: activeJourneyId
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (!data.alreadyCompleted) {
            setMissionCompletions(prev => ({
              ...prev,
              [practiceMissionId]: {
                ...(prev[practiceMissionId] || {}),
                [missionIndex]: true
              }
            }));
            // Show celebration
            setCelebratingMission(`${practiceMissionId}-${missionIndex}`);
            setTimeout(() => setCelebratingMission(null), 2000);
            // Refresh stats
            fetchCompletionData();
          }
        }
      } else {
        const res = await fetch(`${apiBase}/api/practice-missions/uncomplete`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            practiceMissionId,
            missionIndex
          })
        });

        if (res.ok) {
          setMissionCompletions(prev => {
            const updated = { ...prev };
            if (updated[practiceMissionId]) {
              const missionCompletions = { ...updated[practiceMissionId] };
              delete missionCompletions[missionIndex];
              updated[practiceMissionId] = missionCompletions;
            }
            return updated;
          });
          // Refresh stats
          fetchCompletionData();
        }
      }
    } catch (err) {
      console.error('Failed to toggle mission completion:', err);
    } finally {
      setCompletingMission(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  };

  const formatActionDescription = (item) => {
    if (!item) return '';
    const details = item.details || {};

    if (typeof details === 'string') {
      return details;
    }

    const text =
      details.why_it_matters ||
      details.what_to_do ||
      (Array.isArray(details.all_details) ? details.all_details[0] : null) ||
      '';

    if (!text) {
      return 'Keep this focus in mind for your next recording.';
    }

    return text;
  };

  const formatMetricLabel = (metric) => {
    if (!metric) return 'Overall focus';
    const labels = {
      presence: 'Presence',
      voice_expression: 'Voice',
      clarity: 'Clarity',
      authenticity: 'Authenticity',
      impact: 'Impact',
      confidence: 'Confidence',
      overall: 'Overall'
    };
    return labels[metric] || 'Overall focus';
  };

  if (loading) {
    return (
      <div className="practicePage">
        <div className="practicePage__header">
          <h1 className="practicePage__title">Practice</h1>
          <p className="practicePage__subtitle">Loading your practice items...</p>
        </div>
        <div className="practicePage__skeleton">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="practicePage">
      {/* Header */}
      <div className="practicePage__header">
        <JourneySwitcher
          className="dashboard__journeyTabs practicePage__journeyTabs"
          journeys={journeys}
          journeysLoading={journeysLoading}
          activeJourneyId={activeJourneyId}
          onSelectJourney={onSelectJourney}
        />
        <h1 className="practicePage__title">Practice</h1>
        <p className="practicePage__subtitle">
          {focusLabel
            ? `Actionable steps to improve your ${focusLabel} communication`
            : 'Actionable steps to improve your communication'}
        </p>
        {focusGoalExplanation && (
          <p className="practicePage__subtitleSecondary">
            Today’s missions for {focusGoalExplanation.label.toLowerCase()} turn one small behavior into a concrete rep you can record and improve.
          </p>
        )}
      </div>

      {/* Hero Section */}
      <div className="practicePage__hero">
        <div className="practiceHero">
          <h2 className="practiceHero__title">What should I practice next?</h2>
          <p className="practiceHero__description">
            Use these tips and exercises to improve your communication skills. Apply action items in your next recording, and complete practice missions to strengthen your weakest areas.
          </p>
          {/* Completion Stats */}
          {completionStats && completionStats.totalMissions > 0 && (
            <div className="practiceHero__stats">
              <div className="practiceHero__stat">
                <div className="practiceHero__statValue">{completionStats.totalCompleted}</div>
                <div className="practiceHero__statLabel">Completed</div>
              </div>
              <div className="practiceHero__stat">
                <div className="practiceHero__statValue">{completionStats.totalMissions}</div>
                <div className="practiceHero__statLabel">Total Missions</div>
              </div>
              {completionStats.streakDays > 0 && (
                <div className="practiceHero__stat practiceHero__stat--streak">
                  <div className="practiceHero__statValue">🔥 {completionStats.streakDays}</div>
                  <div className="practiceHero__statLabel">Day Streak</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Items Section */}
      {actionItems.length > 0 && (
        <div className="practicePage__section">
          <div className="practiceSection__header">
            <MessageSquare size={24} className="practiceSection__icon" />
            <div>
              <h2 className="practiceSection__title">Tips from Your Analyses</h2>
              <p className="practiceSection__subtitle">
                <strong>Action Items:</strong> Apply these specific tips in your next recording or daily conversations. 
                These come directly from your video analyses.
              </p>
            </div>
          </div>
          <div className="actionItemsList">
            {actionItems.map((item, idx) => (
              <div key={item.id || idx} className="actionItemCard">
              <div className="actionItemCard__icon">
                  <Sparkles size={18} />
                </div>  
                <div className="actionItemCard__body">
                  <div className="actionItemCard__meta">
                    <span className="actionItemCard__chip">
                      {formatMetricLabel(item.practice_prompt_target_metric)}
                    </span>
                    <span className="actionItemCard__chip actionItemCard__chip--accent">
                      Active focus
                    </span>
                  </div>
                  <h3 className="actionItemCard__title">{item.title}</h3>
                  <p className="actionItemCard__description">
                    {formatActionDescription(item)}
                  </p>
                  {item.analyses && (
                    <div className="actionItemCard__meta">
                      Added {new Date(item.analyses.created_at).toLocaleDateString()} • {item.analyses.video_filename}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice Missions Section */}
      {weaknesses.length > 0 && (
        <div className="practicePage__section">
          <div className="practiceSection__header">
            <Target size={24} className="practiceSection__icon" />
            <div>
              <h2 className="practiceSection__title">Practice Exercises</h2>
              <p className="practiceSection__subtitle">
                <strong>Practice Missions:</strong> Step-by-step exercises to improve your weakest metrics. 
                These are AI-generated based on your current performance. Focus on the top priority first.
              </p>
            </div>
          </div>
          <div className="practiceMissionsList">
            {weaknesses.map((weakness, idx) => {
              const isPriority = idx === 0 && !focusFilter;
              const isExpanded = expandedWeaknesses.has(weakness.key);
              const shouldShow = focusFilter || idx < 2 || isExpanded;
              const category = Object.values(PARAMETER_CATEGORIES).find(cat =>
                cat.parameters.some(p => p.key === weakness.key)
              );

              if (!shouldShow) return null;

              return (
                <div 
                  key={idx} 
                  className={`practiceMissionCard ${isPriority ? 'practiceMissionCard--priority' : ''}`}
                >
                  {isPriority && (
                    <div className="practiceMissionCard__priorityBadge">
                      <Target size={14} />
                      <span>Priority Focus</span>
                    </div>
                  )}
                  <div className="practiceMissionCard__header">
                    <div className="practiceMissionCard__icon" style={{ backgroundColor: `${weakness.categoryColor}15`, color: weakness.categoryColor }}>
                      {React.createElement(category?.icon || AlertCircle, { size: 24 })}
                    </div>
                    <div className="practiceMissionCard__meta">
                      <div className="practiceMissionCard__metaTop">
                        <span className="practiceMissionCard__category">{weakness.category}</span>
                        {isPriority && (
                          <span className="practiceMissionCard__priorityTag">#1 Priority</span>
                        )}
                      </div>
                      <h3 className="practiceMissionCard__label">{weakness.label}</h3>
                      <div className="practiceMissionCard__score">
                        <span className="practiceMissionCard__scoreValue">{weakness.current.toFixed(1)}</span>
                        <span className="practiceMissionCard__scoreLabel">/ 10</span>
                        {weakness.isDeclining && (
                          <span className="practiceMissionCard__declining">
                            <TrendingDown size={14} />
                            Declining
                          </span>
                        )}
                      </div>
                      {/* Why This Matters */}
                      <div className="practiceMissionCard__whyMatters">
                        <strong>Why this matters:</strong>{' '}
                        {weakness.isDeclining 
                          ? `Your ${weakness.label.toLowerCase()} has been declining. Focusing here will help you get back on track.`
                          : `Improving your ${weakness.label.toLowerCase()} will strengthen your overall communication and help you achieve your goals.`
                        }
                      </div>
                    </div>
                    <button
                      type="button"
                      className="practiceMissionCard__refresh"
                      onClick={() => fetchPracticeMissions(weakness, true)}
                      disabled={loadingMissions[weakness.key]}
                      title="Generate new practice missions"
                    >
                      {loadingMissions[weakness.key] ? (
                        <>
                          <span className="practiceMissionCard__refreshSpinner">⟳</span>
                          <span className="practiceMissionCard__refreshLabel">Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span className="practiceMissionCard__refreshLabel">New Missions</span>
                        </>
                      )}
                    </button>
                  </div>
                  {(() => {
                    const missionData = practiceMissions[weakness.key];
                    const missionsArray = missionData 
                      ? (Array.isArray(missionData) ? missionData : missionData.missions)
                      : null;
                    const isStale = missionData && !Array.isArray(missionData) ? missionData.isStale : false;

                    if (loadingMissions[weakness.key] && (!missionsArray || missionsArray.length === 0)) {
                      return (
                        <div className="practiceMissionCard__loading">
                          <div className="practiceMissionCard__loadingSpinner"></div>
                          <p>Generating personalized practice steps...</p>
                        </div>
                      );
                    } else if (missionsArray && missionsArray.length > 0) {
                      return (
                        <>
                          {isStale && (
                            <div className="practiceMissionCard__staleBadge">
                              <AlertCircle size={14} />
                              <span>Based on older analysis - click refresh for updated missions</span>
                            </div>
                          )}
                          <ol className="practiceMissionCard__missions">
                            {missionsArray.map((mission, missionIdx) => {
                              const practiceMissionId = missionData.practiceMissionId || missionData.id;
                              const isCompleted = practiceMissionId && missionCompletions[practiceMissionId]?.[missionIdx];
                              const isCompleting = completingMission[`${practiceMissionId}-${missionIdx}`];
                              const isCelebrating = celebratingMission === `${practiceMissionId}-${missionIdx}`;
                              
                              return (
                                <li 
                                  key={missionIdx} 
                                  className={`practiceMissionCard__mission ${isCompleted ? 'practiceMissionCard__mission--completed' : ''} ${isCelebrating ? 'practiceMissionCard__mission--celebrating' : ''}`}
                                >
                                  <button
                                    type="button"
                                    className="practiceMissionCard__missionCheckbox"
                                    onClick={() => handleMissionToggle(practiceMissionId, missionIdx, weakness.key, !isCompleted)}
                                    disabled={isCompleting || !practiceMissionId}
                                    aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                                  >
                                    {isCompleting ? (
                                      <div className="practiceMissionCard__missionSpinner"></div>
                                    ) : isCompleted ? (
                                      <CheckCircle size={18} className="practiceMissionCard__missionIcon practiceMissionCard__missionIcon--completed" />
                                    ) : (
                                      <div className="practiceMissionCard__missionIcon practiceMissionCard__missionIcon--uncompleted" />
                                    )}
                                  </button>
                                  <span className={isCompleted ? 'practiceMissionCard__missionText--completed' : ''}>{mission}</span>
                                </li>
                              );
                            })}
                          </ol>
                          {/* Progress Bar */}
                          {(() => {
                            const practiceMissionId = missionData.practiceMissionId || missionData.id;
                            if (!practiceMissionId || !missionsArray) return null;
                            const completedCount = missionCompletions[practiceMissionId] 
                              ? Object.keys(missionCompletions[practiceMissionId]).length 
                              : 0;
                            const totalCount = missionsArray.length;
                            const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                            
                            return (
                              <div className="practiceMissionCard__progress">
                                <div className="practiceMissionCard__progressBar">
                                  <div 
                                    className="practiceMissionCard__progressFill"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="practiceMissionCard__progressText">
                                  {completedCount} of {totalCount} completed
                                </span>
                              </div>
                            );
                          })()}
                          <div className="practiceMissionCard__actions">
                            <button
                              className="btn btn--primary practiceMissionCard__practiceBtn"
                              onClick={() => navigate('/new-analysis')}
                            >
                              <Video size={16} />
                              Practice This Now
                            </button>
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <div className="practiceMissionCard__empty">
                          <p>Click the sparkle icon above to generate personalized practice missions</p>
                        </div>
                      );
                    }
                  })()}
                </div>
              );
            })}
            {/* Show More Button */}
            {!focusFilter && weaknesses.length > 2 && (
              <button
                className="practicePage__showMore"
                onClick={() => {
                  const newExpanded = new Set(expandedWeaknesses);
                  if (expandedWeaknesses.size === 0) {
                    // Expand all remaining
                    weaknesses.slice(2).forEach(w => newExpanded.add(w.key));
                  } else {
                    // Collapse all
                    newExpanded.clear();
                  }
                  setExpandedWeaknesses(newExpanded);
                }}
              >
                {expandedWeaknesses.size === 0 
                  ? `Show ${weaknesses.length - 2} more areas` 
                  : 'Show less'}
                <ArrowRight 
                  size={16} 
                  className={expandedWeaknesses.size > 0 ? 'rotated' : ''}
                  style={{ transform: expandedWeaknesses.size > 0 ? 'rotate(90deg)' : 'none' }}
                />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {actionItems.length === 0 && weaknesses.length === 0 && (
        <EmptyState
          variant="practice"
          title="Ready to practice?"
          description="Complete your first analysis to get personalized tips and practice exercises tailored to your communication goals."
          actionLabel="Start Your First Analysis"
          onAction={() => navigate('/new-analysis')}
        />
      )}

      {/* Floating Action Button */}
      {(actionItems.length > 0 || weaknesses.length > 0) && (
        <button
          className="practicePage__fab"
          onClick={() => navigate('/new-analysis')}
          title="Record a new practice video"
        >
          <Video size={24} />
          <span className="practicePage__fabLabel">Practice Now</span>
        </button>
      )}
    </div>
  );
}

