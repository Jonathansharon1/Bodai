import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
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

// Helper function to get parameter categories with translations
const getParameterCategories = (t) => ({
  voice: {
    name: t('parameters.categories.voice'),
    icon: MessageSquare,
    color: '#3b82f6',
    parameters: [
      { key: 'voice_volume_stability', label: t('parameters.voice.volumeStability') },
      { key: 'voice_tone_variation', label: t('parameters.voice.toneVariation') },
      { key: 'voice_pace_control', label: t('parameters.voice.paceControl') },
      { key: 'voice_articulation', label: t('parameters.voice.articulation') },
      { key: 'voice_warmth', label: t('parameters.voice.vocalWarmth') }
    ]
  },
  presence: {
    name: t('parameters.categories.presence'),
    icon: Eye,
    color: '#10b981',
    parameters: [
      { key: 'presence_eye_contact', label: t('parameters.presence.eyeContact') },
      { key: 'presence_facial_relaxation', label: t('parameters.presence.facialRelaxation') },
      { key: 'presence_body_posture', label: t('parameters.presence.bodyPosture') },
      { key: 'presence_hand_naturalness', label: t('parameters.presence.handNaturalness') },
      { key: 'presence_openness', label: t('parameters.presence.openness') }
    ]
  },
  clarity: {
    name: t('parameters.categories.clarity'),
    icon: MessageSquare,
    color: '#f59e0b',
    parameters: [
      { key: 'clarity_structure', label: t('parameters.clarity.structure') },
      { key: 'clarity_focus', label: t('parameters.clarity.focus') },
      { key: 'clarity_example_usage', label: t('parameters.clarity.exampleUsage') },
      { key: 'clarity_transition_quality', label: t('parameters.clarity.transitionQuality') },
      { key: 'clarity_repetition_control', label: t('parameters.clarity.repetitionControl') }
    ]
  },
  authenticity: {
    name: t('parameters.categories.authenticity'),
    icon: MessageSquare,
    color: '#8b5cf6',
    parameters: [
      { key: 'authenticity_naturalness', label: t('parameters.authenticity.naturalness') },
      { key: 'authenticity_emotional_transparency', label: t('parameters.authenticity.emotionalTransparency') },
      { key: 'authenticity_forced_expression_reduction', label: t('parameters.authenticity.forcedExpressionReduction') }
    ]
  },
  impact: {
    name: t('parameters.categories.impact'),
    icon: MessageSquare,
    color: '#ef4444',
    parameters: [
      { key: 'impact_energy', label: t('parameters.impact.energy') },
      { key: 'impact_engagement', label: t('parameters.impact.engagement') },
      { key: 'impact_persuasiveness', label: t('parameters.impact.persuasiveness') }
    ]
  },
  confidence: {
    name: t('parameters.categories.confidence'),
    icon: MessageSquare,
    color: '#06b6d4',
    parameters: [
      { key: 'confidence_filler_word_control', label: t('parameters.confidence.fillerWordControl') },
      { key: 'confidence_pause_control', label: t('parameters.confidence.pauseControl') },
      { key: 'confidence_physical_tension', label: t('parameters.confidence.physicalTension') },
      { key: 'confidence_vocal_stability', label: t('parameters.confidence.vocalStability') },
      { key: 'confidence_comfort_level', label: t('parameters.confidence.comfortLevel') }
    ]
  }
});

