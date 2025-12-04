import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Award,
  Target,
  Eye,
  Mic,
  MessageSquare,
  Heart,
  Zap,
  BarChart3,
  Star,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import './MyProgressPage.css';
import JourneySwitcher from '../components/JourneySwitcher';
import PracticeCommitmentAlert from '../components/PracticeCommitmentAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

// Helper function to get KPI fields with translations
const getKPIFields = (t) => [
  { key: 'overall_score', label: t('parameters.metrics.overallScore'), description: t('parameters.descriptions.overallScore'), accent: '#0ea5e9' },
  { key: 'presence', label: t('parameters.metrics.presence'), description: t('parameters.descriptions.presence'), accent: '#10b981' },
  { key: 'voice_expression', label: t('parameters.metrics.voice'), description: t('parameters.descriptions.voice'), accent: '#3b82f6' },
  { key: 'clarity', label: t('parameters.metrics.clarity'), description: t('parameters.descriptions.clarity'), accent: '#f97316' }
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

// Helper function to get parameter categories with translations
const getParameterCategories = (t) => ({
  voice: {
    name: t('parameters.categories.voice'),
    icon: Mic,
    color: '#3b82f6',
    parameters: [
      { key: 'voice_volume_stability', label: t('parameters.voice.volumeStability'), description: t('parameters.voice.volumeStabilityDesc') },
      { key: 'voice_tone_variation', label: t('parameters.voice.toneVariation'), description: t('parameters.voice.toneVariationDesc') },
      { key: 'voice_pace_control', label: t('parameters.voice.paceControl'), description: t('parameters.voice.paceControlDesc') },
      { key: 'voice_articulation', label: t('parameters.voice.articulation'), description: t('parameters.voice.articulationDesc') },
      { key: 'voice_warmth', label: t('parameters.voice.vocalWarmth'), description: t('parameters.voice.vocalWarmthDesc') }
    ]
  },
  presence: {
    name: t('parameters.categories.presence'),
    icon: Eye,
    color: '#10b981',
    parameters: [
      { key: 'presence_eye_contact', label: t('parameters.presence.eyeContact'), description: t('parameters.presence.eyeContactDesc') },
      { key: 'presence_facial_relaxation', label: t('parameters.presence.facialRelaxation'), description: t('parameters.presence.facialRelaxationDesc') },
      { key: 'presence_body_posture', label: t('parameters.presence.bodyPosture'), description: t('parameters.presence.bodyPostureDesc') },
      { key: 'presence_hand_naturalness', label: t('parameters.presence.handNaturalness'), description: t('parameters.presence.handNaturalnessDesc') },
      { key: 'presence_openness', label: t('parameters.presence.openness'), description: t('parameters.presence.opennessDesc') }
    ]
  },
  clarity: {
    name: t('parameters.categories.clarity'),
    icon: MessageSquare,
    color: '#f59e0b',
    parameters: [
      { key: 'clarity_structure', label: t('parameters.clarity.structure'), description: t('parameters.clarity.structureDesc') },
      { key: 'clarity_focus', label: t('parameters.clarity.focus'), description: t('parameters.clarity.focusDesc') },
      { key: 'clarity_example_usage', label: t('parameters.clarity.exampleUsage'), description: t('parameters.clarity.exampleUsageDesc') },
      { key: 'clarity_transition_quality', label: t('parameters.clarity.transitionQuality'), description: t('parameters.clarity.transitionQualityDesc') },
      { key: 'clarity_repetition_control', label: t('parameters.clarity.repetitionControl'), description: t('parameters.clarity.repetitionControlDesc') }
    ]
  },
  authenticity: {
    name: t('parameters.categories.authenticity'),
    icon: Heart,
    color: '#8b5cf6',
    parameters: [
      { key: 'authenticity_naturalness', label: t('parameters.authenticity.naturalness'), description: t('parameters.authenticity.naturalnessDesc') },
      { key: 'authenticity_emotional_transparency', label: t('parameters.authenticity.emotionalTransparency'), description: t('parameters.authenticity.emotionalTransparencyDesc') },
      { key: 'authenticity_forced_expression_reduction', label: t('parameters.authenticity.forcedExpressionReduction'), description: t('parameters.authenticity.forcedExpressionReductionDesc') }
    ]
  },
  impact: {
    name: t('parameters.categories.impact'),
    icon: Zap,
    color: '#ef4444',
    parameters: [
      { key: 'impact_energy', label: t('parameters.impact.energy'), description: t('parameters.impact.energyDesc') },
      { key: 'impact_engagement', label: t('parameters.impact.engagement'), description: t('parameters.impact.engagementDesc') },
      { key: 'impact_persuasiveness', label: t('parameters.impact.persuasiveness'), description: t('parameters.impact.persuasivenessDesc') }
    ]
  },
  confidence: {
    name: t('parameters.categories.confidence'),
    icon: Award,
    color: '#06b6d4',
    parameters: [
      { key: 'confidence_filler_word_control', label: t('parameters.confidence.fillerWordControl'), description: t('parameters.confidence.fillerWordControlDesc') },
      { key: 'confidence_pause_control', label: t('parameters.confidence.pauseControl'), description: t('parameters.confidence.pauseControlDesc') },
      { key: 'confidence_physical_tension', label: t('parameters.confidence.physicalTension'), description: t('parameters.confidence.physicalTensionDesc') },
      { key: 'confidence_vocal_stability', label: t('parameters.confidence.vocalStability'), description: t('parameters.confidence.vocalStabilityDesc') },
      { key: 'confidence_comfort_level', label: t('parameters.confidence.comfortLevel'), description: t('parameters.confidence.comfortLevelDesc') }
    ]
  }
});

// Generate narrative explanation for improvements
const generateImprovementNarrative = (param, improvement, t) => {
  const change = improvement.change;
  
  const narratives = {
    'presence_eye_contact': t('myProgress.narratives.improvement.presence_eye_contact', { first: improvement.first.toFixed(1), latest: improvement.latest.toFixed(1) }),
    'confidence_filler_word_control': t('myProgress.narratives.improvement.confidence_filler_word_control', { change: Math.abs(change).toFixed(1) }),
    'voice_tone_variation': t('myProgress.narratives.improvement.voice_tone_variation', { first: improvement.first.toFixed(1), latest: improvement.latest.toFixed(1) }),
    'presence_body_posture': t('myProgress.narratives.improvement.presence_body_posture', { change: change.toFixed(1) }),
    'clarity_structure': t('myProgress.narratives.improvement.clarity_structure', { first: improvement.first.toFixed(1), latest: improvement.latest.toFixed(1) }),
    'impact_energy': t('myProgress.narratives.improvement.impact_energy', { change: change.toFixed(1) })
  };

  return narratives[param.key] || t('myProgress.narratives.improvement.default', { label: param.label.toLowerCase(), first: improvement.first.toFixed(1), latest: improvement.latest.toFixed(1), description: param.description.toLowerCase() });
};

// Generate narrative explanation for weaknesses
const generateWeaknessNarrative = (param, current, trend, t) => {
  const narratives = {
    'confidence_filler_word_control': t('myProgress.narratives.weakness.confidence_filler_word_control', { current: current.toFixed(1) }),
    'presence_eye_contact': t('myProgress.narratives.weakness.presence_eye_contact', { current: current.toFixed(1) }),
    'voice_tone_variation': t('myProgress.narratives.weakness.voice_tone_variation', { current: current.toFixed(1) }),
    'clarity_structure': t('myProgress.narratives.weakness.clarity_structure', { current: current.toFixed(1) }),
    'impact_energy': t('myProgress.narratives.weakness.impact_energy', { current: current.toFixed(1) }),
    'presence_body_posture': t('myProgress.narratives.weakness.presence_body_posture', { current: current.toFixed(1) })
  };

  if (narratives[param.key]) {
    return narratives[param.key];
  }

  if (trend && trend.direction === 'declining') {
    return t('myProgress.narratives.weakness.defaultDeclining', { label: param.label.toLowerCase(), current: current.toFixed(1), description: param.description });
  }
  
  return t('myProgress.narratives.weakness.defaultStable', { label: param.label.toLowerCase(), current: current.toFixed(1), description: param.description });
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const STREAK_BREAK_WINDOW_DAYS = 7;

const computeWeekStart = (date) => {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  const day = clone.getDay();
  const diff = (day + 6) % 7; // treat Monday as week start
  clone.setDate(clone.getDate() - diff);
  return clone.getTime();
};

const computeStreakInfo = (entries, getTimestamp) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { weeks: 0, daysSinceLast: null, daysUntilBreak: null, warning: false };
  }

  const orderedDates = entries
    .map((entry) => {
      const ts = getTimestamp(entry);
      const date = ts ? new Date(ts) : null;
      return date && !Number.isNaN(date.getTime()) ? date : null;
    })
    .filter(Boolean)
    .sort((a, b) => b - a);

  if (!orderedDates.length) {
    return { weeks: 0, daysSinceLast: null, daysUntilBreak: null, warning: false };
  }

  const weekBuckets = [];
  orderedDates.forEach((date) => {
    const weekStart = computeWeekStart(date);
    if (!weekBuckets.includes(weekStart)) {
      weekBuckets.push(weekStart);
    }
  });

  let streak = 0;
  let anchor = null;
  weekBuckets.forEach((weekStart, index) => {
    if (index === 0) {
      streak = 1;
      anchor = weekStart;
      return;
    }
    const diffDays = (anchor - weekStart) / DAY_IN_MS;
    if (diffDays <= STREAK_BREAK_WINDOW_DAYS) {
      streak += 1;
      anchor = weekStart;
    }
  });

  const lastDate = orderedDates[0];
  const daysSinceLast = (Date.now() - lastDate.getTime()) / DAY_IN_MS;
  const daysUntilBreak = Math.max(0, STREAK_BREAK_WINDOW_DAYS - daysSinceLast);

  return {
    weeks: streak,
    daysSinceLast,
    daysUntilBreak,
    warning: daysUntilBreak <= 2
  };
};

