import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
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
  TrendingUp,
  BookOpen,
  Trophy,
  BarChart3,
  CheckCircle2,
  Circle,
  ListTodo
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './Dashboard.css';

export default function Dashboard({ onNewAnalysis, refreshTrigger }) {
  const { user } = useUser();
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

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchProgressData();
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

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (user && refreshTrigger !== undefined) {
      fetchProgressData();
    }
  }, [refreshTrigger, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const res = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:5000/api/user/profile', {
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const fetchProgressData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const res = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:5000/api/communication/progress', {
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('Dashboard data fetched:', {
          profile: !!data.profile,
          metrics: data.metrics?.length || 0,
          insights: data.insights?.length || 0,
          achievements: data.achievements?.length || 0,
          actionItems: data.actionItems?.length || 0
        });
        console.log('Action Items data:', data.actionItems);
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
    return goalIcons[goal] || Target;
  };

  const getGoalLabel = (goal) => {
    const goalMap = {
      'confidence': 'Build Self-Confidence',
      'interview': 'Job Interview Preparation',
      'presentation': 'Improve Presentations',
      'communication': 'Better Communication',
      'leadership': 'Leadership Presence',
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

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">Loading your progress...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard__header">
        <div className="dashboard__headerContent">
          <h1 className="dashboard__title">Your Body Language Journey</h1>
          <button className="btn btn--primary" onClick={onNewAnalysis}>
            + New Analysis
          </button>
        </div>
      </div>

      {/* Profile Card */}
      {latestMetrics && (
        <div className="dashboard__profileCard">
          <div className="profileCard">
            <div className="profileCard__score">
              <div className="profileCard__scoreValue">
                {Math.round(latestMetrics.overall_score || 0)}
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
      {(userProfile?.primary_goal || localUserContext?.primaryGoal) && (
        <div className="dashboard__goalsCard">
          <div className="goalsCard">
            <div className="goalsCard__header">
              <div className="goalsCard__icon">
                {React.createElement(getGoalIcon(userProfile?.primary_goal || localUserContext?.primaryGoal), { size: 48 })}
              </div>
              <div className="goalsCard__info">
                <h3 className="goalsCard__title">Your Focus</h3>
                <p className="goalsCard__goal">{getGoalLabel(userProfile?.primary_goal || localUserContext?.primaryGoal)}</p>
              </div>
            </div>
            {(userProfile?.confidence_level || localUserContext?.confidenceLevel) && (
              <div className="goalsCard__confidence">
                <span className="goalsCard__confidenceLabel">Current Confidence:</span>
                <span className="goalsCard__confidenceValue">
                  {getConfidenceLabel(userProfile?.confidence_level || localUserContext?.confidenceLevel)}
                </span>
              </div>
            )}
          </div>
        </div>
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

      {/* Two Column Layout */}
      <div className="dashboard__grid">
        {/* Action Items To-Do List */}
        <div className="dashboard__journalCard">
          <div className="journalCard">
            <h3 className="journalCard__title">
              <ListTodo size={20} />
              Action Items
            </h3>
            <div className="journalCard__list">
              {progressData.actionItems && progressData.actionItems.length > 0 ? (
                progressData.actionItems.slice(0, 10).map((item, idx) => (
                  <div key={item.id || idx} className="journalCard__item journalCard__actionItem">
                    <label className="journalCard__actionItemLabel">
                      <input
                        type="checkbox"
                        checked={item.status === 'completed'}
                        onChange={async () => {
                          const newStatus = item.status === 'completed' ? 'pending' : 'completed';
                          try {
                            const res = await fetch(
                              `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/action-items/${item.id}/status`,
                              {
                                method: 'PATCH',
                                headers: {
                                  'X-Clerk-User-Id': user.id,
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ status: newStatus })
                              }
                            );
                            if (res.ok) {
                              // Refresh data
                              fetchProgressData();
                            }
                          } catch (err) {
                            console.error('Failed to update action item status:', err);
                          }
                        }}
                        className="journalCard__checkbox"
                      />
                      <span className={`journalCard__actionItemText ${item.status === 'completed' ? 'completed' : ''}`}>
                        {item.title}
                      </span>
                    </label>
                    {item.analyses && (
                      <div className="journalCard__itemMeta">
                        {new Date(item.analyses.created_at).toLocaleDateString()} • {item.analyses.video_filename}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="journalCard__empty">No action items yet. Complete your first analysis to see action items here.</p>
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

      {/* Empty State */}
      {!latestMetrics && (
        <div className="dashboard__empty">
          <div className="dashboard__emptyIcon">
            <BarChart3 size={64} />
          </div>
          <h2>No analyses yet</h2>
          <p>Upload your first video to get personalized body language insights and start tracking your progress</p>
          <button className="btn btn--primary" onClick={onNewAnalysis}>
            Start Your First Analysis
          </button>
        </div>
      )}
    </div>
  );
}
