import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useUser } from "@clerk/clerk-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
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
  ChevronDown,
} from "lucide-react";
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
  ResponsiveContainer,
} from "recharts";
import OnboardingQuestions from "./OnboardingQuestions";
import CelebrationModal from "./CelebrationModal";
import BeforeAfterComparison from "./BeforeAfterComparison";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";
import "./Dashboard.css";
import JourneySwitcher from "./JourneySwitcher";
import PracticeCommitmentAlert from "./PracticeCommitmentAlert";
function ExpandableDashboardText({ text, collapsedLines = 2 }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const shouldCollapse = text.length > 180;
  return (
    <div
      className={`journalCard__expandableText ${expanded ? "expanded" : ""}`}
    >
      <p
        className="journalCard__actionDescription"
        style={
          shouldCollapse && !expanded
            ? {
                display: "-webkit-box",
                WebkitLineClamp: collapsedLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
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
          {expanded ? "Show less" : "Show more"}
          <ChevronDown size={14} className={expanded ? "rotated" : ""} />
        </button>
      )}
    </div>
  );
}

// Dashboard Data Cache
const DASHBOARD_CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function Dashboard({
  onNewAnalysis,
  refreshTrigger,
  journeys = [],
  journeysLoading = false,
  activeJourneyId = null,
  onSelectJourney,
  onStartJourney,
}) {
  const { user } = useUser();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [localUserContext, setLocalUserContext] = useState(null);
  const [progressData, setProgressData] = useState({
    profile: null,
    metrics: [],
    insights: [],
    achievements: [],
    actionItems: [],
  });
  const [hasAnalyses, setHasAnalyses] = useState(false);
  const [journeyModalOpen, setJourneyModalOpen] = useState(false);
  const [journeyModalError, setJourneyModalError] = useState(null);
  const [journeyModalSubmitting, setJourneyModalSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  const [celebrationShownForSession, setCelebrationShownForSession] = useState(
    () => {
      // Check if we've already shown celebration for this session
      return sessionStorage.getItem("bodai_celebration_shown") === "true";
    },
  );
  const activeJourney = useMemo(
    () => journeys.find((journey) => journey.id === activeJourneyId) || null,
    [journeys, activeJourneyId],
  );

  // Memoize fetchProgressData to prevent unnecessary re-renders
  const fetchProgressData = useCallback(
    async (journeyIdParam = activeJourneyId, forceRefresh = false) => {
      if (!user) return;

      const cacheKey = `${user.id}_${journeyIdParam || 'default'}`;

      // Check cache first (unless forced refresh)
      if (!forceRefresh) {
        const cached = DASHBOARD_CACHE.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          console.log("Using cached dashboard data");
          setProgressData(cached.data);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (journeyIdParam) {
          params.append("journeyId", journeyIdParam);
        }
        // Use Vite proxy in dev, full URL in production
        const apiBase = import.meta.env.DEV
          ? "" // use Vite proxy in dev
          : (import.meta.env.VITE_API_URL || "http://localhost:5000");
        const endpoint = `${apiBase}/api/communication/progress${params.toString() ? `?${params.toString()}` : ""}`;
        
        const res = await fetch(endpoint, {
          headers: {
            "X-Clerk-User-Id": user.id,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          const newData = {
            profile: data.profile || null,
            metrics: data.metrics || [],
            insights: data.insights || [],
            achievements: data.achievements || [],
            actionItems: data.actionItems || [],
          };
          
          setProgressData(newData);
          
          // Update cache
          DASHBOARD_CACHE.set(cacheKey, {
            data: newData,
            timestamp: Date.now()
          });
        } else {
          console.error(
            "Failed to fetch dashboard data:",
            res.status,
            res.statusText,
          );
        }
      } catch (err) {
        console.error("Failed to fetch progress data:", err);
      } finally {
        setLoading(false);
      }
    },
    [user, activeJourneyId],
  );

  // Fetch analyses list (to detect if user already has analyses and hide the first-time hero)
  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!user) return;
      try {
        const apiBase = import.meta.env.DEV
          ? "" // use Vite proxy in dev
          : (import.meta.env.VITE_API_URL || "http://localhost:5000");
        const res = await fetch(`${apiBase}/api/analyses`, {
          headers: {
            "X-Clerk-User-Id": user.id,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          const count = data?.analyses?.length || 0;
          setHasAnalyses(count > 0);
        }
      } catch (err) {
        console.error("Failed to fetch analyses list:", err);
      }
    };

    fetchAnalyses();
  }, [user, refreshTrigger]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      // Also check localStorage for fallback
      const savedContext = localStorage.getItem("bodai_user_context");
      if (savedContext) {
        try {
          setLocalUserContext(JSON.parse(savedContext));
        } catch (e) {
          console.warn("Failed to parse saved context:", e);
        }
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch when journey or user changes
  useEffect(() => {
    if (user) {
      fetchProgressData(activeJourneyId);
    }
  }, [user, activeJourneyId, fetchProgressData]);

  // Handle refresh trigger
  useEffect(() => {
    if (user && refreshTrigger > 0) {
      fetchProgressData(activeJourneyId, true);
    }
  }, [refreshTrigger, user, activeJourneyId, fetchProgressData]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      // Build headers with Clerk profile data for syncing
      const headers = {
        "X-Clerk-User-Id": user.id,
        "Content-Type": "application/json",
      };

      // Add user profile data to headers for syncing with Supabase
      if (user.emailAddresses?.[0]?.emailAddress) {
        headers["X-User-Email"] = user.emailAddresses[0].emailAddress;
      }
      if (user.firstName) {
        headers["X-User-First-Name"] = user.firstName;
      }
      if (user.lastName) {
        headers["X-User-Last-Name"] = user.lastName;
      }
      if (user.phoneNumbers?.[0]?.phoneNumber) {
        headers["X-User-Phone"] = user.phoneNumbers[0].phoneNumber;
      }
      if (user.imageUrl) {
        headers["X-User-Image-Url"] = user.imageUrl;
      }

      // Use Vite proxy in dev, full URL in production
      const apiBase = import.meta.env.DEV
        ? "" // use Vite proxy in dev
        : (import.meta.env.VITE_API_URL || "http://localhost:5000");
      const res = await fetch(`${apiBase}/api/user/profile`, {
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
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
      console.error("Failed to create journey:", err);
      setJourneyModalError(
        err.message ||
          t(
            "dashboard.journeyModalErrorFallback",
            "Failed to create focus. Please try again.",
          ),
      );
    } finally {
      setJourneyModalSubmitting(false);
    }
  };

  const formatActionDescription = (item) => {
    if (!item) return "";
    const details = item.details || {};

    if (typeof details === "string") {
      return details;
    }

    const text =
      details.why_it_matters ||
      details.what_to_do ||
      (Array.isArray(details.all_details) ? details.all_details[0] : null) ||
      "";

    if (!text) {
      return t(
        "dashboard.noActionDescription",
        "Keep this focus in mind for your next recording.",
      );
    }

    return text;
  };

  const formatMetricLabel = (metric) => {
    if (!metric) return t("parameters.metrics.overall");
    const labels = {
      presence: t("parameters.metrics.presence"),
      voice_expression: t("parameters.metrics.voice"),
      clarity: t("parameters.metrics.clarity"),
      authenticity: t("parameters.metrics.authenticity"),
      impact: t("parameters.metrics.impact"),
      confidence: t("parameters.metrics.confidence"),
      overall: t("parameters.metrics.overall"),
    };
    return labels[metric] || t("parameters.metrics.overall");
  };

  function ExpandableDashboardText({ text, collapsedLines = 2 }) {
    const [expanded, setExpanded] = useState(false);
    if (!text) return null;
    const shouldCollapse = text.length > 180;
    return (
      <div
        className={`journalCard__expandableText ${expanded ? "expanded" : ""}`}
      >
        <p
          className="journalCard__actionDescription"
          style={
            shouldCollapse && !expanded
              ? {
                  display: "-webkit-box",
                  WebkitLineClamp: collapsedLines,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
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
            {expanded ? "Show less" : "Show more"}
            <ChevronDown size={14} className={expanded ? "rotated" : ""} />
          </button>
        )}
      </div>
    );
  }

  const getGoalIcon = (goal) => {
    const goalIcons = {
      confidence: Dumbbell,
      content: Video,
      presentation: Mic,
      leadership: Award,
      interview: Briefcase,
      sales: Users,
    };
    return goalIcons[goal] || Target;
  };

  const getGoalLabel = (goal) => {
    const goalMap = {
      confidence: t("myProgress.goals.confidence", "Build Confidence"),
      content: t("myProgress.goals.content", "Content Creator"),
      presentation: t("myProgress.goals.presentation", "Presentation Skills"),
      leadership: t("myProgress.goals.leadership", "Executive Presence"),
      interview: t("myProgress.goals.interview", "Job Interviews"),
      sales: t("myProgress.goals.sales", "Face-to-face Sales"),
    };
    return goalMap[goal] || goal;
  };

  const getConfidenceLabel = (level) => {
    const levelMap = {
      "very-high": t("confidence.levels.veryHigh", "Very Confident"),
      high: t("confidence.levels.high", "Confident"),
      medium: t("confidence.levels.medium", "Moderate"),
      low: t("confidence.levels.low", "Not Very Confident"),
      "very-low": t("confidence.levels.veryLow", "Very Insecure"),
    };
    return levelMap[level] || level;
  };

  const getStageLabel = (stageTitle) => {
    if (!stageTitle)
      return t("dashboard.defaultStage", "Emerging Communicator");
    const stages = {
      "Emerging Communicator": t(
        "dashboard.stages.emerging",
        "Emerging Communicator",
      ),
      "Developing Communicator": t(
        "dashboard.stages.developing",
        "Developing Communicator",
      ),
      "Confident Communicator": t(
        "dashboard.stages.confident",
        "Confident Communicator",
      ),
      "Impactful Communicator": t(
        "dashboard.stages.impactful",
        "Impactful Communicator",
      ),
      "Master Communicator": t(
        "dashboard.stages.master",
        "Master Communicator",
      ),
    };
    return stages[stageTitle] || stageTitle;
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
      name: `${t("myProgress.charts.session", "Session")} ${index + 1}`,
      date: metric.analyses?.created_at
        ? new Date(metric.analyses.created_at).toLocaleDateString(
            i18n.language === 'he' ? 'he-IL' : 'en-US',
            { month: "short", day: "numeric" },
          )
        : "",
      presence,
      voice_expression: voice,
      clarity,
      authenticity,
      impact,
      confidence,
      // Calculate improvements
      presenceChange: prevMetric
        ? (presence - (parseFloat(prevMetric.presence) || 0)).toFixed(1)
        : null,
      voiceChange: prevMetric
        ? (voice - (parseFloat(prevMetric.voice_expression) || 0)).toFixed(1)
        : null,
      clarityChange: prevMetric
        ? (clarity - (parseFloat(prevMetric.clarity) || 0)).toFixed(1)
        : null,
      authenticityChange: prevMetric
        ? (authenticity - (parseFloat(prevMetric.authenticity) || 0)).toFixed(1)
        : null,
      impactChange: prevMetric
        ? (impact - (parseFloat(prevMetric.impact) || 0)).toFixed(1)
        : null,
      confidenceChange: prevMetric
        ? (confidence - (parseFloat(prevMetric.confidence) || 0)).toFixed(1)
        : null,
    };
  });

  // Calculate overall improvement
  const overallImprovement =
    chartData.length >= 2
      ? {
          presence: (
            chartData[chartData.length - 1].presence - chartData[0].presence
          ).toFixed(1),
          voice: (
            chartData[chartData.length - 1].voice_expression -
            chartData[0].voice_expression
          ).toFixed(1),
          clarity: (
            chartData[chartData.length - 1].clarity - chartData[0].clarity
          ).toFixed(1),
          authenticity: (
            chartData[chartData.length - 1].authenticity -
            chartData[0].authenticity
          ).toFixed(1),
          impact: (
            chartData[chartData.length - 1].impact - chartData[0].impact
          ).toFixed(1),
          confidence: (
            chartData[chartData.length - 1].confidence - chartData[0].confidence
          ).toFixed(1),
        }
      : null;

  // Prepare radar chart data (current performance)
  const radarData =
    chartData.length > 0
      ? [
          {
            metric: t("parameters.metrics.presence"),
            value: chartData[chartData.length - 1].presence,
            fullMark: 10,
          },
          {
            metric: t("parameters.metrics.voice"),
            value: chartData[chartData.length - 1].voice_expression,
            fullMark: 10,
          },
          {
            metric: t("parameters.metrics.clarity"),
            value: chartData[chartData.length - 1].clarity,
            fullMark: 10,
          },
          {
            metric: t("parameters.metrics.authenticity"),
            value: chartData[chartData.length - 1].authenticity,
            fullMark: 10,
          },
          {
            metric: t("parameters.metrics.impact"),
            value: chartData[chartData.length - 1].impact,
            fullMark: 10,
          },
          {
            metric: t("parameters.metrics.confidence"),
            value: chartData[chartData.length - 1].confidence,
            fullMark: 10,
          },
        ]
      : [];

  // Prepare bar chart data (current vs previous session)
  const barChartData =
    chartData.length >= 2
      ? [
          {
            metric: t("parameters.metrics.presence"),
            current: chartData[chartData.length - 1].presence,
            previous: chartData[chartData.length - 2].presence,
          },
          {
            metric: t("parameters.metrics.voice"),
            current: chartData[chartData.length - 1].voice_expression,
            previous: chartData[chartData.length - 2].voice_expression,
          },
          {
            metric: t("parameters.metrics.clarity"),
            current: chartData[chartData.length - 1].clarity,
            previous: chartData[chartData.length - 2].clarity,
          },
          {
            metric: t("parameters.metrics.authenticity"),
            current: chartData[chartData.length - 1].authenticity,
            previous: chartData[chartData.length - 2].authenticity,
          },
          {
            metric: t("parameters.metrics.impact"),
            current: chartData[chartData.length - 1].impact,
            previous: chartData[chartData.length - 2].impact,
          },
          {
            metric: t("parameters.metrics.confidence"),
            current: chartData[chartData.length - 1].confidence,
            previous: chartData[chartData.length - 2].confidence,
          },
        ]
      : [];

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
              presence: "presenceChange",
              voice_expression: "voiceChange",
              clarity: "clarityChange",
              authenticity: "authenticityChange",
              impact: "impactChange",
              confidence: "confidenceChange",
            };
            const changeKey =
              changeKeyMap[entry.dataKey] || `${entry.dataKey}Change`;
            const change = dataPoint?.[changeKey];
            return (
              <div key={index} className="chartTooltip__item">
                <div className="chartTooltip__itemHeader">
                  <span
                    className="chartTooltip__dot"
                    style={{ backgroundColor: entry.color }}
                  ></span>
                  <span className="chartTooltip__label">{entry.name}:</span>
                  <span className="chartTooltip__value">
                    {entry.value?.toFixed(1) || 0}/10
                  </span>
                </div>
                {change && parseFloat(change) !== 0 && (
                  <div
                    className={`chartTooltip__change ${parseFloat(change) > 0 ? "positive" : "negative"}`}
                  >
                    {parseFloat(change) > 0 ? "↑" : "↓"}{" "}
                    {Math.abs(parseFloat(change))}{" "}
                    {t("myProgress.vsPrevious", "from previous")}
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
  const focusSlug =
    activeJourney?.focus_slug ||
    userProfile?.primary_goal ||
    localUserContext?.primaryGoal;
  // Derive focusLabel: prefer getGoalLabel if we have a valid slug, otherwise use journey's display_name
  // This ensures we show the proper translated label instead of generic "Custom journey"
  const focusLabel = focusSlug
    ? getGoalLabel(focusSlug)
    : activeJourney?.display_name || activeJourney?.focus_label || null;
  const focusConfidence =
    activeJourney?.confidence_level ||
    userProfile?.confidence_level ||
    localUserContext?.confidenceLevel;

  // Get user's name for personalization
  const userName =
    user?.firstName ||
    userProfile?.first_name ||
    userProfile?.full_name?.split(" ")[0] ||
    null;

  // Calculate score trend (compare latest with previous)
  const scoreTrend = useMemo(() => {
    if (
      !latestMetrics ||
      !progressData.metrics ||
      progressData.metrics.length < 2
    )
      return null;
    const currentScore = parseFloat(latestMetrics.overall_score) || 0;
    const previousMetric =
      progressData.metrics[progressData.metrics.length - 2];
    const previousScore = parseFloat(previousMetric?.overall_score) || 0;
    const change = currentScore - previousScore;
    if (Math.abs(change) < 0.5) return null; // Ignore changes less than 0.5 points
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0,
      currentScore,
      previousScore,
      improvement: change,
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
          metric: "overall",
        });
        setShowCelebration(true);
        setCelebrationShownForSession(true);
        sessionStorage.setItem("bodai_celebration_shown", "true");
      }
    }
  }, [scoreTrend, celebrationShownForSession, loading]);

  const handleCloseCelebration = () => {
    setShowCelebration(false);
  };

  // Check if user is new (no analyses yet) - fall back to analyses list if metrics are empty
  const isNewUser =
    (!progressData.metrics || progressData.metrics.length === 0) &&
    !hasAnalyses;

  // Show dashboard content if user has analyses OR metrics (even if metrics are still loading)
  const hasDashboardData = hasAnalyses || (progressData.metrics && progressData.metrics.length > 0) || latestMetrics;

  // Generate dynamic, encouraging title based on user's goal and whether they're new
  const getDashboardTitle = () => {
    // For new users, always show a welcome message
    if (isNewUser) {
      if (userName) {
        return t("dashboard.welcomeTitleWithName", "Welcome, {{name}}!", {
          name: userName,
        });
      }
      return t("dashboard.welcomeTitle", "Welcome to BodAI!");
    }

    if (!focusLabel && !userName) {
      return t("dashboard.yourDashboard", "Your Dashboard");
    }

    // Map focus labels to short, punchy title templates for returning users
    const titleTemplates = {
      "Build Self-Confidence": [
        userName
          ? t("dashboard.titleTemplates.confidence.heyNameReady", {
              defaultValue: "Hey {{name}}! Ready to shine?",
              name: userName,
            })
          : t("dashboard.titleTemplates.confidence.ready", "Ready to shine?"),
        userName
          ? t("dashboard.titleTemplates.confidence.welcomeBackName", {
              defaultValue: "Welcome back, {{name}}!",
              name: userName,
            })
          : t(
              "dashboard.titleTemplates.confidence.welcomeBack",
              "Welcome back!",
            ),
        userName
          ? t("dashboard.titleTemplates.confidence.nameBuild", {
              defaultValue: "{{name}}, let's build confidence",
              name: userName,
            })
          : t(
              "dashboard.titleTemplates.confidence.build",
              "Let's build confidence",
            ),
      ],
      "Build Confidence": [
        userName
          ? t("dashboard.titleTemplates.confidence.heyNameReady", {
              defaultValue: "Hey {{name}}! Ready to shine?",
              name: userName,
            })
          : t("dashboard.titleTemplates.confidence.ready", "Ready to shine?"),
        userName
          ? t("dashboard.titleTemplates.confidence.welcomeBackName", {
              defaultValue: "Welcome back, {{name}}!",
              name: userName,
            })
          : t(
              "dashboard.titleTemplates.confidence.welcomeBack",
              "Welcome back!",
            ),
        userName
          ? t("dashboard.titleTemplates.confidence.nameBuild", {
              defaultValue: "{{name}}, let's build confidence",
              name: userName,
            })
          : t(
              "dashboard.titleTemplates.confidence.build",
              "Let's build confidence",
            ),
      ],
      "Job Interview Preparation": [
        userName
          ? t("dashboard.titleTemplates.interview.heyNameAce", {
              defaultValue: "Hey {{name}}! Let's ace it",
              name: userName,
            })
          : t("dashboard.titleTemplates.interview.ace", "Let's ace it"),
        userName
          ? t("dashboard.titleTemplates.generic.welcomeBackName", {
              defaultValue: "Welcome back, {{name}}!",
              name: userName,
            })
          : t("dashboard.titleTemplates.generic.welcomeBack", "Welcome back!"),
        userName
          ? t("dashboard.titleTemplates.interview.nameImpress", {
              defaultValue: "{{name}}, ready to impress?",
              name: userName,
            })
          : t(
              "dashboard.titleTemplates.interview.impress",
              "Ready to impress?",
            ),
      ],
      "Improve Presentations": [
        userName
          ? t("dashboard.titleTemplates.presentation.heyNameCaptivate", {
              defaultValue: "Hey {{name}}! Let's captivate",
              name: userName,
            })
          : t(
              "dashboard.titleTemplates.presentation.captivate",
              "Let's captivate",
            ),
        userName
          ? t("dashboard.titleTemplates.generic.welcomeBackName", {
              defaultValue: "Welcome back, {{name}}!",
              name: userName,
            })
          : t("dashboard.titleTemplates.generic.welcomeBack", "Welcome back!"),
        userName
          ? t("dashboard.titleTemplates.presentation.namePresent", {
              defaultValue: "{{name}}, ready to present?",
              name: userName,
            })
          : t(
              "dashboard.titleTemplates.presentation.present",
              "Ready to present?",
            ),
      ],
      "Presentation Skills": [
        userName
          ? t("dashboard.titleTemplates.presentation.heyNameCaptivate", {
              defaultValue: "Hey {{name}}! Let's captivate",
              name: userName,
            })
          : t(
              "dashboard.titleTemplates.presentation.captivate",
              "Let's captivate",
            ),
        userName
          ? t("dashboard.titleTemplates.generic.welcomeBackName", {
              defaultValue: "Welcome back, {{name}}!",
              name: userName,
            })
          : t("dashboard.titleTemplates.generic.welcomeBack", "Welcome back!"),
        userName
          ? t("dashboard.titleTemplates.presentation.namePresent", {
              defaultValue: "{{name}}, ready to present?",
              name: userName,
            })
          : t(
              "dashboard.titleTemplates.presentation.present",
              "Ready to present?",
            ),
      ],
      "Better Communication": [
        userName
          ? t("dashboard.titleTemplates.communication.heyNameConnect", {
              defaultValue: "Hey {{name}}! Let's connect",
              name: userName,
            })
          : t(
              "dashboard.titleTemplates.communication.connect",
              "Let's connect",
            ),
        userName
          ? t("dashboard.titleTemplates.generic.welcomeBackName", {
              defaultValue: "Welcome back, {{name}}!",
              name: userName,
            })
          : t("dashboard.titleTemplates.generic.welcomeBack", "Welcome back!"),
        userName
          ? t("dashboard.titleTemplates.communication.nameGrow", {
              defaultValue: "{{name}}, ready to grow?",
              name: userName,
            })
          : t("dashboard.titleTemplates.communication.grow", "Ready to grow?"),
      ],
      "Leadership Presence": [
        userName
          ? t("dashboard.titleTemplates.leadership.heyNameLead", {
              defaultValue: "Hey {{name}}! Let's lead",
              name: userName,
            })
          : t("dashboard.titleTemplates.leadership.lead", "Let's lead"),
        userName
          ? t("dashboard.titleTemplates.generic.welcomeBackName", {
              defaultValue: "Welcome back, {{name}}!",
              name: userName,
            })
          : t("dashboard.titleTemplates.generic.welcomeBack", "Welcome back!"),
        userName
          ? t("dashboard.titleTemplates.leadership.nameInspire", {
              defaultValue: "{{name}}, ready to inspire?",
              name: userName,
            })
          : t(
              "dashboard.titleTemplates.leadership.inspire",
              "Ready to inspire?",
            ),
      ],
      "Executive Presence": [
        userName
          ? t("dashboard.titleTemplates.leadership.heyNameLead", {
              defaultValue: "Hey {{name}}! Let's lead",
              name: userName,
            })
          : t("dashboard.titleTemplates.leadership.lead", "Let's lead"),
        userName
          ? t("dashboard.titleTemplates.generic.welcomeBackName", {
              defaultValue: "Welcome back, {{name}}!",
              name: userName,
            })
          : t("dashboard.titleTemplates.generic.welcomeBack", "Welcome back!"),
        userName
          ? t("dashboard.titleTemplates.leadership.nameInspire", {
              defaultValue: "{{name}}, ready to inspire?",
              name: userName,
            })
          : t(
              "dashboard.titleTemplates.leadership.inspire",
              "Ready to inspire?",
            ),
      ],
      "Content Creator": [
        userName
          ? t("dashboard.titleTemplates.content.heyNameCreate", {
              defaultValue: "Hey {{name}}! Ready to create?",
              name: userName,
            })
          : t("dashboard.titleTemplates.content.create", "Ready to create?"),
        userName
          ? t("dashboard.titleTemplates.generic.welcomeBackName", {
              defaultValue: "Welcome back, {{name}}!",
              name: userName,
            })
          : t("dashboard.titleTemplates.generic.welcomeBack", "Welcome back!"),
        userName
          ? t("dashboard.titleTemplates.content.nameMake", {
              defaultValue: "{{name}}, let's make great content",
              name: userName,
            })
          : t(
              "dashboard.titleTemplates.content.make",
              "Let's make great content",
            ),
      ],
      "Dating & Romantic": [
        userName
          ? t("dashboard.titleTemplates.dating.heyNameConnect", {
              defaultValue: "Hey {{name}}! Let's connect",
              name: userName,
            })
          : t("dashboard.titleTemplates.dating.connect", "Let's connect"),
        userName
          ? t("dashboard.titleTemplates.generic.welcomeBackName", {
              defaultValue: "Welcome back, {{name}}!",
              name: userName,
            })
          : t("dashboard.titleTemplates.generic.welcomeBack", "Welcome back!"),
        userName
          ? t("dashboard.titleTemplates.dating.nameImpress", {
              defaultValue: "{{name}}, ready to impress?",
              name: userName,
            })
          : t("dashboard.titleTemplates.dating.impress", "Ready to impress?"),
      ],
      "Social Confidence": [
        userName
          ? t("dashboard.titleTemplates.social.heyNameSocialize", {
              defaultValue: "Hey {{name}}! Let's socialize",
              name: userName,
            })
          : t("dashboard.titleTemplates.social.socialize", "Let's socialize"),
        userName
          ? t("dashboard.titleTemplates.generic.welcomeBackName", {
              defaultValue: "Welcome back, {{name}}!",
              name: userName,
            })
          : t("dashboard.titleTemplates.generic.welcomeBack", "Welcome back!"),
        userName
          ? t("dashboard.titleTemplates.social.nameShine", {
              defaultValue: "{{name}}, ready to shine?",
              name: userName,
            })
          : t("dashboard.titleTemplates.social.shine", "Ready to shine?"),
      ],
      "General Improvement": [
        userName
          ? t("dashboard.titleTemplates.generic.heyNameGrow", {
              defaultValue: "Hey {{name}}! Let's grow",
              name: userName,
            })
          : t("dashboard.titleTemplates.generic.grow", "Let's grow"),
        userName
          ? t("dashboard.titleTemplates.generic.welcomeBackName", {
              defaultValue: "Welcome back, {{name}}!",
              name: userName,
            })
          : t("dashboard.titleTemplates.generic.welcomeBack", "Welcome back!"),
        userName
          ? t("dashboard.titleTemplates.generic.nameImprove", {
              defaultValue: "{{name}}, ready to improve?",
              name: userName,
            })
          : t("dashboard.titleTemplates.generic.improve", "Ready to improve?"),
      ],
    };

    // Find matching templates for the focus label
    const templates =
      titleTemplates[focusLabel] ||
      titleTemplates[
        Object.keys(titleTemplates).find((key) => focusLabel?.includes(key)) ||
          ""
      ] ||
      [];

    // If we have templates, pick one based on a simple hash of the user ID for consistency
    if (templates.length > 0) {
      const userHash = user?.id ? user.id.charCodeAt(0) : 0;
      return templates[userHash % templates.length];
    }

    // Fallback: generic encouraging title
    if (userName) {
      return t("dashboard.titleTemplates.generic.welcomeBackName", {
        defaultValue: "Welcome back, {{name}}!",
        name: userName,
      });
    }
    return t("dashboard.yourDashboard", "Your Dashboard");
  };

  if (loading) {
    return (
      <div className="dashboard">
        <LoadingSpinner message={t("dashboard.loading")} size="large" />
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
        metric={celebrationData?.metric || "overall"}
        currentScore={celebrationData?.currentScore || 0}
        previousScore={celebrationData?.previousScore || 0}
      />

      <JourneySwitcher
        className="dashboard__journeyTabs"
        journeys={journeys}
        journeysLoading={journeysLoading}
        activeJourneyId={activeJourneyId}
        onSelectJourney={onSelectJourney}
        onAddJourney={
          onStartJourney ? () => setJourneyModalOpen(true) : undefined
        }
      />

      {/* Practice Commitment Alert */}
      <PracticeCommitmentAlert journeyId={activeJourneyId} />

      {/* Header */}
      <div className="dashboard__header">
        <div className="dashboard__headerContent">
          <h1 className="dashboard__title">{getDashboardTitle()}</h1>
          {!isNewUser && (
            <button className="btn btn--primary" onClick={onNewAnalysis}>
              + {t("dashboard.newAnalysis")}
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
                <h2 className="dashboard__welcomeTitle">
                  {t("dashboard.welcomeCardTitle")}
                </h2>
                <p className="dashboard__welcomeSubtitle">
                  {t("dashboard.welcomeCardSubtitle")}
                </p>
              </div>
            </div>

            <div className="dashboard__welcomeSteps">
              <div className="dashboard__welcomeStep">
                <span className="dashboard__stepNumber">1</span>
                <div className="dashboard__stepContent">
                  <strong>{t("dashboard.welcomeStep1Title")}</strong>
                  <p>{t("dashboard.welcomeStep1Text")}</p>
                </div>
              </div>
              <div className="dashboard__welcomeStep">
                <span className="dashboard__stepNumber">2</span>
                <div className="dashboard__stepContent">
                  <strong>{t("dashboard.welcomeStep2Title")}</strong>
                  <p>{t("dashboard.welcomeStep2Text")}</p>
                </div>
              </div>
              <div className="dashboard__welcomeStep">
                <span className="dashboard__stepNumber">3</span>
                <div className="dashboard__stepContent">
                  <strong>{t("dashboard.welcomeStep3Title")}</strong>
                  <p>{t("dashboard.welcomeStep3Text")}</p>
                </div>
              </div>
            </div>

            {/* Sample Script Suggestion */}
            {focusSlug && (
              <div className="dashboard__sampleScript">
                <h3 className="dashboard__sampleScriptTitle">
                  {t("dashboard.sampleScriptTitle")}
                </h3>
                <div className="dashboard__sampleScriptContent">
                  {focusSlug === "content" && (
                    <p>{t("dashboard.sampleScriptContent")}</p>
                  )}
                  {focusSlug === "leadership" && (
                    <p>{t("dashboard.sampleScriptContent")}</p>
                  )}
                  {focusSlug === "confidence" && (
                    <p>{t("dashboard.sampleScriptContent")}</p>
                  )}
                  {focusSlug === "presentation" && (
                    <p>{t("dashboard.sampleScriptContent")}</p>
                  )}
                  {![
                    "content",
                    "leadership",
                    "confidence",
                    "presentation",
                  ].includes(focusSlug) && (
                    <p>{t("dashboard.sampleScriptContent")}</p>
                  )}
                </div>
              </div>
            )}

            <button
              className="btn btn--primary btn--large dashboard__welcomeCta"
              onClick={onNewAnalysis}
            >
              {t("dashboard.welcomeCta")}
            </button>

            <p className="dashboard__welcomeNote">
              {t("dashboard.welcomeNote")}
            </p>
          </div>
        </div>
      )}

      {/* Profile Card - Show if we have metrics OR if user has analyses (metrics might be loading) */}
      {(latestMetrics || hasAnalyses) && (
        <div className="dashboard__profileCard">
          <div className="profileCard">
            {latestMetrics ? (
              <>
                <div className="profileCard__score">
                  <div className="profileCard__scoreLabel">
                    {t("dashboard.scoreLabel")}
                  </div>
                  <div className="profileCard__scoreValue">
                    {Math.round(latestMetrics.overall_score || 0)}
                    {scoreTrend && (
                      <span
                        className={`profileCard__trend ${
                          scoreTrend.isPositive ? "positive" : "negative"
                        }`}
                      >
                        {scoreTrend.isPositive ? "↑" : "↓"} {scoreTrend.value}
                      </span>
                    )}
                  </div>
                </div>
                <div className="profileCard__info">
                  <h2 className="profileCard__stage">
                    {getStageLabel(latestMetrics.stage_title)}
                  </h2>
                  {latestInsight && (
                    <p className="profileCard__insight">{latestInsight.content}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="profileCard__info">
                <h2 className="profileCard__stage">
                  {t("dashboard.loadingMetrics", "Loading your metrics...")}
                </h2>
                <p className="profileCard__insight">
                  {t("dashboard.loadingMetricsText", "We're processing your analyses. Your scores will appear here soon.")}
                </p>
              </div>
            )}
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
                <h3 className="goalsCard__title">{t("dashboard.yourFocus")}</h3>
                <p className="goalsCard__goal">{focusLabel}</p>
              </div>
            </div>
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
                  {t("dashboard.progressOverTimeTitle")}
                </h3>
                <p className="chartCard__subtitle">
                  {t("dashboard.progressOverTimeSubtitle")}
                </p>
              </div>
              {overallImprovement && (
                <div className="chartCard__summary">
                  <div className="chartCard__summaryLabel">
                    {t("dashboard.overallImprovement")}
                  </div>
                  <div className="chartCard__summaryValue">
                    {t("dashboard.overallImprovementSummary", {
                      count: Object.values(overallImprovement).filter(
                        (v) => parseFloat(v) > 0,
                      ).length,
                    })}
                  </div>
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  domain={[0, 10]}
                  stroke="#64748b"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickLine={{ stroke: "#cbd5e1" }}
                  label={{
                    value: t("myProgress.charts.scoreAxis", "Score (0-10)"),
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle", fill: "#64748b" },
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="line"
                  iconSize={12}
                  formatter={(value) => (
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {value}
                    </span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="presence"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name={t("parameters.metrics.presence")}
                  dot={{
                    fill: "#3b82f6",
                    r: 5,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="voice_expression"
                  stroke="#10b981"
                  strokeWidth={3}
                  name={t("parameters.metrics.voice")}
                  dot={{
                    fill: "#10b981",
                    r: 5,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="clarity"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name={t("parameters.metrics.clarity")}
                  dot={{
                    fill: "#f59e0b",
                    r: 5,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="authenticity"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  name={t("parameters.metrics.authenticity")}
                  dot={{
                    fill: "#8b5cf6",
                    r: 5,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="impact"
                  stroke="#ef4444"
                  strokeWidth={3}
                  name={t("parameters.metrics.impact")}
                  dot={{
                    fill: "#ef4444",
                    r: 5,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  name={t("parameters.metrics.confidence")}
                  dot={{
                    fill: "#06b6d4",
                    r: 5,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Chart Explanation */}
            <div className="chartCard__explanation">
              <p className="chartCard__explanationText">
                <strong>{t("dashboard.chartHowToReadTitle")}</strong>{" "}
                {t("dashboard.chartHowToReadText")}
                {chartData.length >= 2 && t("dashboard.chartHowToReadTail")}
              </p>
            </div>

            {/* Improvement Summary */}
            {overallImprovement && chartData.length >= 2 && (
              <div className="chartCard__improvements">
                <h4 className="chartCard__improvementsTitle">
                  {t("dashboard.overallImprovement", "Improvement Summary")}
                </h4>
                <div className="chartCard__improvementsGrid">
                  {Object.entries(overallImprovement).map(([key, value]) => {
                    const metricNames = {
                      presence: t("parameters.metrics.presence"),
                      voice: t("parameters.metrics.voice"),
                      clarity: t("parameters.metrics.clarity"),
                      authenticity: t("parameters.metrics.authenticity"),
                      impact: t("parameters.metrics.impact"),
                      confidence: t("parameters.metrics.confidence"),
                    };
                    const colors = {
                      presence: "#3b82f6",
                      voice: "#10b981",
                      clarity: "#f59e0b",
                      authenticity: "#8b5cf6",
                      impact: "#ef4444",
                      confidence: "#06b6d4",
                    };
                    const isPositive = parseFloat(value) > 0;
                    return (
                      <div key={key} className="chartCard__improvementItem">
                        <div className="chartCard__improvementHeader">
                          <span
                            className="chartCard__improvementDot"
                            style={{ backgroundColor: colors[key] }}
                          ></span>
                          <span className="chartCard__improvementLabel">
                            {metricNames[key]}
                          </span>
                        </div>
                        <div
                          className={`chartCard__improvementValue ${isPositive ? "positive" : "negative"}`}
                        >
                          {isPositive ? "+" : ""}
                          {value} {t("common.units.points")}
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
                      {t("dashboard.currentProfileTitle")}
                    </h3>
                    <p className="chartCard__subtitle">
                      {t("dashboard.currentProfileSubtitle")}
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 10]}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                    />
                    <Radar
                      name={t("myProgress.charts.now", "Current")}
                      dataKey="value"
                      stroke="#0ea5e9"
                      fill="#0ea5e9"
                      fillOpacity={0.6}
                      strokeWidth={2}
                    />
                    <Tooltip
                      formatter={(value) => `${value.toFixed(1)}/10`}
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#f1f5f9",
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
                      {t("dashboard.sessionComparisonTitle")}
                    </h3>
                    <p className="chartCard__subtitle">
                      {t("dashboard.sessionComparisonSubtitle")}
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={barChartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="metric"
                      stroke="#64748b"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickLine={{ stroke: "#cbd5e1" }}
                    />
                    <YAxis
                      domain={[0, 10]}
                      stroke="#64748b"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickLine={{ stroke: "#cbd5e1" }}
                      label={{
                        value: t("myProgress.charts.scoreAxis", "Score (0-10)"),
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle", fill: "#64748b" },
                      }}
                    />
                    <Tooltip
                      formatter={(value) => `${value.toFixed(1)}/10`}
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#f1f5f9",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      formatter={(value) => (
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          {value}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="previous"
                      fill="#94a3b8"
                      name={t(
                        "myProgress.charts.previousSession",
                        "Previous Session",
                      )}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="current"
                      fill="#0ea5e9"
                      name={t(
                        "myProgress.charts.latestSession",
                        "Latest Session",
                      )}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* One Next Action Card - Enhanced with Priority */}
      {(() => {
        // Prioritize: Practice Missions > Action Items with practice prompts > Regular action items
        const practiceMissions =
          progressData.actionItems?.filter(
            (item) => item.practice_prompt_generated,
          ) || [];
        const regularActionItems =
          progressData.actionItems?.filter(
            (item) => !item.practice_prompt_generated,
          ) || [];

        const topActionItem =
          practiceMissions.length > 0
            ? practiceMissions[0]
            : regularActionItems.length > 0
              ? regularActionItems[0]
              : null;

        const nextAction = topActionItem;
        if (!nextAction) return null;

        const isPracticeMission = nextAction.practice_prompt_generated;

        return (
          <div className="dashboard__nextActionCard">
            <div
              className={`nextActionCard ${isPracticeMission ? "nextActionCard--priority" : ""}`}
            >
              {isPracticeMission && (
                <div className="nextActionCard__priorityBadge">
                  <Sparkles size={14} />
                  <span>{t("dashboard.priorityPracticeBadge")}</span>
                </div>
              )}
              <div className="nextActionCard__header">
                <Target size={24} className="nextActionCard__icon" />
                <div>
                  <h3 className="nextActionCard__title">
                    {isPracticeMission
                      ? t("dashboard.priorityPracticeTitle")
                      : t("dashboard.nextActionTitle")}
                  </h3>
                  <p className="nextActionCard__subtitle">
                    {isPracticeMission
                      ? t("dashboard.priorityPracticeSubtitle")
                      : t("dashboard.nextActionSubtitle")}
                  </p>
                </div>
              </div>
              <div className="nextActionCard__content">
                <div className="nextActionCard__meta">
                  <span className="nextActionCard__chip">
                    {formatMetricLabel(
                      nextAction.practice_prompt_target_metric,
                    )}
                  </span>
                  <span
                    className={`nextActionCard__chip ${isPracticeMission ? "nextActionCard__chip--priority" : "nextActionCard__chip--accent"}`}
                  >
                    {isPracticeMission
                      ? t("dashboard.practiceMissionChip")
                      : t("dashboard.actionItemChip")}
                  </span>
                </div>
                <h4 className="nextActionCard__actionTitle">
                  {nextAction.title}
                </h4>
                <p className="nextActionCard__actionDescription">
                  {formatActionDescription(nextAction)}
                </p>
              </div>
              <div className="nextActionCard__actions">
                <button
                  className="btn btn--primary"
                  onClick={() => navigate("/practice")}
                >
                  {isPracticeMission
                    ? t("dashboard.startPracticeMission")
                    : t("dashboard.startPracticing")}
                </button>
                <button
                  className="btn btn--ghost"
                  onClick={() => navigate("/practice")}
                >
                  {t("dashboard.viewAllPractice")}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Achievements */}
      <div className="dashboard__achievementsCard">
        <div className="achievementsCard">
          <h3 className="achievementsCard__title">
            <Trophy size={20} />
            {t("dashboard.achievementsTitle")}
          </h3>
          <div className="achievementsCard__list">
            {progressData.achievements.length > 0 ? (
              progressData.achievements.map((userAchievement) => {
                const achievement = userAchievement.achievement;
                if (!achievement) return null;
                return (
                  <div key={userAchievement.id} className="achievementBadge">
                    <div className="achievementBadge__icon">
                      {achievement.icon || "🏆"}
                    </div>
                    <div className="achievementBadge__info">
                      <div className="achievementBadge__title">
                        {achievement.title}
                      </div>
                      <div className="achievementBadge__description">
                        {achievement.description}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                variant="achievements"
                title={t("dashboard.noAchievementsTitle")}
                description={t("dashboard.noAchievementsDescription")}
                showIllustration={false}
              />
            )}
          </div>
        </div>
      </div>

      {journeyModalOpen && (
        <div className="journeyModalOverlay">
          <div className="journeyModalCard">
            <div className="journeyModal__header">
              <div>
                <p className="journeyModal__eyebrow">
                  {t("dashboard.journeyModalEyebrow", "New practice goal")}
                </p>
                <h3>
                  {t("dashboard.journeyModalTitle", "Set a new practice goal")}
                </h3>
              </div>
              <button
                type="button"
                className="journeyModal__close"
                onClick={() =>
                  !journeyModalSubmitting && setJourneyModalOpen(false)
                }
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="journeyModal__body">
              <OnboardingQuestions onComplete={handleJourneyModalComplete} />
              {journeyModalSubmitting && (
                <div className="journeyModal__status">
                  {t(
                    "dashboard.journeyModalCreating",
                    "Creating your personalized dashboard…",
                  )}
                </div>
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