const computeCohortPercentile = (score) => {
  if (typeof score !== 'number' || Number.isNaN(score)) return null;
  return Math.min(95, Math.max(5, Math.round((score / 10) * 100)));
};

export default function MyProgressPage({
  journeys = [],
  journeysLoading = false,
  activeJourneyId = null,
  onSelectJourney,
  refreshTrigger
}) {
  const { user } = useUser();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    guide: false,
    improvements: false,
    strengths: false,
    complete: false
  });
  const [reflections, setReflections] = useState([]);

  // Memoize translated parameter categories and fields
  const PARAMETER_CATEGORIES = useMemo(() => getParameterCategories(t), [t]);
  const KPI_FIELDS = useMemo(() => getKPIFields(t), [t]);
  const PRACTICE_METRIC_LABELS = useMemo(() => getPracticeMetricLabels(t), [t]);

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

  const getStageLabel = (title) => {
    if (!title) return t('myProgress.defaultStage');
    
    // Map stage titles (like "Confident Communicator") to translation keys
    const stageMap = {
      'Emerging Communicator': t('myProgress.stages.Emerging Communicator', { defaultValue: t('myProgress.stages.emerging') }),
      'Developing Communicator': t('myProgress.stages.Developing Communicator', { defaultValue: t('myProgress.stages.developing') }),
      'Confident Communicator': t('myProgress.stages.Confident Communicator', { defaultValue: t('myProgress.stages.confident') }),
      'Impactful Communicator': t('myProgress.stages.Impactful Communicator', { defaultValue: t('myProgress.stages.impactful') }),
      'Master Communicator': t('myProgress.stages.Master Communicator', { defaultValue: t('myProgress.stages.master') })
    };
    
    if (stageMap[title]) {
      return stageMap[title];
    }
    
    // Map known goal titles to translation keys (for backward compatibility)
    const titleMap = {
      'Build Confidence': t('myProgress.goals.confidence'),
      'Content Creator': t('myProgress.goals.content'),
      'Presentation Skills': t('myProgress.goals.presentation'),
      'Executive Presence': t('myProgress.goals.leadership'),
      'Job Interviews': t('myProgress.goals.interview'),
      'Face-to-face Sales': t('myProgress.goals.sales'),
      'Dating & Romantic': t('myProgress.goals.dating'),
      'Social Confidence': t('myProgress.goals.social'),
      'General Improvement': t('myProgress.goals.general'),
      'Practice': t('myProgress.defaultStage')
    };

    return titleMap[title] || title;
  };
  
  const focusSlug = activeJourney?.focus_slug;
  const focusLabel = focusSlug ? getGoalLabel(focusSlug) : (activeJourney?.display_name || activeJourney?.focus_label || null);
  
  // Only show secondary subtitle for standard goals that have specific guidance
  const showGoalGuidance = focusSlug && ['confidence', 'content', 'presentation', 'leadership', 'interview', 'sales', 'dating', 'social', 'general'].includes(focusSlug);
  
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchProgressData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Clear and refetch data when activeJourneyId changes (journey switching)
  useEffect(() => {
    if (user && activeJourneyId !== null) {
      // Clear existing data immediately to avoid showing stale data
      setMetrics([]);
      setReflections([]);
      setLoading(true);
      // Fetch new data for the selected journey
      fetchProgressData();
    }
  }, [activeJourneyId, user]);

  // Refresh when refreshTrigger changes (after new analysis)
  useEffect(() => {
    if (user && refreshTrigger !== undefined) {
      // Add a small delay to ensure backend has saved the data
      const timeoutId = setTimeout(() => {
        fetchProgressData();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [refreshTrigger, user, activeJourneyId]);

  // Refresh when navigating to My Progress page (both /grades and /my-progress routes)
  useEffect(() => {
    if (user && (location.pathname === '/my-progress' || location.pathname === '/grades')) {
      // Add a small delay to ensure backend has saved the data
      const timeoutId = setTimeout(() => {
        fetchProgressData();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname, user, activeJourneyId]);


  const fetchReflections = async (headers) => {
    try {
      const params = new URLSearchParams({ limit: 10 });
      if (activeJourneyId) {
        params.append('journeyId', activeJourneyId);
      }
      const res = await fetch(
        `${apiBase}/api/reflections?${params.toString()}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        setReflections(Array.isArray(data.reflections) ? data.reflections : []);
      } else {
        setReflections([]);
      }
    } catch (err) {
      console.error('Failed to fetch reflections:', err);
      setReflections([]);
    }
  };

  const fetchProgressData = async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (activeJourneyId) {
        params.append('journeyId', activeJourneyId);
      }
      const headers = {
        'X-Clerk-User-Id': user.id,
        'Content-Type': 'application/json'
      };
      const endpoint = `${apiBase}/api/communication/metrics?${params.toString()}`;
      console.log('MyProgressPage: Fetching metrics from:', endpoint, 'with journeyId:', activeJourneyId);
      
      let metricsRes;
      try {
        metricsRes = await fetch(endpoint, { headers });
      } catch (fetchError) {
        console.error('MyProgressPage: Network error fetching metrics:', fetchError);
        setMetrics([]);
        setReflections([]);
        setLoading(false);
        return;
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        console.log('MyProgressPage: Received metrics:', {
          count: metricsData.metrics?.length || 0,
          sample: metricsData.metrics?.[0]
        });
        setMetrics(metricsData.metrics || []);
      } else {
        console.error('MyProgressPage: Failed to fetch metrics:', metricsRes.status, metricsRes.statusText);
        const errorData = await metricsRes.json().catch(() => ({}));
        console.error('MyProgressPage: Error details:', errorData);
        setMetrics([]);
      }

      // Fetch reflections with error handling
      try {
        await fetchReflections(headers);
      } catch (err) {
        console.error('Failed to fetch reflections:', err);
        setReflections([]);
      }
    } catch (err) {
      console.error('Failed to fetch progress data:', err);
      setMetrics([]);
      setReflections([]);
    } finally {
      setLoading(false);
    }
  };


  // Calculate parameter improvements
  const parameterImprovements = useMemo(() => {
    if (metrics.length < 2) return {};

    const first = metrics[0];
    const latest = metrics[metrics.length - 1];
    const improvements = {};

    Object.values(PARAMETER_CATEGORIES).forEach(category => {
      category.parameters.forEach(param => {
        const firstValue = parseFloat(first[param.key]) || 0;
        const latestValue = parseFloat(latest[param.key]) || 0;
        const change = latestValue - firstValue;
        
        if (change !== 0) {
          improvements[param.key] = {
            first: firstValue,
            latest: latestValue,
            change: change,
            changePercent: firstValue > 0 ? ((change / firstValue) * 100).toFixed(1) : null
          };
        }
      });
    });

    return improvements;
  }, [metrics, PARAMETER_CATEGORIES]);

  // Get top improving parameters
  const topImprovements = useMemo(() => {
    return Object.entries(parameterImprovements)
      .map(([key, data]) => {
        const category = Object.values(PARAMETER_CATEGORIES).find(cat =>
          cat.parameters.some(p => p.key === key)
        );
        const param = category?.parameters.find(p => p.key === key);
        return {
          key,
          label: param?.label || key,
          description: param?.description || '',
          category: category?.name || '',
          categoryColor: category?.color || '#64748b',
          ...data
        };
      })
      .filter(item => item.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);
  }, [parameterImprovements, PARAMETER_CATEGORIES]);

  // Get stable strengths
  const stableStrengths = useMemo(() => {
    if (metrics.length < 2) return [];

    const strengths = [];
    Object.values(PARAMETER_CATEGORIES).forEach(category => {
      category.parameters.forEach(param => {
        const values = metrics.map(m => parseFloat(m[param.key]) || 0);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        if (avg >= 7 && stdDev < 1.5 && min >= 6) {
          strengths.push({
            key: param.key,
            label: param.label,
            description: param.description,
            category: category.name,
            categoryColor: category.color,
            average: avg
          });
        }
      });
    });

    return strengths.sort((a, b) => b.average - a.average).slice(0, 3);
  }, [metrics, PARAMETER_CATEGORIES]);

  // Get weaknesses (below 6.0 OR declining)
  const weaknesses = useMemo(() => {
    if (metrics.length === 0) return [];

    const latest = metrics[metrics.length - 1];
    const first = metrics.length >= 2 ? metrics[0] : null;
    let weaknessesList = [];

    Object.values(PARAMETER_CATEGORIES).forEach(category => {
      category.parameters.forEach(param => {
        const current = parseFloat(latest[param.key]) || 0;
        const firstValue = first ? (parseFloat(first[param.key]) || 0) : null;
        let isDeclining = false;
        
        if (first && metrics.length >= 2 && firstValue !== null) {
          isDeclining = current < firstValue - 0.3; // Declining if dropped by 0.3+ points
        }

        if (current < 6.0 || isDeclining) {
          const trend = first && firstValue !== null ? {
            direction: current < firstValue - 0.3 ? 'declining' : 'stable',
            change: Math.abs(current - firstValue)
          } : null;

          weaknessesList.push({
            key: param.key,
            label: param.label,
            description: param.description,
            category: category.name,
            categoryColor: category.color,
            current,
            isDeclining,
            trend
          });
        }
      });
    });

    // Sort by severity (lowest score first, then declining)
    weaknessesList = weaknessesList.sort((a, b) => {
      if (a.isDeclining && !b.isDeclining) return -1;
      if (!a.isDeclining && b.isDeclining) return 1;
      return a.current - b.current;
    }).slice(0, 3);

    // Fallback: if no weaknesses detected, show lowest metrics as opportunities
    if (weaknessesList.length === 0) {
      const fallbackCandidates = [];
      Object.values(PARAMETER_CATEGORIES).forEach(category => {
        category.parameters.forEach(param => {
          const current = parseFloat(latest[param.key]) || 0;
          fallbackCandidates.push({
            key: param.key,
            label: param.label,
            description: param.description,
            category: category.name,
            categoryColor: category.color,
            current,
            isDeclining: false,
            trend: null
          });
        });
      });

      weaknessesList = fallbackCandidates
        .sort((a, b) => a.current - b.current)
        .slice(0, 2);
    }

    return weaknessesList;
  }, [metrics, PARAMETER_CATEGORIES]);

  // Smart hero: biggest win OR most critical weakness
  const heroInsight = useMemo(() => {
    if (metrics.length < 2) return null;

    const biggestWin = topImprovements[0];
    const mostCriticalWeakness = weaknesses[0];

    // If there's a significant improvement (change > 1.5), show that
    if (biggestWin && biggestWin.change > 1.5) {
      const category = Object.values(PARAMETER_CATEGORIES).find(cat =>
        cat.parameters.some(p => p.key === biggestWin.key)
      );
      const param = category?.parameters.find(p => p.key === biggestWin.key);
      
      return {
        type: 'win',
        title: t('myProgress.heroWinTitle', { label: biggestWin.label, category: biggestWin.category, change: biggestWin.change.toFixed(1) }),
        description: generateImprovementNarrative(param || { key: biggestWin.key, label: biggestWin.label, description: biggestWin.description }, biggestWin, t),
        value: biggestWin.latest.toFixed(1),
        change: `+${biggestWin.change.toFixed(1)}`,
        categoryColor: biggestWin.categoryColor,
        icon: TrendingUp
      };
    }

    // Otherwise, show most critical weakness
    if (mostCriticalWeakness) {
      const category = Object.values(PARAMETER_CATEGORIES).find(cat =>
        cat.parameters.some(p => p.key === mostCriticalWeakness.key)
      );
      const param = category?.parameters.find(p => p.key === mostCriticalWeakness.key);
      
      return {
        type: 'opportunity',
        title: t('myProgress.heroFocusTitle', { label: mostCriticalWeakness.label, category: mostCriticalWeakness.category }),
        description: generateWeaknessNarrative(param || { key: mostCriticalWeakness.key, label: mostCriticalWeakness.label, description: mostCriticalWeakness.description }, mostCriticalWeakness.current, mostCriticalWeakness.trend, t),
        value: mostCriticalWeakness.current.toFixed(1),
        change: mostCriticalWeakness.isDeclining ? t('myProgress.decliningLabel') : t('myProgress.needsAttentionLabel'),
        categoryColor: '#f59e0b',
        icon: AlertCircle
      };
    }

    return null;
  }, [topImprovements, weaknesses, metrics, PARAMETER_CATEGORIES, t]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  const parseScore = (value) => {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatDateLabel = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' });
  };

  const getMetricTimestamp = (metric) => metric?.analyses?.created_at || metric?.created_at;


  const latestMetrics = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const previousMetricsEntry = metrics.length > 1 ? metrics[metrics.length - 2] : null;

  const kpiCards = useMemo(() => {
    if (!latestMetrics) return [];
    return KPI_FIELDS.map(field => {
      const value = parseScore(latestMetrics[field.key]);
      const prevValue = previousMetricsEntry ? parseScore(previousMetricsEntry[field.key]) : null;
      const delta = value !== null && prevValue !== null ? value - prevValue : null;
      return {
        ...field,
        value,
        delta
      };
    });
  }, [latestMetrics, previousMetricsEntry, KPI_FIELDS]);

  const deliverySnapshot = useMemo(() => {
    if (!latestMetrics) {
      return {
        speakingRateLabel: null,
        fillerWordLevel: null,
        sentiment: null,
        posture: null
      };
    }
    // Get delivery metrics from nested delivery object or flat structure (backward compatibility)
    const delivery = latestMetrics.delivery || {};
    return {
      speakingRateLabel: delivery.speaking_rate_label || latestMetrics.speaking_rate_label || null,
      fillerWordLevel: delivery.filler_word_level || latestMetrics.filler_word_level || null,
      sentiment: delivery.sentiment || latestMetrics.sentiment_label || latestMetrics.sentiment || null,
      posture: delivery.posture_flag || latestMetrics.posture_flag || null
    };
  }, [latestMetrics]);

  const trendRows = useMemo(() => {
    const lastFive = metrics.slice(-5);
    return lastFive
      .map((entry, idx) => ({
        metric: entry,
        previous: idx > 0 ? lastFive[idx - 1] : null
      }))
      .reverse();
  }, [metrics]);

  const latestReflection = reflections[0] || null;
  const reflectionScore = latestReflection
    ? Number(latestReflection.confidence_rating ?? latestReflection.confidenceRating)
    : null;

  const aiOverallScoreRaw = useMemo(() => parseScore(latestMetrics?.overall_score), [latestMetrics]);

  // Normalize AI overall to 0-10 scale (API sends 0-100)
  const aiOverallScore = useMemo(() => {
    if (!Number.isFinite(aiOverallScoreRaw)) return null;
    return aiOverallScoreRaw > 10 ? aiOverallScoreRaw / 10 : aiOverallScoreRaw;
  }, [aiOverallScoreRaw]);

  // Normalize reflection score from 1-5 scale to 0-10 scale for comparison
  const normalizedReflectionScore = useMemo(() => {
    if (!Number.isFinite(reflectionScore)) return null;
    // Convert 1-5 scale to 0-10 scale: (score - 1) * 2.5
    return (reflectionScore - 1) * 2.5;
  }, [reflectionScore]);

  const reflectionDelta = useMemo(() => {
    if (!latestReflection || !Number.isFinite(aiOverallScore) || !Number.isFinite(normalizedReflectionScore)) {
      return null;
    }
    // Delta: positive means AI scored higher, negative means user scored themselves higher
    return Number((aiOverallScore - normalizedReflectionScore).toFixed(1));
  }, [latestReflection, aiOverallScore, normalizedReflectionScore]);
  
  // Calculate reflection trend (comparing current vs previous reflection)
  const reflectionTrend = useMemo(() => {
    if (!reflections || reflections.length < 2) return null;
    const current = reflections[0];
    const previous = reflections[1];
    const currentNormalized = current.confidence_rating ? (current.confidence_rating - 1) * 2.5 : null;
    const previousNormalized = previous.confidence_rating ? (previous.confidence_rating - 1) * 2.5 : null;
    if (!Number.isFinite(currentNormalized) || !Number.isFinite(previousNormalized)) return null;
    return Number((currentNormalized - previousNormalized).toFixed(1));
  }, [reflections]);

  const streakInfo = useMemo(() => computeStreakInfo(metrics, getMetricTimestamp), [metrics]);

  const cohortPercentile = useMemo(() => {
    return computeCohortPercentile(aiOverallScore);
  }, [aiOverallScore]);

  const masteryUnlocked = useMemo(() => {
    if (metrics.length < 3) return false;
    const recent = metrics.slice(-3);
    return recent.every(entry => parseScore(entry.overall_score) >= 8);
  }, [metrics]);

  if (loading) {
    return (
      <div className="myProgressPage">
        <LoadingSpinner message={t('myProgress.loading')} size="large" />
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="myProgressPage">
        <div className="myProgressPage__header">
          <JourneySwitcher
            className="dashboard__journeyTabs myProgressPage__journeyTabs"
            journeys={journeys}
            journeysLoading={journeysLoading}
            activeJourneyId={activeJourneyId}
            onSelectJourney={onSelectJourney}
          />
          <h1 className="myProgressPage__title">{t('myProgress.title')}</h1>
          <p className="myProgressPage__subtitle">
            {focusLabel
              ? t('myProgress.emptySubtitleWithFocus', { focusLabel })
              : t('myProgress.emptySubtitle')}
          </p>
        </div>
        <EmptyState
          variant="progress"
          title={focusLabel
            ? t('myProgress.emptyTitleWithFocus', { focusLabel })
            : t('myProgress.emptyTitle')}
          description={focusLabel
            ? t('myProgress.emptyDescriptionWithFocus', { focusLabel })
            : t('myProgress.emptyDescription')}
          actionLabel={t('analysisPage.newAnalysis')}
          onAction={() => navigate('/new-analysis')}
        />
      </div>
    );
  }

  return (
    <div className="myProgressPage">
      {/* Header */}
      <div className="myProgressPage__header">
        <JourneySwitcher
          className="dashboard__journeyTabs myProgressPage__journeyTabs"
          journeys={journeys}
          journeysLoading={journeysLoading}
          activeJourneyId={activeJourneyId}
          onSelectJourney={onSelectJourney}
        />
        <h1 className="myProgressPage__title">{t('myProgress.title')}</h1>
        <p className="myProgressPage__subtitle">
          {focusLabel
            ? t('myProgress.subtitleWithFocus', {
                focusLabel,
                count: metrics.length,
                unit: metrics.length === 1 ? t('myProgress.sessionUnitSingular') : t('myProgress.sessionUnitPlural')
              })
            : t('myProgress.subtitle', {
                count: metrics.length,
                unit: metrics.length === 1 ? t('myProgress.sessionUnitSingular') : t('myProgress.sessionUnitPlural')
              })}
        </p>
        {showGoalGuidance && (
          <p className="myProgressPage__subtitleSecondary">
            {t('myProgress.subtitleSecondary', {
              goal: focusLabel ? focusLabel.toLowerCase() : ''
            })}
          </p>
        )}
      </div>

      {/* Practice Commitment Alert */}
      <PracticeCommitmentAlert journeyId={activeJourneyId} />

      {/* How to Read This - Expandable Guide */}
      <div className="myProgressPage__section myProgressPage__section--guide">
        <button 
          className="guideToggle"
          onClick={() => toggleSection('guide')}
        >
          <BarChart3 size={18} className="guideToggle__icon" />
          <span className="guideToggle__text">{t('myProgress.guideToggle')}</span>
          {expandedSections.guide ? (
            <ChevronUp size={18} className="guideToggle__chevron" />
          ) : (
            <ChevronDown size={18} className="guideToggle__chevron" />
          )}
        </button>

        {expandedSections.guide && (
          <div className="guideContent">
            <div className="guideContent__intro">
              <p className="guideContent__text">
                {t('myProgress.guideIntro')}
              </p>
            </div>

            <div className="guideContent__categories">
              {Object.entries(PARAMETER_CATEGORIES).map(([catKey, category]) => {
                const CategoryIcon = category.icon;
                return (
                  <div key={catKey} className="guideCategory">
                    <div className="guideCategory__header">
                      <div className="guideCategory__icon" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
                        <CategoryIcon size={24} />
                      </div>
                      <div>
                    <h3 className="guideCategory__title">{category.name}</h3>
                        <p className="guideCategory__description">
                          {category.name === t('parameters.categories.voice') && t('myProgress.voiceCategoryDescription')}
                          {category.name === t('parameters.categories.presence') && t('myProgress.presenceCategoryDescription')}
                          {category.name === t('parameters.categories.clarity') && t('myProgress.clarityCategoryDescription')}
                          {category.name === t('parameters.categories.authenticity') && t('myProgress.authenticityCategoryDescription')}
                          {category.name === t('parameters.categories.impact') && t('myProgress.impactCategoryDescription')}
                          {category.name === t('parameters.categories.confidence') && t('myProgress.confidenceCategoryDescription')}
                        </p>
                      </div>
                    </div>
                    <div className="guideCategory__parameters">
                      {category.parameters.map((param, idx) => (
                        <div key={idx} className="guideParameter">
                          <span className="guideParameter__name">{param.label}</span>
                          <span className="guideParameter__desc">{param.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="guideContent__tips">
              <h4 className="guideContent__tipsTitle">{t('myProgress.guideUnderstandingTitle')}</h4>
              <div className="guideContent__tipsGrid">
                <div className="guideTip">
                  <div className="guideTip__score guideTip__score--high">7-10</div>
                  <div className="guideTip__content">
                    <strong>{t('myProgress.guideStrong')}</strong>
                    <p>{t('myProgress.guideStrongText')}</p>
                  </div>
                </div>
                <div className="guideTip">
                  <div className="guideTip__score guideTip__score--medium">4-6</div>
                  <div className="guideTip__content">
                    <strong>{t('myProgress.guideAverage')}</strong>
                    <p>{t('myProgress.guideAverageText')}</p>
                  </div>
                </div>
                <div className="guideTip">
                  <div className="guideTip__score guideTip__score--low">0-3</div>
                  <div className="guideTip__content">
                    <strong>{t('myProgress.guideLow')}</strong>
                    <p>{t('myProgress.guideLowText')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Smart Hero */}
      {heroInsight && (
        <div className={`myProgressPage__hero myProgressPage__hero--${heroInsight.type}`}>
          <div className="progressHero">
            <div className="progressHero__icon" style={{ backgroundColor: `${heroInsight.categoryColor}15`, color: heroInsight.categoryColor }}>
              {React.createElement(heroInsight.icon, { size: 32 })}
            </div>
            <div className="progressHero__content">
              <div className="progressHero__badge">
                {heroInsight.type === 'win' ? (
                  <>
                    <Sparkles size={16} />
                    <span>{t('myProgress.heroBiggestWin')}</span>
                  </>
                ) : (
                  <>
                    <Target size={16} />
                    <span>{t('myProgress.heroFocusArea')}</span>
                  </>
                )}
              </div>
              <h2 className="progressHero__title">{heroInsight.title}</h2>
              <p className="progressHero__description">{heroInsight.description}</p>
            </div>
            <div className="progressHero__score">
              <div className="progressHero__scoreValue">{heroInsight.value}</div>
              <div className="progressHero__scoreLabel">{t('myProgress.categoryScoreLabel')}</div>
              <div className={`progressHero__change progressHero__change--${heroInsight.type}`}>
                {heroInsight.change}
              </div>
            </div>
          </div>
        </div>
      )}

      {(streakInfo.weeks > 0 || cohortPercentile) && (
        <div className="momentumRow">
          {streakInfo.weeks > 0 && (
            <div className={`momentumCard ${streakInfo.warning ? 'momentumCard--warning' : ''}`}>
              <div className="momentumCard__label">{t('myProgress.momentumStreakLabel')}</div>
              <div className="momentumCard__value">
                {streakInfo.weeks}
                <span> {t('myProgress.momentumStreakUnit', { count: streakInfo.weeks })}</span>
              </div>
              <p>
                {streakInfo.daysUntilBreak !== null
                  ? t('myProgress.momentumStreakKeepAlive', { days: Math.ceil(streakInfo.daysUntilBreak) })
                  : t('myProgress.momentumStreakExtend')}
              </p>
            </div>
          )}
          {cohortPercentile && (
            <div className="momentumCard momentumCard--cohort">
              <div className="momentumCard__label">{t('myProgress.momentumCohortLabel')}</div>
              <div className="momentumCard__value">
                {cohortPercentile}
                <span>%</span>
              </div>
              <p>
                {focusLabel
                  ? t('myProgress.momentumCohortWithFocus', { percent: cohortPercentile, focusLabel })
                  : t('myProgress.momentumCohortGeneric')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* KPI Grid */}
      {kpiCards.length > 0 && (
        <div className="progressKpis">
          {kpiCards.map((card) => (
            <div key={card.key} className="progressKpiCard">
              <div className="progressKpiCard__label">{card.label}</div>
              <div className="progressKpiCard__valueWrapper">
                <span className="progressKpiCard__value">{card.value !== null ? card.value.toFixed(1) : '—'}</span>
                <span className="progressKpiCard__unit">{t('myProgress.categoryScoreLabel')}</span>
              </div>
              {card.delta !== null && (
                <div className={`progressKpiCard__delta progressKpiCard__delta--${card.delta >= 0 ? 'up' : 'down'}`}>
                  {card.delta >= 0 ? '+' : ''}{card.delta.toFixed(1)}
                </div>
              )}
              <p className="progressKpiCard__hint">{card.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Delivery Metrics */}
      <div className="deliveryStats">
        <div className="deliveryStats__card">
          <div className="deliveryStats__label">{t('myProgress.delivery.speakingRate')}</div>
          <div className={`deliveryStats__value deliveryStats__value--pill deliveryStats__value--${deliverySnapshot.speakingRateLabel || 'none'}`}>
            {deliverySnapshot.speakingRateLabel 
              ? t(`myProgress.delivery.speakingRateLabels.${deliverySnapshot.speakingRateLabel}`, { defaultValue: deliverySnapshot.speakingRateLabel })
              : '—'}
          </div>
          <p className="deliveryStats__hint">
            {deliverySnapshot.speakingRateLabel 
              ? t(`myProgress.delivery.hints.speakingRateLabels.${deliverySnapshot.speakingRateLabel}`, { defaultValue: t('myProgress.delivery.hints.speakingRate') })
              : t('myProgress.delivery.hints.speakingRate')}
          </p>
        </div>
        <div className="deliveryStats__card">
          <div className="deliveryStats__label">{t('myProgress.delivery.fillerWords')}</div>
          <div className={`deliveryStats__value deliveryStats__value--pill deliveryStats__value--${deliverySnapshot.fillerWordLevel || 'none'}`}>
            {deliverySnapshot.fillerWordLevel 
              ? t(`myProgress.delivery.fillerWordLevel.${deliverySnapshot.fillerWordLevel}`, { defaultValue: deliverySnapshot.fillerWordLevel })
              : '—'}
          </div>
          <p className="deliveryStats__hint">
            {deliverySnapshot.fillerWordLevel 
              ? t(`myProgress.delivery.hints.fillerWordLevel.${deliverySnapshot.fillerWordLevel}`, { defaultValue: t('myProgress.delivery.hints.fillerWords') })
              : t('myProgress.delivery.hints.fillerWords')}
          </p>
        </div>
        <div className="deliveryStats__card">
          <div className="deliveryStats__label">{t('myProgress.delivery.sentiment')}</div>
          <div className="deliveryStats__value deliveryStats__value--pill">
            {deliverySnapshot.sentiment
              ? t(`myProgress.moods.${deliverySnapshot.sentiment.toLowerCase()}`, deliverySnapshot.sentiment.charAt(0).toUpperCase() + deliverySnapshot.sentiment.slice(1))
              : '—'}
          </div>
          <p className="deliveryStats__hint">{t('myProgress.delivery.hints.sentiment')}</p>
        </div>
        <div className="deliveryStats__card">
          <div className="deliveryStats__label">{t('myProgress.delivery.posture')}</div>
          <div className="deliveryStats__value deliveryStats__value--pill">
            {deliverySnapshot.posture
              ? t(`myProgress.postureLabels.${deliverySnapshot.posture.replace(/_/g, '')}`, deliverySnapshot.posture.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()))
              : '—'}
          </div>
          <p className="deliveryStats__hint">{t('myProgress.delivery.hints.posture')}</p>
        </div>
      </div>

      {/* Trend list */}
      {trendRows.length > 0 && (
        <div className="myProgressPage__section trendSection">
              <div className="progressSection__header">
            <TrendingUp size={24} className="progressSection__icon progressSection__icon--trend" />
            <div>
              <h2 className="progressSection__title">{t('myProgress.recentSessionsTitle')}</h2>
              <p className="progressSection__subtitle">{t('myProgress.recentSessionsSubtitle')}</p>
            </div>
          </div>
          <div className="trendList">
            {trendRows.map(({ metric, previous }, idx) => {
              const overall = parseScore(metric.overall_score);
              const prevOverall = previous ? parseScore(previous.overall_score) : null;
              const delta = overall !== null && prevOverall !== null ? overall - prevOverall : null;
              const delivery = metric.delivery || {};
              const speakingRateLabel = delivery.speaking_rate_label || metric.speaking_rate_label || null;
              const fillerWordLevel = delivery.filler_word_level || metric.filler_word_level || null;
              const timestamp = getMetricTimestamp(metric);

              return (
                <div key={`trend-${idx}`} className="trendRow">
                  <div className="trendRow__meta">
                    <span className="trendRow__date">{formatDateLabel(timestamp)}</span>
                    <span className="trendRow__stage">{getStageLabel(metric.stage_title)}</span>
                  </div>
                  <div className="trendRow__metrics">
                    <div className="trendRow__metric">
                      <span className="trendRow__metricLabel">{t('myProgress.overallLabel')}</span>
                      <strong>{overall !== null ? overall.toFixed(1) : '—'}</strong>
                      {delta !== null && (
                        <span className={`trendRow__delta trendRow__delta--${delta >= 0 ? 'up' : 'down'}`}>
                          {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="trendRow__metric">
                      <span className="trendRow__metricLabel">{t('myProgress.speakingRateLabel')}</span>
                      <strong>
                        {speakingRateLabel 
                          ? t(`myProgress.delivery.speakingRateLabels.${speakingRateLabel}`, { defaultValue: speakingRateLabel })
                          : '—'}
                      </strong>
                    </div>
                    <div className="trendRow__metric">
                      <span className="trendRow__metricLabel">{t('myProgress.fillerWordsLabel')}</span>
                      <strong>
                        {fillerWordLevel 
                          ? t(`myProgress.delivery.fillerWordLevel.${fillerWordLevel}`, { defaultValue: fillerWordLevel })
                          : '—'}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {latestReflection && latestMetrics && (
        <div className="myProgressPage__section reflectionSection">
          <div className="reflectionCard">
              <div className="reflectionCard__header">
              <Sparkles size={20} />
              <div>
                <h3>{t('myProgress.selfVsAiTitle')}</h3>
                <p>{t('myProgress.loggedDate', { date: new Date(latestReflection.created_at).toLocaleDateString(i18n.language) })}</p>
              </div>
            </div>
            <div className="reflectionCard__scores">
              <div>
                <span>{t('myProgress.selfRating')}</span>
                <strong>{Number.isFinite(reflectionScore) ? reflectionScore.toFixed(1) : '—'}</strong>
                <small>/ 5</small>
                {normalizedReflectionScore !== null && (
                  <small className="reflectionCard__normalized">({normalizedReflectionScore.toFixed(1)}/10)</small>
                )}
              </div>
              <div>
                <span>{t('myProgress.aiOverall')}</span>
                <strong>{Number.isFinite(aiOverallScore) ? aiOverallScore.toFixed(1) : '—'}</strong>
                <small>/ 10</small>
              </div>
              {reflectionDelta !== null && (
                <div>
                  <span>{t('myProgress.delta')}</span>
                  <strong className={reflectionDelta >= 0 ? 'delta--positive' : 'delta--negative'}>
                    {reflectionDelta >= 0 ? '+' : ''}{reflectionDelta.toFixed(1)}
                  </strong>
                  <small>
                    {reflectionDelta > 0 ? t('myProgress.aiHigher') : reflectionDelta < 0 ? t('myProgress.youHigher') : t('myProgress.match')}
                  </small>
                </div>
              )}
              {reflectionTrend !== null && (
                <div>
                  <span>{t('myProgress.trend')}</span>
                  <strong className={reflectionTrend >= 0 ? 'delta--positive' : 'delta--negative'}>
                    {reflectionTrend >= 0 ? '+' : ''}{reflectionTrend.toFixed(1)}
                  </strong>
                  <small>{t('myProgress.vsPrevious')}</small>
                </div>
              )}
            </div>
            {reflectionDelta !== null && Math.abs(reflectionDelta) > 1 && (
              <div className="reflectionCard__insight">
                {reflectionDelta > 1 ? (
                  <p>💡 <strong>{t('myProgress.insightLabel')}</strong> {t('myProgress.insightAiHigher')}</p>
                ) : (
                  <p>💡 <strong>{t('myProgress.insightLabel')}</strong> {t('myProgress.insightYouHigher')}</p>
                )}
              </div>
            )}
            {latestReflection.mood_label && (
              <div className="reflectionCard__mood">
                {t('myProgress.moodCheckIn', { mood: t(`myProgress.moods.${latestReflection.mood_label.toLowerCase()}`, latestReflection.mood_label) })}
              </div>
            )}
            {latestReflection.notes && (
              <p className="reflectionCard__notes">“{latestReflection.notes}”</p>
            )}
          </div>
        </div>
      )}

      {/* Areas to Focus On - PROMINENT */}
      {weaknesses.length > 0 && (
        <div className="myProgressPage__section myProgressPage__section--focus">
            <div className="progressSection__header">
            <AlertCircle size={28} className="progressSection__icon progressSection__icon--focus" />
            <div>
              <h2 className="progressSection__title">{t('myProgress.areasToFocusTitle')}</h2>
              <p className="progressSection__subtitle">{t('myProgress.areasToFocusSubtitle')}</p>
            </div>
          </div>
          <div className="focusGrid">
            {weaknesses.map((weakness, idx) => {
              const category = Object.values(PARAMETER_CATEGORIES).find(cat =>
                cat.parameters.some(p => p.key === weakness.key)
              );
              const param = category?.parameters.find(p => p.key === weakness.key);
              
              const guidance = {
                why: t(`myProgress.guidance.${weakness.key}.why`, t('myProgress.guidance.default.why')),
                instantTip: t(`myProgress.guidance.${weakness.key}.instantTip`, t('myProgress.guidance.default.instantTip')),
                microPractice: t(`myProgress.guidance.${weakness.key}.microPractice`, t('myProgress.guidance.default.microPractice')),
                practiceTime: t(`myProgress.guidance.${weakness.key}.practiceTime`, t('myProgress.guidance.default.practiceTime')),
                trackThis: t(`myProgress.guidance.${weakness.key}.trackThis`, t('myProgress.guidance.default.trackThis'))
              };

              return (
                <div key={idx} className="focusCard">
                  <div className="focusCard__header">
                    <div className="focusCard__icon" style={{ backgroundColor: `${weakness.categoryColor}15`, color: weakness.categoryColor }}>
                      {React.createElement(category?.icon || AlertCircle, { size: 24 })}
                    </div>
                    <div className="focusCard__meta">
                      <span className="focusCard__category">{weakness.category}</span>
                      <span className="focusCard__label">{weakness.label}</span>
                      <span className="focusCard__subtext">{weakness.category} → {weakness.label}</span>
                    </div>
                  </div>
                  <div className="focusCard__score">
                    <span className="focusCard__scoreValue">{weakness.current.toFixed(1)}</span>
                    <span className="focusCard__scoreLabel">{t('myProgress.categoryScoreLabel')}</span>
                    {weakness.isDeclining && (
                      <span className="focusCard__declining">
                        <TrendingDown size={14} />
                        {t('myProgress.decliningLabel')}
                      </span>
                    )}
                  </div>
                  <div className="focusCard__progressBar">
                    <div 
                      className="focusCard__progressFill"
                      style={{ 
                        width: `${(weakness.current / 10) * 100}%`,
                        backgroundColor: '#f59e0b'
                      }}
                    />
                  </div>
                  <p className="focusCard__description">
                    {generateWeaknessNarrative(param || { key: weakness.key, label: weakness.label, description: weakness.description }, weakness.current, weakness.trend, t)}
                  </p>
                  <div className="focusCard__why">{guidance.why}</div>
                  
                  {/* Practice Button */}
                  <button
                    type="button"
                    className="btn btn--primary focusCard__practiceButton"
                    onClick={() => navigate(`/practice?focus=${weakness.key}`)}
                  >
                    {t('myProgress.practiceThis')}
                    <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* What's Getting Better - COLLAPSED */}
      {topImprovements.length > 0 && (
        <div className="myProgressPage__section">
          <button 
            className="progressSection__toggle"
            onClick={() => toggleSection('improvements')}
          >
              <div className="progressSection__header">
              <TrendingUp size={24} className="progressSection__icon progressSection__icon--improvement" />
              <div>
                <h2 className="progressSection__title">{t('myProgress.whatsGettingBetterTitle')}</h2>
                <p className="progressSection__subtitle">
                  {t('myProgress.whatsGettingBetterSubtitle', { count: topImprovements.length })}
                </p>
              </div>
            </div>
            {expandedSections.improvements ? (
              <ChevronUp size={24} className="progressSection__chevron" />
            ) : (
              <ChevronDown size={24} className="progressSection__chevron" />
            )}
          </button>
          
          {expandedSections.improvements && (
            <div className="improvementGrid">
              {topImprovements.map((improvement, idx) => {
                const category = Object.values(PARAMETER_CATEGORIES).find(cat =>
                  cat.parameters.some(p => p.key === improvement.key)
                );
                const param = category?.parameters.find(p => p.key === improvement.key);
                
                return (
                  <div key={idx} className="improvementCard">
                    <div className="improvementCard__header">
                      <div className="improvementCard__icon" style={{ backgroundColor: `${improvement.categoryColor}15`, color: improvement.categoryColor }}>
                        <TrendingUp size={20} />
                      </div>
                      <div className="improvementCard__meta">
                        <span className="improvementCard__category">{improvement.category}</span>
                        <span className="improvementCard__label">{improvement.label}</span>
                        <span className="improvementCard__subtext">{improvement.category} <span className="breadcrumb-separator">›</span> {improvement.label}</span>
                      </div>
                    </div>
                    <div className="improvementCard__progress">
                      <div className="improvementCard__scores">
                        <div className="improvementCard__score">
                          <span className="improvementCard__scoreLabel">{t('myProgress.startedLabel')}</span>
                          <span className="improvementCard__scoreValue">{improvement.first.toFixed(1)}</span>
                        </div>
                        <div className="improvementCard__arrow">
                          <ArrowRight size={20} />
                        </div>
                        <div className="improvementCard__score">
                          <span className="improvementCard__scoreLabel">{t('myProgress.nowLabel')}</span>
                          <span className="improvementCard__scoreValue improvementCard__scoreValue--current">
                            {improvement.latest.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="improvementCard__change">
                        <span className="improvementCard__changeValue">+{improvement.change.toFixed(1)}</span>
                        {improvement.changePercent && (
                          <span className="improvementCard__changePercent">{t('myProgress.improvementPercent', { percent: improvement.changePercent })}</span>
                        )}
                      </div>
                    </div>
                    <p className="improvementCard__description">
                      {generateImprovementNarrative(param || { key: improvement.key, label: improvement.label, description: improvement.description }, improvement, t)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Your Strengths - COLLAPSED */}
      {stableStrengths.length > 0 && (
        <div className="myProgressPage__section">
          <button 
            className="progressSection__toggle"
            onClick={() => toggleSection('strengths')}
          >
              <div className="progressSection__header">
              <Star size={24} className="progressSection__icon progressSection__icon--strength" />
              <div>
                <h2 className="progressSection__title">{t('myProgress.yourStrengthsTitle')}</h2>
                <p className="progressSection__subtitle">{t('myProgress.yourStrengthsSubtitle')}</p>
              </div>
            </div>
            {expandedSections.strengths ? (
              <ChevronUp size={24} className="progressSection__chevron" />
            ) : (
              <ChevronDown size={24} className="progressSection__chevron" />
            )}
          </button>
          
          {expandedSections.strengths && (
            <div className="strengthGrid">
              {stableStrengths.map((strength, idx) => (
                <div key={idx} className="strengthCard">
                  <div className="strengthCard__header">
                    <div className="strengthCard__icon" style={{ backgroundColor: `${strength.categoryColor}15`, color: strength.categoryColor }}>
                      {React.createElement(CheckCircle2, { size: 20 })}
                    </div>
                    <div className="strengthCard__meta">
                      <span className="strengthCard__category">{strength.category}</span>
                      <span className="strengthCard__label">{strength.label}</span>
                      <span className="strengthCard__subtext">{strength.category} <span className="breadcrumb-separator">›</span> {strength.label}</span>
                    </div>
                  </div>
                  <div className="strengthCard__score">
                    <div className="strengthCard__scoreValue">{strength.average.toFixed(1)}</div>
                    <div className="strengthCard__scoreLabel">{t('myProgress.averageScore')}</div>
                  </div>
                  <p className="strengthCard__description">{strength.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complete Analysis - COLLAPSED */}
      <div className="myProgressPage__section">
        <button 
          className="progressSection__toggle"
          onClick={() => toggleSection('complete')}
        >
              <div className="progressSection__header">
            <BarChart3 size={24} className="progressSection__icon" />
            <div>
              <h2 className="progressSection__title">{t('myProgress.completeAnalysisTitle')}</h2>
              <p className="progressSection__subtitle">{t('myProgress.completeAnalysisSubtitle')}</p>
            </div>
          </div>
          {expandedSections.complete ? (
            <ChevronUp size={24} className="progressSection__chevron" />
          ) : (
            <ChevronDown size={24} className="progressSection__chevron" />
          )}
        </button>

        {expandedSections.complete && (
          <div className="completeAnalysis">
            {Object.entries(PARAMETER_CATEGORIES).map(([catKey, category]) => {
              const CategoryIcon = category.icon;
              // Map category key to metric key if different (e.g. voice -> voice_expression)
              const metricKey = catKey === 'voice' ? 'voice_expression' : catKey;
              const categoryScore = parseFloat(latestMetrics[metricKey]) || 0;

              return (
                <div key={catKey} className="parameterCategory">
                  <div className="parameterCategory__header">
                    <div className="parameterCategory__titleGroup">
                      <div className="parameterCategory__icon" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
                        <CategoryIcon size={24} />
                      </div>
                      <div>
                        <h3 className="parameterCategory__title">{category.name}</h3>
                        <div className="parameterCategory__score">
                          <span className="parameterCategory__scoreValue">{categoryScore.toFixed(1)}</span>
                          <span className="parameterCategory__scoreLabel">{t('myProgress.categoryScoreLabel')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="parameterCategory__parameters">
                    {category.parameters.map((param) => {
                      const value = parseFloat(latestMetrics[param.key]) || 0;
                      const improvement = parameterImprovements[param.key];

                      return (
                        <div key={param.key} className="parameterCard">
                          <div className="parameterCard__header">
                            <div className="parameterCard__info">
                              <span className="parameterCard__label">{param.label}</span>
                              <span className="parameterCard__description">{param.description}</span>
                            </div>
                            <div className="parameterCard__score">
                              <span className="parameterCard__scoreValue">{value.toFixed(1)}</span>
                              <span className="parameterCard__scoreLabel">{t('myProgress.categoryScoreLabel')}</span>
                            </div>
                          </div>
                          
                          <div className="parameterCard__progressBar">
                            <div 
                              className="parameterCard__progressFill"
                              style={{ 
                                width: `${(value / 10) * 100}%`,
                                backgroundColor: category.color
                              }}
                            />
                          </div>

                          {improvement && improvement.change > 0 && (
                            <div className="parameterCard__improvement">
                              <span className="parameterCard__improvementText">
                                {t('myProgress.parameterImprovement', {
                                  first: improvement.first.toFixed(1),
                                  latest: improvement.latest.toFixed(1),
                                  change: improvement.change.toFixed(1)
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
