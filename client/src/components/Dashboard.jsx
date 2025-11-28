import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import { 
  Target,
  Dumbbell,
  Briefcase,
  Mic,
  Video,
  MessageCircle,
  Award,
  Heart,
  Users,
  Sparkles,
  TrendingUp,
  BookOpen,
  Trophy,
  BarChart3,
  CheckCircle2,
  Circle,
  ListTodo,
  ChevronDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import OnboardingQuestions from './OnboardingQuestions';
import CelebrationModal from './CelebrationModal';
import BeforeAfterComparison from './BeforeAfterComparison';
import LoadingSpinner from './LoadingSpinner';
import './Dashboard.css';
import JourneySwitcher from './JourneySwitcher';
import PracticeCommitmentAlert from './PracticeCommitmentAlert';
function ExpandableDashboardText({ text, collapsedLines = 2 }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const shouldCollapse = text.length > 180;
  return (
    <div className={`journalCard__expandableText ${expanded ? 'expanded' : ''}`}>
      <p
        className="journalCard__actionDescription"
        style={
          shouldCollapse && !expanded
            ? {
                display: '-webkit-box',
                WebkitLineClamp: collapsedLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
            : undefined
        }
      >
        {text}
      </p>
      {shouldCollapse && (
        <button
          type="button"
          className="journalCard__expandToggle"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Show less' : 'Show more'}
          <ChevronDown size={14} className={expanded ? 'rotated' : ''} />
        </button>
      )}
    </div>
  );
}

export default function Dashboard({
  onNewAnalysis,
  refreshTrigger,
  journeys = [],
  journeysLoading = false,
  activeJourneyId = null,
  onSelectJourney,
  onStartJourney
}) {
  const { user } = useUser();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [localUserContext, setLocalUserContext] = useState(null);
  const [progressData, setProgressData] = useState({
    profile: null,
    metrics: [],
    insights: [],
    achievements: [],
    actionItems: []
  });
  const [journeyModalOpen, setJourneyModalOpen] = useState(false);
  const [journeyModalError, setJourneyModalError] = useState(null);
  const [journeyModalSubmitting, setJourneyModalSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  const [celebrationShownForSession, setCelebrationShownForSession] = useState(() => {
    // Check if we've already shown celebration for this session
    return sessionStorage.getItem('bodai_celebration_shown') === 'true';
  });
  const activeJourney = useMemo(
    () => journeys.find(journey => journey.id === activeJourneyId) || null,
    [journeys, activeJourneyId]
  );

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchProgressData(activeJourneyId);
      // Also check localStorage for fallback
      const savedContext = localStorage.getItem('bodai_user_context');
      if (savedContext) {
        try {
          setLocalUserContext(JSON.parse(savedContext));
        } catch (e) {
          console.warn('Failed to parse saved context:', e);
        }
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  // Clear and refetch data when activeJourneyId changes (journey switching)
  useEffect(() => {
    if (user && activeJourneyId !== null) {
      // Clear existing data immediately to avoid showing stale data
      setProgressData({
        profile: null,
        metrics: [],
        insights: [],
        achievements: [],
        actionItems: []
      });
      setLoading(true);
      // Fetch new data for the selected journey
      fetchProgressData(activeJourneyId);
    }
  }, [activeJourneyId, user]);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (user && refreshTrigger !== undefined) {
      // Add a small delay to ensure backend has saved the data
      const timeoutId = setTimeout(() => {
        fetchProgressData(activeJourneyId);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [refreshTrigger, user, activeJourneyId]);

  // Refresh when navigating to dashboard route
  useEffect(() => {
    if (user && location.pathname === '/dashboard') {
      // Add a small delay to ensure backend has saved the data
      const timeoutId = setTimeout(() => {
        fetchProgressData(activeJourneyId);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname, user, activeJourneyId]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      // Build headers with Clerk profile data for syncing
      const headers = {
        'X-Clerk-User-Id': user.id,
        'Content-Type': 'application/json'
      };
      
      // Add user profile data to headers for syncing with Supabase
      if (user.emailAddresses?.[0]?.emailAddress) {
        headers['X-User-Email'] = user.emailAddresses[0].emailAddress;
      }
      if (user.firstName) {
        headers['X-User-First-Name'] = user.firstName;
      }
      if (user.lastName) {
        headers['X-User-Last-Name'] = user.lastName;
      }
      if (user.phoneNumbers?.[0]?.phoneNumber) {
        headers['X-User-Phone'] = user.phoneNumbers[0].phoneNumber;
      }
      if (user.imageUrl) {
        headers['X-User-Image-Url'] = user.imageUrl;
      }
      
      const res = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:5000/api/user/profile', {
        headers
      });
      
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const handleJourneyModalComplete = async (answers) => {
    if (!onStartJourney) return;
    setJourneyModalSubmitting(true);
    setJourneyModalError(null);
    try {
      await onStartJourney(answers);
      setJourneyModalOpen(false);
    } catch (err) {
      console.error('Failed to create journey:', err);
      setJourneyModalError(err.message || 'Failed to create focus. Please try again.');
    } finally {
      setJourneyModalSubmitting(false);
    }
  };

  const fetchProgressData = async (journeyIdParam = activeJourneyId) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (journeyIdParam) {
        params.append('journeyId', journeyIdParam);
      }
      const endpoint = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/communication/progress'}${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('Fetching dashboard data from:', endpoint, 'with journeyId:', journeyIdParam);
      const res = await fetch(endpoint, {
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('Dashboard data fetched:', {
          profile: !!data.profile,
          latest_metrics: !!data.profile?.latest_metrics,
          metrics: data.metrics?.length || 0,
          insights: data.insights?.length || 0,
          achievements: data.achievements?.length || 0,
          actionItems: data.actionItems?.length || 0
        });
        if (data.metrics && data.metrics.length > 0) {
          console.log('Metrics sample:', data.metrics[0]);
        }
        if (data.profile?.latest_metrics) {
          console.log('Latest metrics:', data.profile.latest_metrics);
        }
        setProgressData({
          profile: data.profile || null,
          metrics: data.metrics || [],
          insights: data.insights || [],
          achievements: data.achievements || [],
          actionItems: data.actionItems || []
        });
      } else {
        console.error('Failed to fetch dashboard data:', res.status, res.statusText);
        const errorData = await res.json().catch(() => ({}));
        console.error('Error details:', errorData);
      }
    } catch (err) {
      console.error('Failed to fetch progress data:', err);
    } finally {
      setLoading(false);
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

function ExpandableDashboardText({ text, collapsedLines = 2 }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const shouldCollapse = text.length > 180;
  return (
    <div className={`journalCard__expandableText ${expanded ? 'expanded' : ''}`}>
      <p
        className="journalCard__actionDescription"
        style={
          shouldCollapse && !expanded
            ? {
                display: '-webkit-box',
                WebkitLineClamp: collapsedLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
            : undefined
        }
      >
        {text}
      </p>
      {shouldCollapse && (
        <button
          type="button"
          className="journalCard__expandToggle"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Show less' : 'Show more'}
          <ChevronDown size={14} className={expanded ? 'rotated' : ''} />
        </button>
      )}
    </div>
  );
}
    return labels[metric] || 'Overall focus';
  };

  const getGoalIcon = (goal) => {
    const goalIcons = {
      'confidence': Dumbbell,
      'content': Video,
      'presentation': Mic,
      'communication': MessageCircle,
      'leadership': Award,
      'dating': Heart,
      'social': Users,
      'general': Sparkles
    };
    return goalIcons[goal] || Target;
  };

  const getGoalLabel = (goal) => {
    const goalMap = {
      'confidence': 'Build Confidence',
      'content': 'Content Creator',
      'presentation': 'Presentation Skills',
      'communication': 'Better Communication',
      'leadership': 'Executive Presence',
      'dating': 'Dating & Romantic',
      'social': 'Social Confidence',
      'general': 'General Improvement'
    };
    return goalMap[goal] || goal;
  };

  const getConfidenceLabel = (level) => {
    const levelMap = {
      'very-high': 'Very Confident',
      'high': 'Confident',
      'medium': 'Moderate',
      'low': 'Not Very Confident',
      'very-low': 'Very Insecure'
    };
    return levelMap[level] || level;
  };

  // Prepare chart data with improvement indicators
  const chartData = progressData.metrics.map((metric, index) => {
    const prevMetric = index > 0 ? progressData.metrics[index - 1] : null;
    const presence = parseFloat(metric.presence) || 0;
    const voice = parseFloat(metric.voice_expression) || 0;
    const clarity = parseFloat(metric.clarity) || 0;
    const authenticity = parseFloat(metric.authenticity) || 0;
    const impact = parseFloat(metric.impact) || 0;
    const confidence = parseFloat(metric.confidence) || 0;

    return {
    name: `Session ${index + 1}`,
      date: metric.analyses?.created_at ? new Date(metric.analyses.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      presence,
      voice_expression: voice,
      clarity,
      authenticity,
      impact,
      confidence,
      // Calculate improvements
      presenceChange: prevMetric ? (presence - (parseFloat(prevMetric.presence) || 0)).toFixed(1) : null,
      voiceChange: prevMetric ? (voice - (parseFloat(prevMetric.voice_expression) || 0)).toFixed(1) : null,
      clarityChange: prevMetric ? (clarity - (parseFloat(prevMetric.clarity) || 0)).toFixed(1) : null,
      authenticityChange: prevMetric ? (authenticity - (parseFloat(prevMetric.authenticity) || 0)).toFixed(1) : null,
      impactChange: prevMetric ? (impact - (parseFloat(prevMetric.impact) || 0)).toFixed(1) : null,
      confidenceChange: prevMetric ? (confidence - (parseFloat(prevMetric.confidence) || 0)).toFixed(1) : null,
    };
  });

  // Calculate overall improvement
  const overallImprovement = chartData.length >= 2 ? {
    presence: (chartData[chartData.length - 1].presence - chartData[0].presence).toFixed(1),
    voice: (chartData[chartData.length - 1].voice_expression - chartData[0].voice_expression).toFixed(1),
    clarity: (chartData[chartData.length - 1].clarity - chartData[0].clarity).toFixed(1),
    authenticity: (chartData[chartData.length - 1].authenticity - chartData[0].authenticity).toFixed(1),
    impact: (chartData[chartData.length - 1].impact - chartData[0].impact).toFixed(1),
    confidence: (chartData[chartData.length - 1].confidence - chartData[0].confidence).toFixed(1),
  } : null;

  // Prepare radar chart data (current performance)
  const radarData = chartData.length > 0 ? [
    { metric: 'Presence', value: chartData[chartData.length - 1].presence, fullMark: 10 },
    { metric: 'Voice', value: chartData[chartData.length - 1].voice_expression, fullMark: 10 },
    { metric: 'Clarity', value: chartData[chartData.length - 1].clarity, fullMark: 10 },
    { metric: 'Authenticity', value: chartData[chartData.length - 1].authenticity, fullMark: 10 },
    { metric: 'Impact', value: chartData[chartData.length - 1].impact, fullMark: 10 },
    { metric: 'Confidence', value: chartData[chartData.length - 1].confidence, fullMark: 10 },
  ] : [];

  // Prepare bar chart data (current vs previous session)
  const barChartData = chartData.length >= 2 ? [
    { metric: 'Presence', current: chartData[chartData.length - 1].presence, previous: chartData[chartData.length - 2].presence },
    { metric: 'Voice', current: chartData[chartData.length - 1].voice_expression, previous: chartData[chartData.length - 2].voice_expression },
    { metric: 'Clarity', current: chartData[chartData.length - 1].clarity, previous: chartData[chartData.length - 2].clarity },
    { metric: 'Authenticity', current: chartData[chartData.length - 1].authenticity, previous: chartData[chartData.length - 2].authenticity },
    { metric: 'Impact', current: chartData[chartData.length - 1].impact, previous: chartData[chartData.length - 2].impact },
    { metric: 'Confidence', current: chartData[chartData.length - 1].confidence, previous: chartData[chartData.length - 2].confidence },
  ] : [];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="chartTooltip">
          <div className="chartTooltip__header">{label}</div>
          {payload.map((entry, index) => {
            // Map dataKey to change key
            const changeKeyMap = {
              'presence': 'presenceChange',
              'voice_expression': 'voiceChange',
              'clarity': 'clarityChange',
              'authenticity': 'authenticityChange',
              'impact': 'impactChange',
              'confidence': 'confidenceChange'
            };
            const changeKey = changeKeyMap[entry.dataKey] || `${entry.dataKey}Change`;
            const change = dataPoint?.[changeKey];
            return (
              <div key={index} className="chartTooltip__item">
                <div className="chartTooltip__itemHeader">
                  <span className="chartTooltip__dot" style={{ backgroundColor: entry.color }}></span>
                  <span className="chartTooltip__label">{entry.name}:</span>
                  <span className="chartTooltip__value">{entry.value?.toFixed(1) || 0}/10</span>
                </div>
                {change && parseFloat(change) !== 0 && (
                  <div className={`chartTooltip__change ${parseFloat(change) > 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(change) > 0 ? '↑' : '↓'} {Math.abs(parseFloat(change))} from previous
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const latestMetrics = progressData.profile?.latest_metrics;
  const latestInsight = progressData.profile?.latest_insight;
  const focusSlug = activeJourney?.focus_slug || userProfile?.primary_goal || localUserContext?.primaryGoal;
  // Derive focusLabel: prefer getGoalLabel if we have a valid slug, otherwise use journey's display_name
  // This ensures we show the proper translated label instead of generic "Custom journey"
  const focusLabel = focusSlug ? getGoalLabel(focusSlug) : (activeJourney?.display_name || activeJourney?.focus_label || null);
  const focusConfidence = activeJourney?.confidence_level || userProfile?.confidence_level || localUserContext?.confidenceLevel;

  // Get user's name for personalization
  const userName = user?.firstName || userProfile?.first_name || userProfile?.full_name?.split(' ')[0] || null;

  // Calculate score trend (compare latest with previous)
  const scoreTrend = useMemo(() => {
    if (!latestMetrics || !progressData.metrics || progressData.metrics.length < 2) return null;
    const currentScore = parseFloat(latestMetrics.overall_score) || 0;
    const previousMetric = progressData.metrics[progressData.metrics.length - 2];
    const previousScore = parseFloat(previousMetric?.overall_score) || 0;
    const change = currentScore - previousScore;
    if (Math.abs(change) < 0.5) return null; // Ignore changes less than 0.5 points
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0,
      currentScore,
      previousScore,
      improvement: change
    };
  }, [latestMetrics, progressData.metrics]);

  // Show celebration modal when score improves
  useEffect(() => {
    if (scoreTrend?.isPositive && !celebrationShownForSession && !loading) {
      // Only show celebration for improvements of 0.5+ points
      if (scoreTrend.improvement >= 0.5) {
        setCelebrationData({
          improvement: scoreTrend.improvement,
          currentScore: scoreTrend.currentScore,
          previousScore: scoreTrend.previousScore,
          metric: 'overall'
        });
        setShowCelebration(true);
        setCelebrationShownForSession(true);
        sessionStorage.setItem('bodai_celebration_shown', 'true');
      }
    }
  }, [scoreTrend, celebrationShownForSession, loading]);

  const handleCloseCelebration = () => {
    setShowCelebration(false);
  };

  // Check if user is new (no analyses yet)
  const isNewUser = !progressData.metrics || progressData.metrics.length === 0;

  // Generate dynamic, encouraging title based on user's goal and whether they're new
  const getDashboardTitle = () => {
    // For new users, always show a welcome message
    if (isNewUser) {
      if (userName) {
        return `Welcome, ${userName}!`;
      }
      return "Welcome to BodAI!";
    }

    if (!focusLabel && !userName) {
      return "Your Dashboard";
    }

    // Map focus labels to short, punchy title templates for returning users
    const titleTemplates = {
      'Build Self-Confidence': [
        userName ? `Hey ${userName}! Ready to shine?` : "Ready to shine?",
        userName ? `Welcome back, ${userName}!` : "Welcome back!",
        userName ? `${userName}, let's build confidence` : "Let's build confidence"
      ],
      'Build Confidence': [
        userName ? `Hey ${userName}! Ready to shine?` : "Ready to shine?",
        userName ? `Welcome back, ${userName}!` : "Welcome back!",
        userName ? `${userName}, let's build confidence` : "Let's build confidence"
      ],
      'Job Interview Preparation': [
        userName ? `Hey ${userName}! Let's ace it` : "Let's ace it",
        userName ? `Welcome back, ${userName}!` : "Welcome back!",
        userName ? `${userName}, ready to impress?` : "Ready to impress?"
      ],
      'Improve Presentations': [
        userName ? `Hey ${userName}! Let's captivate` : "Let's captivate",
        userName ? `Welcome back, ${userName}!` : "Welcome back!",
        userName ? `${userName}, ready to present?` : "Ready to present?"
      ],
      'Presentation Skills': [
        userName ? `Hey ${userName}! Let's captivate` : "Let's captivate",
        userName ? `Welcome back, ${userName}!` : "Welcome back!",
        userName ? `${userName}, ready to present?` : "Ready to present?"
      ],
      'Better Communication': [
        userName ? `Hey ${userName}! Let's connect` : "Let's connect",
        userName ? `Welcome back, ${userName}!` : "Welcome back!",
        userName ? `${userName}, ready to grow?` : "Ready to grow?"
      ],
      'Leadership Presence': [
        userName ? `Hey ${userName}! Let's lead` : "Let's lead",
        userName ? `Welcome back, ${userName}!` : "Welcome back!",
        userName ? `${userName}, ready to inspire?` : "Ready to inspire?"
      ],
      'Executive Presence': [
        userName ? `Hey ${userName}! Let's lead` : "Let's lead",
        userName ? `Welcome back, ${userName}!` : "Welcome back!",
        userName ? `${userName}, ready to inspire?` : "Ready to inspire?"
      ],
      'Content Creator': [
        userName ? `Hey ${userName}! Let's create` : "Let's create",
        userName ? `Welcome back, ${userName}!` : "Welcome back!",
        userName ? `${userName}, ready to record?` : "Ready to record?"
      ],
      'Dating & Romantic': [
        userName ? `Hey ${userName}! Let's connect` : "Let's connect",
        userName ? `Welcome back, ${userName}!` : "Welcome back!",
        userName ? `${userName}, ready to impress?` : "Ready to impress?"
      ],
      'Social Confidence': [
        userName ? `Hey ${userName}! Let's socialize` : "Let's socialize",
        userName ? `Welcome back, ${userName}!` : "Welcome back!",
        userName ? `${userName}, ready to shine?` : "Ready to shine?"
      ],
      'General Improvement': [
        userName ? `Hey ${userName}! Let's grow` : "Let's grow",
        userName ? `Welcome back, ${userName}!` : "Welcome back!",
        userName ? `${userName}, ready to improve?` : "Ready to improve?"
      ]
    };

    // Find matching templates for the focus label
    const templates = titleTemplates[focusLabel] || titleTemplates[Object.keys(titleTemplates).find(key => focusLabel?.includes(key)) || ''] || [];

    // If we have templates, pick one based on a simple hash of the user ID for consistency
    if (templates.length > 0) {
      const userHash = user?.id ? user.id.charCodeAt(0) : 0;
      return templates[userHash % templates.length];
    }

    // Fallback: generic encouraging title
    if (userName) {
      return `Welcome back, ${userName}!`;
    }
    return "Your Dashboard";
  };

  if (loading) {
    return (
      <div className="dashboard">
        <LoadingSpinner message="Loading your dashboard..." size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={handleCloseCelebration}
        improvement={celebrationData?.improvement || 0}
        metric={celebrationData?.metric || 'overall'}
        currentScore={celebrationData?.currentScore || 0}
        previousScore={celebrationData?.previousScore || 0}
      />

      <JourneySwitcher
        className="dashboard__journeyTabs"
        journeys={journeys}
        journeysLoading={journeysLoading}
        activeJourneyId={activeJourneyId}
        onSelectJourney={onSelectJourney}
        onAddJourney={onStartJourney ? () => setJourneyModalOpen(true) : undefined}
      />

      {/* Practice Commitment Alert */}
      <PracticeCommitmentAlert journeyId={activeJourneyId} />

      {/* Header */}
      <div className="dashboard__header">
        <div className="dashboard__headerContent">
          <h1 className="dashboard__title">{getDashboardTitle()}</h1>
          {!isNewUser && (
            <button className="btn btn--primary" onClick={onNewAnalysis}>
              + New Analysis
            </button>
          )}
        </div>
      </div>

      {/* Welcome Section for New Users - AT THE TOP */}
      {isNewUser && (
        <div className="dashboard__welcome dashboard__welcome--prominent">
          <div className="dashboard__welcomeCard">
            <div className="dashboard__welcomeHeader">
              <Sparkles size={32} className="dashboard__welcomeIcon" />
              <div>
                <h2 className="dashboard__welcomeTitle">Let's get started!</h2>
                <p className="dashboard__welcomeSubtitle">Your first analysis is free. Here's how it works:</p>
              </div>
            </div>
            
            <div className="dashboard__welcomeSteps">
              <div className="dashboard__welcomeStep">
                <span className="dashboard__stepNumber">1</span>
                <div className="dashboard__stepContent">
                  <strong>Record a short video</strong>
                  <p>30 seconds to 2 minutes of you speaking naturally</p>
                </div>
              </div>
              <div className="dashboard__welcomeStep">
                <span className="dashboard__stepNumber">2</span>
                <div className="dashboard__stepContent">
                  <strong>Upload and get instant feedback</strong>
                  <p>Our AI analyzes your body language and voice</p>
                </div>
              </div>
              <div className="dashboard__welcomeStep">
                <span className="dashboard__stepNumber">3</span>
                <div className="dashboard__stepContent">
                  <strong>Review your personalized tips</strong>
                  <p>Get actionable advice tailored to your goals</p>
                </div>
              </div>
            </div>
            
            <button className="btn btn--primary btn--large dashboard__welcomeCta" onClick={onNewAnalysis}>
              Upload Your First Video
            </button>
            
            <p className="dashboard__welcomeNote">
              Takes about a minute. Your video is analyzed securely and never shared.
            </p>
          </div>
        </div>
      )}

      {/* Profile Card */}
      {latestMetrics && (
        <div className="dashboard__profileCard">
          <div className="profileCard">
            <div className="profileCard__score">
              <div className="profileCard__scoreValue">
                {Math.round(latestMetrics.overall_score || 0)}
                {scoreTrend && (
                  <span className={`profileCard__trend ${scoreTrend.isPositive ? 'positive' : 'negative'}`}>
                    {scoreTrend.isPositive ? '↑' : '↓'} {scoreTrend.value}
                  </span>
                )}
              </div>
              <div className="profileCard__scoreLabel">Communication Score</div>
            </div>
            <div className="profileCard__info">
              <h2 className="profileCard__stage">{latestMetrics.stage_title || 'Emerging Communicator'}</h2>
              {latestInsight && (
                <p className="profileCard__insight">{latestInsight.content}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Goals Card */}
      {focusSlug && (
        <div className="dashboard__goalsCard">
          <div className="goalsCard">
            <div className="goalsCard__header">
              <div className="goalsCard__icon">
                {React.createElement(getGoalIcon(focusSlug), { size: 48 })}
              </div>
              <div className="goalsCard__info">
                <h3 className="goalsCard__title">Your Focus</h3>
                <p className="goalsCard__goal">{focusLabel}</p>
              </div>
            </div>
            {focusConfidence && (
              <div className="goalsCard__confidence">
                <span className="goalsCard__confidenceLabel">Current Confidence:</span>
                <span className="goalsCard__confidenceValue">
                  {getConfidenceLabel(focusConfidence)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Before/After Comparison - Show when user has 2+ analyses */}
      {progressData.metrics && progressData.metrics.length >= 2 && (
        <BeforeAfterComparison
          firstAnalysis={progressData.metrics[0]}
          latestAnalysis={progressData.metrics[progressData.metrics.length - 1]}
          allMetrics={progressData.metrics}
        />
      )}

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <div className="dashboard__chartCard">
          <div className="chartCard">
            <div className="chartCard__header">
              <div>
            <h3 className="chartCard__title">
              <TrendingUp size={20} />
              Progress Over Time
            </h3>
                <p className="chartCard__subtitle">
                  Track your improvement across all communication metrics
                </p>
              </div>
              {overallImprovement && (
                <div className="chartCard__summary">
                  <div className="chartCard__summaryLabel">Overall Improvement</div>
                  <div className="chartCard__summaryValue">
                    {Object.values(overallImprovement).filter(v => parseFloat(v) > 0).length} / 6 metrics improved
                  </div>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  domain={[0, 10]} 
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  label={{ value: 'Score (0-10)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                  iconSize={12}
                  formatter={(value) => <span style={{ fontSize: '12px', color: '#64748b' }}>{value}</span>}
                />
                <Line 
                  type="monotone" 
                  dataKey="presence" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  name="Presence"
                  dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="voice_expression" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  name="Voice"
                  dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="clarity" 
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  name="Clarity"
                  dot={{ fill: '#f59e0b', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="authenticity" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  name="Authenticity"
                  dot={{ fill: '#8b5cf6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="impact" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  name="Impact"
                  dot={{ fill: '#ef4444', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke="#06b6d4" 
                  strokeWidth={3} 
                  name="Confidence"
                  dot={{ fill: '#06b6d4', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Chart Explanation */}
            <div className="chartCard__explanation">
              <p className="chartCard__explanationText">
                <strong>How to read this chart:</strong> Each line represents a different communication metric. 
                Hover over any point to see detailed scores and improvements. Higher scores (closer to 10) indicate better performance.
                {chartData.length >= 2 && ' The improvement summary below shows your progress from first to latest session.'}
              </p>
            </div>
            
            {/* Improvement Summary */}
            {overallImprovement && chartData.length >= 2 && (
              <div className="chartCard__improvements">
                <h4 className="chartCard__improvementsTitle">Improvement Summary</h4>
                <div className="chartCard__improvementsGrid">
                  {Object.entries(overallImprovement).map(([key, value]) => {
                    const metricNames = {
                      presence: 'Presence',
                      voice: 'Voice',
                      clarity: 'Clarity',
                      authenticity: 'Authenticity',
                      impact: 'Impact',
                      confidence: 'Confidence'
                    };
                    const colors = {
                      presence: '#3b82f6',
                      voice: '#10b981',
                      clarity: '#f59e0b',
                      authenticity: '#8b5cf6',
                      impact: '#ef4444',
                      confidence: '#06b6d4'
                    };
                    const isPositive = parseFloat(value) > 0;
                    return (
                      <div key={key} className="chartCard__improvementItem">
                        <div className="chartCard__improvementHeader">
                          <span className="chartCard__improvementDot" style={{ backgroundColor: colors[key] }}></span>
                          <span className="chartCard__improvementLabel">{metricNames[key]}</span>
                        </div>
                        <div className={`chartCard__improvementValue ${isPositive ? 'positive' : 'negative'}`}>
                          {isPositive ? '+' : ''}{value} points
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Charts - Radar and Bar Comparison */}
      {chartData.length > 0 && (
        <div className="dashboard__chartsGrid">
          {/* Radar Chart - Current Performance */}
          {radarData.length > 0 && (
            <div className="dashboard__chartCard">
              <div className="chartCard">
                <div className="chartCard__header">
                  <div>
                    <h3 className="chartCard__title">
                      <Target size={20} />
                      Current Performance Profile
                    </h3>
                    <p className="chartCard__subtitle">
                      Your latest session across all metrics
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 10]} 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <Radar
                      name="Current"
                      dataKey="value"
                      stroke="#0ea5e9"
                      fill="#0ea5e9"
                      fillOpacity={0.6}
                      strokeWidth={2}
                    />
                    <Tooltip 
                      formatter={(value) => `${value.toFixed(1)}/10`}
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Bar Chart - Current vs Previous */}
          {barChartData.length > 0 && (
            <div className="dashboard__chartCard">
              <div className="chartCard">
                <div className="chartCard__header">
                  <div>
                    <h3 className="chartCard__title">
                      <BarChart3 size={20} />
                      Session Comparison
                    </h3>
                    <p className="chartCard__subtitle">
                      Latest vs previous session
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="metric" 
                      stroke="#64748b" 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      stroke="#64748b"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      label={{ value: 'Score (0-10)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
                    />
                    <Tooltip 
                      formatter={(value) => `${value.toFixed(1)}/10`}
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => <span style={{ fontSize: '12px', color: '#64748b' }}>{value}</span>}
                    />
                    <Bar dataKey="previous" fill="#94a3b8" name="Previous Session" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="current" fill="#0ea5e9" name="Latest Session" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="dashboard__grid">
        {/* Action Items To-Do List */}
        <div className="dashboard__journalCard">
          <div className="journalCard">
            <h3 className="journalCard__title">
              <ListTodo size={20} />
              Next Steps
            </h3>
            <div className="journalCard__list">
              {progressData.actionItems && progressData.actionItems.length > 0 ? (
                progressData.actionItems.slice(0, 10).map((item, idx) => (
                  <div key={item.id || idx} className="journalCard__actionCard">
                    <div className="journalCard__actionIcon">
                      <Sparkles size={16} />
                    </div>
                    <div className="journalCard__actionBody">
                      <div className="journalCard__actionMeta">
                        <span className="journalCard__chip">{formatMetricLabel(item.practice_prompt_target_metric)}</span>
                        <span className={`journalCard__chip ${item.status === 'completed' ? 'journalCard__chip--muted' : 'journalCard__chip--accent'}`}>
                          {item.status === 'completed' ? 'Completed' : 'Active focus'}
                        </span>
                      </div>
                      <div className="journalCard__actionTitle">{item.title}</div>
                      <ExpandableDashboardText text={formatActionDescription(item)} />
                      {item.analyses && (
                        <div className="journalCard__itemMeta">
                          Added {new Date(item.analyses.created_at).toLocaleDateString()} • {item.analyses.video_filename}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="journalCard__empty">No tips yet. Complete your first analysis to get personalized next steps.</p>
              )}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="dashboard__achievementsCard">
          <div className="achievementsCard">
            <h3 className="achievementsCard__title">
              <Trophy size={20} />
              Achievements
            </h3>
            <div className="achievementsCard__list">
              {progressData.achievements.length > 0 ? (
                progressData.achievements.map((userAchievement) => {
                  const achievement = userAchievement.achievement;
                  if (!achievement) return null;
                  return (
                    <div key={userAchievement.id} className="achievementBadge">
                      <div className="achievementBadge__icon">{achievement.icon || '🏆'}</div>
                      <div className="achievementBadge__info">
                        <div className="achievementBadge__title">{achievement.title}</div>
                        <div className="achievementBadge__description">{achievement.description}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="achievementsCard__empty">No achievements yet. Keep practicing to unlock badges!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {journeyModalOpen && (
        <div className="journeyModalOverlay">
          <div className="journeyModalCard">
            <div className="journeyModal__header">
              <div>
                <p className="journeyModal__eyebrow">New practice goal</p>
                <h3>Set a new practice goal</h3>
              </div>
              <button
                type="button"
                className="journeyModal__close"
                onClick={() => !journeyModalSubmitting && setJourneyModalOpen(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="journeyModal__body">
              <OnboardingQuestions onComplete={handleJourneyModalComplete} />
              {journeyModalSubmitting && (
                <div className="journeyModal__status">Creating your personalized dashboard…</div>
              )}
              {journeyModalError && (
                <div className="journeyModal__error">{journeyModalError}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