export default function PracticePage({
  journeys = [],
  journeysLoading = false,
  activeJourneyId = null,
  onSelectJourney
}) {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  // Memoize translated parameter categories
  const PARAMETER_CATEGORIES = useMemo(() => getParameterCategories(t), [t]);
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
      'confidence': t('myProgress.goals.confidence'),
      'content': t('myProgress.goals.content'),
      'presentation': t('myProgress.goals.presentation'),
      'leadership': t('myProgress.goals.leadership'),
      'interview': t('myProgress.goals.interview'),
      'sales': t('myProgress.goals.sales'),
      'dating': t('myProgress.goals.dating'),
      'social': t('myProgress.goals.social'),
      'general': t('myProgress.goals.general')
    };
    return goalMap[goal] || goal;
  };

  const focusSlug = activeJourney?.focus_slug;
  const focusLabel = focusSlug ? getGoalLabel(focusSlug) : (activeJourney?.display_name || activeJourney?.focus_label || null);
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
  }, [user?.id, activeJourneyId, apiBase, focusFilter, PARAMETER_CATEGORIES]);

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
      return t('dashboard.noActionDescription', 'Keep this focus in mind for your next recording.');
    }

    return text;
  };

  const formatMetricLabel = (metric) => {
    if (!metric) return t('parameters.metrics.overall');
    const labels = {
      presence: t('parameters.metrics.presence'),
      voice_expression: t('parameters.metrics.voice'),
      clarity: t('parameters.metrics.clarity'),
      authenticity: t('parameters.metrics.authenticity'),
      impact: t('parameters.metrics.impact'),
      confidence: t('parameters.metrics.confidence'),
      overall: t('parameters.metrics.overall')
    };
    return labels[metric] || t('parameters.metrics.overall');
  };

  if (loading) {
    return (
      <div className="practicePage">
        <div className="practicePage__header">
          <h1 className="practicePage__title">{t('practice.loadingTitle')}</h1>
          <p className="practicePage__subtitle">{t('practice.loadingSubtitle')}</p>
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
        <h1 className="practicePage__title">{t('practice.title')}</h1>
        <p className="practicePage__subtitle">
          {focusLabel
            ? t('practice.subtitleWithFocus', { focusLabel })
            : t('practice.subtitle')}
        </p>
        {focusLabel && (
          <p className="practicePage__subtitleSecondary">
            {t('practice.subtitleSecondary', {
              goal: focusLabel.toLowerCase()
            })}
          </p>
        )}
      </div>

      {/* Hero Section */}
      <div className="practicePage__hero">
        <div className="practiceHero">
          <h2 className="practiceHero__title">{t('practice.heroTitle')}</h2>
          <p className="practiceHero__description">
            {t('practice.heroDescription')}
          </p>
          {/* Completion Stats */}
          {completionStats && completionStats.totalMissions > 0 && (
            <div className="practiceHero__stats">
              <div className="practiceHero__stat">
                <div className="practiceHero__statValue">{completionStats.totalCompleted}</div>
                <div className="practiceHero__statLabel">{t('practice.heroCompletedLabel')}</div>
              </div>
              <div className="practiceHero__stat">
                <div className="practiceHero__statValue">{completionStats.totalMissions}</div>
                <div className="practiceHero__statLabel">{t('practice.heroTotalMissionsLabel')}</div>
              </div>
              {completionStats.streakDays > 0 && (
                <div className="practiceHero__stat practiceHero__stat--streak">
                  <div className="practiceHero__statValue">🔥 {completionStats.streakDays}</div>
                  <div className="practiceHero__statLabel">{t('practice.heroDayStreakLabel')}</div>
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
              <h2 className="practiceSection__title">{t('practice.tipsSectionTitle')}</h2>
              <p className="practiceSection__subtitle" dangerouslySetInnerHTML={{ __html: t('practice.tipsSectionSubtitle') }} />
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
                      {t('practice.tipsActiveFocusChip')}
                    </span>
                  </div>
                  <h3 className="actionItemCard__title">{item.title}</h3>
                  <p className="actionItemCard__description">
                    {formatActionDescription(item)}
                  </p>
                  {item.analyses && (
                    <div className="actionItemCard__meta">
                      {t('practice.tipsAddedMeta', {
                        date: new Date(item.analyses.created_at).toLocaleDateString(undefined, { locale: useTranslation.language }),
                        filename: item.analyses.video_filename
                      })}
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
              <h2 className="practiceSection__title">{t('practice.practiceSectionTitle')}</h2>
              <p className="practiceSection__subtitle" dangerouslySetInnerHTML={{ __html: t('practice.practiceSectionSubtitle') }} />
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
                      <span>{t('practice.priorityBadge')}</span>
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
                          <span className="practiceMissionCard__priorityTag">{t('practice.priorityTag')}</span>
                        )}
                      </div>
                      <h3 className="practiceMissionCard__label">{weakness.label}</h3>
                      <div className="practiceMissionCard__score">
                        <span className="practiceMissionCard__scoreValue">{weakness.current.toFixed(1)}</span>
                        <span className="practiceMissionCard__scoreLabel">{t('practice.scoreLabel')}</span>
                        {weakness.isDeclining && (
                          <span className="practiceMissionCard__declining">
                            <TrendingDown size={14} />
                            {t('practice.decliningLabel')}
                          </span>
                        )}
                      </div>
                      {/* Why This Matters */}
                      <div className="practiceMissionCard__whyMatters">
                        <strong>{t('practice.whyThisMattersLabel')}</strong>{' '}
                        {weakness.isDeclining 
                          ? t('practice.whyThisMattersDeclining', { label: weakness.label.toLowerCase() })
                          : t('practice.whyThisMattersImproving', { label: weakness.label.toLowerCase() })}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="practiceMissionCard__refresh"
                      onClick={() => fetchPracticeMissions(weakness, true)}
                      disabled={loadingMissions[weakness.key]}
                      title={t('practice.refreshTitle')}
                    >
                      {loadingMissions[weakness.key] ? (
                        <>
                          <span className="practiceMissionCard__refreshSpinner">⟳</span>
                          <span className="practiceMissionCard__refreshLabel">{t('practice.refreshGenerating')}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span className="practiceMissionCard__refreshLabel">{t('practice.refreshNewMissions')}</span>
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
                          <p>{t('practice.generatingMissions')}</p>
                        </div>
                      );
                    } else if (missionsArray && missionsArray.length > 0) {
                      return (
                        <>
                          {isStale && (
                            <div className="practiceMissionCard__staleBadge">
                              <AlertCircle size={14} />
                              <span>{t('practice.staleBadge')}</span>
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
                                  {t('practice.progressText', { completed: completedCount, total: totalCount })}
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
                              {t('practice.practiceNowCta')}
                            </button>
                          </div>
                        </>
                      );
                    } else {
                      return (
                        <div className="practiceMissionCard__empty">
                          <p>{t('practice.emptyMissions')}</p>
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
                  ? t('practice.showMoreAreas', { count: weaknesses.length - 2 })
                  : t('practice.showLessAreas')}
                <ArrowRight 
                  size={16} 
                  className={`practicePage__showMoreIcon ${expandedWeaknesses.size > 0 ? 'practicePage__showMoreIcon--expanded' : ''}`}
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
          title={t('practice.emptyStateTitle')}
          description={t('practice.emptyStateDescription')}
          actionLabel={t('practice.emptyStateAction')}
          onAction={() => navigate('/new-analysis')}
        />
      )}

      {/* Floating Action Button */}
      {(actionItems.length > 0 || weaknesses.length > 0) && (
        <button
          className="practicePage__fab"
          onClick={() => navigate('/new-analysis')}
          title={t('practice.fabTitle')}
        >
          <Video size={24} />
          <span className="practicePage__fabLabel">{t('practice.fabLabel')}</span>
        </button>
      )}
    </div>
  );
}
