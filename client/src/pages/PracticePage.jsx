import React, { useState, useEffect, useMemo, useCallback } from 'react';
// BodAI Dojo Practice Page
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
  Play,
  X,
  Clock,
  Zap,
  Heart,
  Shield
} from 'lucide-react';
import './PracticePage.css';
import JourneySwitcher from '../components/JourneySwitcher';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonCard } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { getSmartDrills } from '../data/drillBank';

// --- Components ---

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
      // Map backend metric "presence_fidgeting" to the posture label
      { key: 'presence_fidgeting', label: t('parameters.presence.bodyPosture') },
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

const MissionModal = ({ mission, onClose, onStart, onCompleteManual, t }) => {
  if (!mission) return null;

  return (
    <div className="missionModal__overlay" onClick={onClose}>
      <div className="missionModal__content" onClick={e => e.stopPropagation()}>
        <div className="missionModal__header">
          {mission.icon && <span className="missionModal__headerIcon">{mission.icon}</span>}
          <h2 className="missionModal__title">{mission.title}</h2>
          <button className="missionModal__closeBtn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="missionModal__body">
          <div className="missionModal__description">
            {typeof mission.description === 'string' ? mission.description : ''}
          </div>
          
          {/* Rich Practice Prompt Sections */}
          {mission.isPracticePrompt && (
            <div className="missionModal__richContent">
              {mission.setup && (
                <div className="missionModal__section">
                  <h3>{t('practice.setup')}</h3>
                  <p>{mission.setup}</p>
                </div>
              )}
              
              {mission.whatToNotice && (
                <div className="missionModal__section">
                  <h3>{t('practice.whatToNotice')}</h3>
                  <p>{mission.whatToNotice}</p>
                </div>
              )}
              
              {mission.recordingTip && (
                <div className="missionModal__section">
                  <h3>{t('practice.recordingTip')}</h3>
                  <p>{mission.recordingTip}</p>
                </div>
              )}
            </div>
          )}

          {/* Meta Info (Time/Difficulty) - Show for all mission types if available */}
          {(mission.estimatedTime || mission.difficulty) && (
            <div className="missionModal__meta">
              {mission.estimatedTime && (
                <span className="missionModal__metaItem">
                  <Clock size={16} />
                  <span>{t('practice.estimatedTime')}: {mission.estimatedTime}</span>
                </span>
              )}
              {mission.difficulty && (
                <span className="missionModal__metaItem">
                  <Zap size={16} />
                  <span>{t('common.labels.difficulty')}: {t(`common.difficulty.${mission.difficulty}`, mission.difficulty || '')}</span>
                </span>
              )}
            </div>
          )}

          {mission.context && (
            <div className="missionModal__context">
              <strong>{t('practice.whyItMattersLabel')}</strong> {mission.context}
            </div>
          )}

          {mission.goal && (
            <div className="missionModal__context" style={{ marginTop: '16px' }}>
              <strong>{mission.goal}</strong>
            </div>
          )}
        </div>

        <div className="missionModal__footer">
          {mission.type !== 'drill' && (
            <button 
              className="btn btn--primary missionModal__startBtn" 
              onClick={() => onStart(mission)}
            >
              <Video size={20} />
              <span>{t('practice.readyForAnalysis') || "Ready for new analysis? Let's check improvement!"}</span>
            </button>
          )}
          
          <button 
            className="btn btn--ghost missionModal__completeBtn" 
            onClick={() => {
              if (mission.type === 'drill') {
                onClose();
              } else {
                onCompleteManual(mission);
              }
            }}
          >
            <CheckCircle size={20} />
            <span>{t('practice.didItThankYou') || "Did it, thank you!"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const FocusHeroCard = ({ mission, onOpenModal, t }) => {
  if (!mission) return (
    <div className="practiceHero practiceHero--empty">
      <div className="practiceHero__content">
        <div className="practiceHero__iconBox">
          <CheckCircle size={32} color="#10b981" />
        </div>
        <h2 className="practiceHero__title">{t('practice.allCaughtUp')}</h2>
        <p className="practiceHero__description">{t('practice.greatJob')}</p>
      </div>
    </div>
  );

  return (
    <div className="practiceHero practiceHero--focus">
      <div className="practiceHero__badge">
        <Target size={14} />
        <span>{t('practice.todaysFocus')}</span>
      </div>
      <h2 className="practiceHero__title">{mission.title}</h2>
      <p className="practiceHero__description">
        {typeof mission.description === 'string' ? mission.description : ''}
      </p>
      <div className="practiceHero__actions">
        <button className="btn btn--primary practiceHero__startBtn" onClick={() => onOpenModal(mission)}>
          <Play size={20} />
          <span>{t('practice.startSession')}</span>
        </button>
      </div>
    </div>
  );
};

const SkillStationCard = ({ station, onOpenModal, t }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = station.icon;
  const itemCount = station.items.length;

  return (
    <div className={`skillStation ${expanded ? 'skillStation--expanded' : ''}`}>
      <div className="skillStation__header" onClick={() => setExpanded(!expanded)}>
        <div className="skillStation__left">
          <div className="skillStation__icon" style={{ color: station.color, backgroundColor: `${station.color}15` }}>
            <Icon size={24} />
          </div>
          <div className="skillStation__info">
            <h3 className="skillStation__title">{station.label}</h3>
            <span className="skillStation__count">
              {itemCount} {itemCount === 1 ? t('practice.mission') : t('practice.missions')}
            </span>
          </div>
        </div>
        <div className={`skillStation__chevron ${expanded ? 'skillStation__chevron--expanded' : ''}`}>
          <ArrowRight size={20} />
        </div>
      </div>
      
      {expanded && (
        <div className="skillStation__content">
          {station.items.length > 0 ? (
            <ul className="skillStation__list">
              {station.items.map((item, idx) => (
                <li key={item.id || idx} className="skillStation__item" onClick={() => onOpenModal(item)}>
                  <div className="skillStation__itemContent">
                    <h4>{item.title}</h4>
                  </div>
                  <button className="skillStation__playBtn">
                    <Play size={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="skillStation__empty">
              <p>{t('practice.noMissions')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const WarmUpRow = ({ weaknesses, onOpenModal, t }) => {
  const drills = useMemo(() => getSmartDrills(weaknesses), [weaknesses]);

  const handleDrillClick = (drill) => {
    // Construct a "mission" object for the modal
    const instructionKey = drill.translationKey.replace('drills.', 'drillInstructions.');
    const goalKey = 'practice.drillInstructions.' + drill.id + '_goal';
    const mission = {
      type: 'drill',
      title: t(drill.translationKey),
      description: t('practice.drillInstructions.' + drill.id) || t(instructionKey), // Try both potential keys
      goal: t(goalKey) || null, // Goal and how it helps
      icon: drill.icon,
      estimatedTime: drill.duration.replace(/sec|min/g, (match) => {
        if (match === 'sec') return t('common.units.seconds') || 'sec';
        if (match === 'min') return t('common.units.minutes') || 'min';
        return match;
      }),
      setup: null, // Drills are simple
      isPracticePrompt: false, // Use simple display
      id: drill.id
    };
    onOpenModal(mission);
  };

  return (
    <div className="warmUpRow">
          <h3 className="warmUpRow__title">
            {t('practice.quickWarmups')}
          </h3>
      <div className="warmUpRow__list">
        {drills.map((drill, idx) => (
          <button 
            key={drill.id || idx} 
            className="warmUpCard" 
            onClick={() => handleDrillClick(drill)}
          >
            <span className="warmUpCard__icon">{drill.icon}</span>
            <div className="warmUpCard__info">
              <span className="warmUpCard__label">{t(drill.translationKey) || drill.id.replace(/_/g, ' ')}</span>
              <span className="warmUpCard__duration">
                <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                {drill.duration.replace(/sec|min/g, (match) => {
                  if (match === 'sec') return t('common.units.seconds') || 'sec';
                  if (match === 'min') return t('common.units.minutes') || 'min';
                  return match;
                })}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
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
  const { t, i18n } = useTranslation();
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
  const [selectedMission, setSelectedMission] = useState(null);

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
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

  // --- Dojo Logic Start ---

  // 1. Priority Mission Logic
  const priorityMission = useMemo(() => {
    // A. Check pending action items (most recent first)
    const pendingActions = actionItems.filter(item => item.status !== 'completed');
    if (pendingActions.length > 0) {
      // Sort by date descending (newest first)
      const topAction = pendingActions.sort((a, b) => 
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      )[0];

      // Check for Practice Prompt data
      const hasPracticePrompt = !!topAction.practice_prompt_title;

      return {
        type: 'action_item',
        title: hasPracticePrompt ? topAction.practice_prompt_title : topAction.title,
        description: hasPracticePrompt ? topAction.practice_prompt_description : formatActionDescription(topAction),
        // Rich prompt data
        setup: hasPracticePrompt ? topAction.practice_prompt_setup : null,
        whatToNotice: hasPracticePrompt ? topAction.practice_prompt_notice : null,
        recordingTip: hasPracticePrompt ? topAction.practice_prompt_tip : null,
        estimatedTime: hasPracticePrompt ? topAction.practice_prompt_time : null,
        difficulty: hasPracticePrompt ? topAction.practice_prompt_difficulty : null,
        isPracticePrompt: hasPracticePrompt,
        // Base item data
        item: topAction,
        id: topAction.id
      };
    }
    
    // B. Fallback to top weakness mission
    if (weaknesses.length > 0) {
      const topWeakness = weaknesses[0];
      const missionData = practiceMissions[topWeakness.key];
      const missionsArray = missionData ? (Array.isArray(missionData) ? missionData : missionData.missions) : [];
      
      if (missionData && missionsArray && missionsArray.length > 0) {
        // Find first uncompleted mission
        const practiceMissionId = missionData.practiceMissionId || missionData.id;
        if (practiceMissionId) {
          const uncompletedIndex = missionsArray.findIndex((_, idx) => 
            !missionCompletions[practiceMissionId]?.[idx]
          );
          
          if (uncompletedIndex !== -1) {
            return {
              type: 'weakness_mission',
              title: `${t('practice.improve')} ${topWeakness.label}`,
              description: missionsArray[uncompletedIndex],
              weakness: topWeakness,
              missionIndex: uncompletedIndex,
              practiceMissionId,
              id: `${practiceMissionId}-${uncompletedIndex}`
            };
          }
        }
      }
    }
    return null;
  }, [actionItems, weaknesses, practiceMissions, missionCompletions, t]);

  // 2. Station Grouping Logic
  const stations = useMemo(() => {
    // Define Stations
    const stationsMap = {
      voice: { 
        id: 'voice', 
        label: t('practice.stations.voice') || t('parameters.categories.voice'), 
        icon: MessageSquare, 
        color: '#3b82f6', 
        items: [] 
      },
      presence: { 
        id: 'presence', 
        label: t('practice.stations.presence') || t('parameters.categories.presence'), 
        icon: Eye, 
        color: '#10b981', 
        items: [] 
      },
      clarity: { 
        id: 'clarity', 
        label: t('practice.stations.clarity') || t('parameters.categories.clarity'), 
        icon: Sparkles, 
        color: '#f59e0b', 
        items: [] 
      },
      impact: { 
        id: 'impact', 
        label: t('practice.stations.impact') || t('parameters.categories.impact'), 
        icon: Target, 
        color: '#ef4444', 
        items: [] 
      },
      authenticity: {
        id: 'authenticity',
        label: t('practice.stations.authenticity') || t('parameters.categories.authenticity'),
        icon: Heart,
        color: '#8b5cf6',
        items: []
      },
      confidence: {
        id: 'confidence',
        label: t('practice.stations.confidence') || t('parameters.categories.confidence'),
        icon: Shield,
        color: '#06b6d4',
        items: []
      }
    };

    // Helper: Map metric to station
    const getStationId = (metric) => {
      if (!metric) return 'impact';
      const m = metric.toLowerCase();
      if (m.includes('voice') || m.includes('vocal') || m.includes('volume') || m.includes('pace') || m.includes('tone') || m.includes('articulation')) return 'voice';
      if (m.includes('presence') || m.includes('eye') || m.includes('posture') || m.includes('hand') || m.includes('physical')) return 'presence';
      if (m.includes('clarity') || m.includes('structure') || m.includes('focus') || m.includes('example') || m.includes('transition') || m.includes('repetition')) return 'clarity';
      if (m.includes('authenticity') || m.includes('naturalness') || m.includes('emotional') || m.includes('forced')) return 'authenticity';
      if (m.includes('confidence') || m.includes('filler') || m.includes('pause') || m.includes('tension') || m.includes('comfort') || m.includes('stability')) return 'confidence';
      if (m.includes('impact') || m.includes('energy') || m.includes('engagement') || m.includes('persuasiveness')) return 'impact';
      return 'impact';
    };

    // Populate with Action Items (Pending)
    actionItems.forEach(item => {
      if (item.status !== 'completed' && item.id !== priorityMission?.item?.id) {
        const stationId = getStationId(item.practice_prompt_target_metric);
        
        // Check for Practice Prompt data
        const hasPracticePrompt = !!item.practice_prompt_title;
        
        if (stationsMap[stationId]) {
          stationsMap[stationId].items.push({ 
            ...item,
            // Override or set derived fields
            title: hasPracticePrompt ? item.practice_prompt_title : item.title,
            description: hasPracticePrompt ? item.practice_prompt_description : formatActionDescription(item),
            // Rich prompt data
            setup: hasPracticePrompt ? item.practice_prompt_setup : null,
            whatToNotice: hasPracticePrompt ? item.practice_prompt_notice : null,
            recordingTip: hasPracticePrompt ? item.practice_prompt_tip : null,
            estimatedTime: hasPracticePrompt ? item.practice_prompt_time : null,
            difficulty: hasPracticePrompt ? item.practice_prompt_difficulty : null,
            isPracticePrompt: hasPracticePrompt,
            
            type: 'action_item',
            stationId 
          });
        }
      }
    });

    // Populate with Weakness Missions
    weaknesses.forEach(w => {
      const stationId = getStationId(w.key);
      if (stationsMap[stationId]) {
        const missionData = practiceMissions[w.key];
        const missionsArray = missionData ? (Array.isArray(missionData) ? missionData : missionData.missions) : [];
        if (missionData && missionsArray) {
           const pId = missionData.practiceMissionId || missionData.id;
           if (pId) {
             missionsArray.forEach((m, idx) => {
               // Skip completed
               if (!missionCompletions[pId]?.[idx]) {
                  // Skip if it's the priority mission
                  if (priorityMission?.type === 'weakness_mission' && 
                      priorityMission.practiceMissionId === pId && 
                      priorityMission.missionIndex === idx) {
                    return;
                  }

                  stationsMap[stationId].items.push({
                    type: 'weakness_mission',
                    title: m,
                    weakness: w,
                    missionIndex: idx,
                    practiceMissionId: pId,
                    stationId,
                    id: `${pId}-${idx}`
                  });
               }
             });
           }
        }
      }
    });

    return Object.values(stationsMap);
  }, [actionItems, weaknesses, practiceMissions, missionCompletions, priorityMission, t]);

  // --- Dojo Logic End ---

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
            confidenceLevel: activeJourney?.confidence_level || 'medium',
            language: i18n.language || 'en' // Pass current language from i18n
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
        // Filter to include only real action items (exclude quick wins and recording notes)
        const filteredItems = (actionData.actionItems || []).filter(item => 
          !item.item_type || item.item_type === 'tip' || item.item_type === 'action_item'
        );
        setActionItems(filteredItems);
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

          // IMPORTANT: Only generate missions for the top 2 weakest parameters
          // Filter by focus if specified, otherwise limit to top 2 weakest
          let filtered = focusFilter
            ? weaknessesList.filter(w => w.key === focusFilter)
            : weaknessesList.slice(0, 2); // Only take the top 2 weakest parameters

          // IMPORTANT: Only show missions for parameters that are CURRENTLY weaknesses
          // This ensures missions are relevant to the user's current state
          // Missions will only be generated for these filtered weaknesses (max 2)
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
  // Optimized to fetch in parallel instead of sequential waterfalls
  useEffect(() => {
    if (!user?.id || weaknesses.length === 0) return;

    const fetchMissing = async () => {
      // Identify which weaknesses need fetching
      const toFetch = weaknesses.filter(weakness => {
        const existing = practiceMissions[weakness.key];
        const hasValidMissions = existing && 
          Array.isArray(existing.missions) && 
          existing.missions.length > 0 && 
          !existing.isStale;
        
        // Only fetch if we don't have valid missions and not currently loading
        return !hasValidMissions && !loadingMissions[weakness.key];
      });

      if (toFetch.length === 0) return;

      // Mark all as loading immediately to prevent duplicate calls
      setLoadingMissions(prev => {
        const next = { ...prev };
        toFetch.forEach(w => next[w.key] = true);
        return next;
      });

      // Execute all fetches in parallel
      await Promise.all(toFetch.map(weakness => fetchPracticeMissions(weakness)));
    };

    fetchMissing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weaknesses, user?.id]);

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

  const handleManualCompletion = async (mission) => {
    // If it's an action item (from skill stations or priority)
    if (mission.type === 'action_item') {
      try {
        // Close modal; no alert, same as dismiss
        setSelectedMission(null);
      } catch (err) {
        console.error("Failed to complete action item", err);
      }
    } 
    // If it's a weakness mission
    else if (mission.type === 'weakness_mission') {
      try {
        const { practiceMissionId, missionIndex, weakness } = mission;
        await handleMissionToggle(practiceMissionId, missionIndex, weakness.key, true);
        setSelectedMission(null);
      } catch (err) {
        console.error("Failed to complete mission", err);
      }
    }
    // Default: just close the modal
    else {
      setSelectedMission(null);
    }
  };

  const handleStartMission = (mission) => {
    navigate('/new-analysis', { 
      state: { 
        practiceMode: true,
        missionTitle: mission.title,
        missionDescription: typeof mission.description === 'string' ? mission.description : '',
        missionId: mission.id 
      } 
    });
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
      </div>

      <div className="practicePage__content">
        {/* 1. Dojo Hero: Daily Focus */}
        <section className="practicePage__heroSection">
          <FocusHeroCard 
            mission={priorityMission} 
            onOpenModal={setSelectedMission} 
            t={t} 
          />
        </section>

        {/* 2. Warm Up Zone */}
        <section className="practicePage__warmUpSection">
          <WarmUpRow 
            weaknesses={weaknesses} 
            onOpenModal={setSelectedMission} 
            t={t} 
          />
        </section>

        {/* 3. Skill Stations */}
        <section className="practicePage__stationsSection">
          <h2 className="practicePage__sectionTitle">
            {t('practice.skillStations')}
          </h2>
          <div className="stationsGrid">
            {stations.map(station => (
              <SkillStationCard 
                key={station.id} 
                station={station} 
                onOpenModal={setSelectedMission} 
                t={t} 
              />
            ))}
          </div>
        </section>
      </div>

      {/* Floating Action Button */}
      <button
        className="practicePage__fab"
        onClick={() => navigate('/new-analysis')}
        title={t('practice.fabTitle')}
      >
        <Video size={24} />
      </button>

      {/* Mission Modal */}
      {selectedMission && (
        <MissionModal 
          mission={selectedMission} 
          onClose={() => setSelectedMission(null)} 
          onStart={handleStartMission} 
          onCompleteManual={handleManualCompletion} 
          t={t} 
        />
      )}
    </div>
  );
}
