import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
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
  ChevronUp
} from 'lucide-react';
import './MyProgressPage.css';
import JourneySwitcher from '../components/JourneySwitcher';

// All 25 parameters organized by category
const PARAMETER_CATEGORIES = {
  voice: {
    name: 'Voice Expression',
    icon: Mic,
    color: '#3b82f6',
    parameters: [
      { key: 'voice_volume_stability', label: 'Volume Stability', description: 'Consistent volume without sudden drops or spikes' },
      { key: 'voice_tone_variation', label: 'Tone Variation', description: 'Vocal variety and expressiveness' },
      { key: 'voice_pace_control', label: 'Pace Control', description: 'Appropriate speaking speed, not too fast or slow' },
      { key: 'voice_articulation', label: 'Articulation', description: 'Clear pronunciation, words are distinct' },
      { key: 'voice_warmth', label: 'Vocal Warmth', description: 'Friendly, approachable vocal quality' }
    ]
  },
  presence: {
    name: 'Presence',
    icon: Eye,
    color: '#10b981',
    parameters: [
      { key: 'presence_eye_contact', label: 'Eye Contact', description: 'Consistent, natural eye contact with camera/audience' },
      { key: 'presence_facial_relaxation', label: 'Facial Relaxation', description: 'Relaxed, natural facial expressions' },
      { key: 'presence_body_posture', label: 'Body Posture', description: 'Upright, confident posture' },
      { key: 'presence_hand_naturalness', label: 'Hand Naturalness', description: 'Natural, purposeful gestures' },
      { key: 'presence_openness', label: 'Openness', description: 'Open body language, approachable' }
    ]
  },
  clarity: {
    name: 'Clarity',
    icon: MessageSquare,
    color: '#f59e0b',
    parameters: [
      { key: 'clarity_structure', label: 'Structure', description: 'Clear organization, logical flow' },
      { key: 'clarity_focus', label: 'Focus', description: 'Stays on topic, clear main points' },
      { key: 'clarity_example_usage', label: 'Example Usage', description: 'Effective use of examples/stories' },
      { key: 'clarity_transition_quality', label: 'Transition Quality', description: 'Smooth transitions between ideas' },
      { key: 'clarity_repetition_control', label: 'Repetition Control', description: 'Avoids unnecessary repetition' }
    ]
  },
  authenticity: {
    name: 'Authenticity',
    icon: Heart,
    color: '#8b5cf6',
    parameters: [
      { key: 'authenticity_naturalness', label: 'Naturalness', description: 'Appears genuine, not forced' },
      { key: 'authenticity_emotional_transparency', label: 'Emotional Transparency', description: 'Shows appropriate emotions' },
      { key: 'authenticity_forced_expression_reduction', label: 'Forced Expression Reduction', description: 'Minimal forced or fake expressions' }
    ]
  },
  impact: {
    name: 'Impact',
    icon: Zap,
    color: '#ef4444',
    parameters: [
      { key: 'impact_energy', label: 'Energy', description: 'Appropriate energy level, engaging' },
      { key: 'impact_engagement', label: 'Engagement', description: 'Keeps audience engaged' },
      { key: 'impact_persuasiveness', label: 'Persuasiveness', description: 'Convincing, compelling delivery' }
    ]
  },
  confidence: {
    name: 'Confidence',
    icon: Award,
    color: '#06b6d4',
    parameters: [
      { key: 'confidence_filler_word_control', label: 'Filler Word Control', description: 'Minimal "um", "uh", "like"' },
      { key: 'confidence_pause_control', label: 'Pause Control', description: 'Effective use of pauses' },
      { key: 'confidence_physical_tension', label: 'Physical Tension', description: 'Low physical tension, relaxed' },
      { key: 'confidence_vocal_stability', label: 'Vocal Stability', description: 'Stable voice, no shaking/quivering' },
      { key: 'confidence_comfort_level', label: 'Comfort Level', description: 'Appears comfortable on camera' }
    ]
  }
};

const FOCUS_GUIDANCE = {
  'voice_articulation': {
    why: 'Crisp pronunciation keeps every insight clear and trustworthy.',
    instantTip: 'Slow the first sentence of each idea and exaggerate consonants for those opening words.',
    microPractice: 'Read the next paragraph of your script aloud while placing a fingertip beneath your chin—if your chin bounces on every syllable you’re clipping words; reset and repeat.',
    practiceTime: '45 sec',
    trackThis: 'Aim for articulation ≥ 7.5 while keeping pace steady.'
  },
  'presence_eye_contact': {
    why: 'Eye contact is the fastest way to hold attention and signal confidence.',
    instantTip: 'Lock eyes with the lens for the first full sentence of each new idea, then glance briefly to your notes.',
    microPractice: 'Stick a small dot next to the lens and explain one bullet point while keeping your gaze on the dot for 3–5 seconds before looking away.',
    practiceTime: '30 sec',
    trackThis: 'Hold the lens for 70% of sentences to move the score above 8.'
  },
  'impact_persuasiveness': {
    why: 'Persuasiveness converts attention into action; it needs structured emphasis.',
    instantTip: 'Sum each point with a bold “so here’s what that means for you…” statement.',
    microPractice: 'Record a 30-second pitch where every sentence ends with a clear benefit to the listener. Play it back and confirm you can hear the benefit in each line.',
    practiceTime: '30 sec',
    trackThis: 'Use benefit-driven closes on every key point until impact > 6.5.'
  },
  default: {
    why: 'Sharpening this lever has the fastest payoff for your communication goal.',
    instantTip: 'Name the behavior you want in the very next conversation and do it on the first sentence.',
    microPractice: 'Record a 45-second run focused only on this cue; watch once and note the moment you nailed it.',
    practiceTime: '45 sec',
    trackThis: 'Move this metric above 7.0 and keep it there for two sessions.'
  }
};

// Generate narrative explanation for improvements
const generateImprovementNarrative = (param, improvement) => {
  const percentChange = improvement.changePercent ? parseFloat(improvement.changePercent) : 0;
  const change = improvement.change;
  
  const narratives = {
    'presence_eye_contact': `Your eye contact improved from ${improvement.first.toFixed(1)} to ${improvement.latest.toFixed(1)}. This means you're holding attention longer and building stronger connections with your audience. People feel more engaged when you maintain consistent eye contact.`,
    'confidence_filler_word_control': `Your filler words decreased by ${percentChange > 0 ? percentChange.toFixed(0) : Math.abs(change).toFixed(1)} points. You're speaking with more confidence and authority. Instead of filling silence with "um" and "uh", you're pausing thoughtfully, which makes you sound more deliberate and prepared.`,
    'voice_tone_variation': `Your vocal variety improved from ${improvement.first.toFixed(1)} to ${improvement.latest.toFixed(1)}. You're using your voice more expressively, which keeps your audience engaged. Varying your tone helps emphasize key points and prevents monotony.`,
    'presence_body_posture': `Your posture improved by ${change.toFixed(1)} points. You're standing taller and more confidently, which projects authority and self-assurance. Good posture also helps you breathe better and speak more clearly.`,
    'clarity_structure': `Your message structure improved from ${improvement.first.toFixed(1)} to ${improvement.latest.toFixed(1)}. You're organizing your thoughts more clearly, making it easier for your audience to follow along. A well-structured message is more persuasive and memorable.`,
    'impact_energy': `Your energy level increased by ${change.toFixed(1)} points. You're bringing more enthusiasm to your delivery, which makes you more engaging and compelling. Higher energy helps you connect with your audience and keep their attention.`
  };

  return narratives[param.key] || `You've improved your ${param.label.toLowerCase()} from ${improvement.first.toFixed(1)} to ${improvement.latest.toFixed(1)}. This demonstrates your ability to ${param.description.toLowerCase()}, which is making you a more effective communicator.`;
};

// Generate narrative explanation for weaknesses
const generateWeaknessNarrative = (param, current, trend) => {
  const narratives = {
    'confidence_filler_word_control': `Your filler words are at ${current.toFixed(1)}/10. You're using "um", "uh", and "like" frequently, which undermines your confidence. Practice pausing instead of filling silence - pauses make you sound thoughtful, not uncertain.`,
    'presence_eye_contact': `Your eye contact is at ${current.toFixed(1)}/10. You're looking away frequently, which makes it harder to connect with your audience. Try to maintain eye contact for 3-5 seconds at a time to build trust and engagement.`,
    'voice_tone_variation': `Your vocal variety is at ${current.toFixed(1)}/10. You're speaking in a monotone, which can make your audience lose interest. Vary your pitch and pace to emphasize key points and keep listeners engaged.`,
    'clarity_structure': `Your message structure is at ${current.toFixed(1)}/10. Your thoughts aren't organized clearly, making it hard for your audience to follow. Start with a clear introduction, organize your main points logically, and end with a strong conclusion.`,
    'impact_energy': `Your energy level is at ${current.toFixed(1)}/10. You're not bringing enough enthusiasm to your delivery, which can make you seem disengaged. Increase your energy to match your message's importance and connect better with your audience.`,
    'presence_body_posture': `Your posture is at ${current.toFixed(1)}/10. You're slouching or appearing closed off, which projects uncertainty. Stand or sit tall with your shoulders back to project confidence and authority.`
  };

  if (narratives[param.key]) {
    return narratives[param.key];
  }

  let narrative = `Your ${param.label.toLowerCase()} is at ${current.toFixed(1)}/10. `;
  if (trend && trend.direction === 'declining') {
    narrative += `This has been declining, which means you're moving away from your best performance. `;
  }
  narrative += `${param.description}. Focus on improving this area to become a more effective communicator.`;
  
  return narrative;
};

export default function MyProgressPage({
  journeys = [],
  journeysLoading = false,
  activeJourneyId = null,
  onSelectJourney
}) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    guide: false,
    improvements: false,
    strengths: false,
    complete: false
  });
  const [expandedFocusCards, setExpandedFocusCards] = useState({});

  const activeJourney = useMemo(
    () => journeys.find(journey => journey.id === activeJourneyId) || null,
    [journeys, activeJourneyId]
  );
  const focusLabel = activeJourney?.display_name || activeJourney?.focus_label || activeJourney?.focus_slug;

  useEffect(() => {
    if (user) {
      fetchProgressData();
    } else {
      setLoading(false);
    }
  }, [user, activeJourneyId]);

  const fetchProgressData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (activeJourneyId) {
        params.append('journeyId', activeJourneyId);
      }
      const metricsRes = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/communication/metrics?${params.toString()}`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json'
          }
        }
      );

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics || []);
      }
    } catch (err) {
      console.error('Failed to fetch progress data:', err);
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
  }, [metrics]);

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
  }, [parameterImprovements]);

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
  }, [metrics]);

  // Get weaknesses (below 6.0 OR declining)
  const weaknesses = useMemo(() => {
    if (metrics.length === 0) return [];

    const latest = metrics[metrics.length - 1];
    const first = metrics.length >= 2 ? metrics[0] : null;
    const weaknessesList = [];

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
    return weaknessesList.sort((a, b) => {
      if (a.isDeclining && !b.isDeclining) return -1;
      if (!a.isDeclining && b.isDeclining) return 1;
      return a.current - b.current;
    }).slice(0, 3);
  }, [metrics]);

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
      const percentChange = biggestWin.changePercent ? parseFloat(biggestWin.changePercent) : 0;
      
      return {
        type: 'win',
        title: `Your ${biggestWin.label} (${biggestWin.category}) improved by ${biggestWin.change.toFixed(1)} points!`,
        description: generateImprovementNarrative(param || { key: biggestWin.key, label: biggestWin.label, description: biggestWin.description }, biggestWin),
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
        title: `Focus on ${mostCriticalWeakness.label} (${mostCriticalWeakness.category})`,
        description: generateWeaknessNarrative(param || { key: mostCriticalWeakness.key, label: mostCriticalWeakness.label, description: mostCriticalWeakness.description }, mostCriticalWeakness.current, mostCriticalWeakness.trend),
        value: mostCriticalWeakness.current.toFixed(1),
        change: mostCriticalWeakness.isDeclining ? 'Declining' : 'Needs attention',
        categoryColor: '#f59e0b',
        icon: AlertCircle
      };
    }

    return null;
  }, [topImprovements, weaknesses, metrics]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleFocusCard = (key) => {
    setExpandedFocusCards(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <div className="myProgressPage">
        <div className="myProgressPage__loading">Loading your progress...</div>
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
          <h1 className="myProgressPage__title">My Progress</h1>
          <p className="myProgressPage__subtitle">
            {focusLabel
              ? `${focusLabel}: no sessions yet`
              : 'Track your communication journey'}
          </p>
        </div>
        <div className="myProgressPage__empty">
          <BarChart3 size={64} />
          <h2>No progress data yet</h2>
          <p>
            {focusLabel
              ? `No analyses yet for ${focusLabel}. Upload a video to start tracking this focus.`
              : 'Complete your first analysis to start tracking your improvement across all 25 communication parameters.'}
          </p>
          <button className="btn btn--primary" onClick={() => navigate('/new-analysis')}>
            Start Your First Analysis
          </button>
        </div>
      </div>
    );
  }

  const latestMetrics = metrics[metrics.length - 1];

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
        <h1 className="myProgressPage__title">My Progress</h1>
        <p className="myProgressPage__subtitle">
          {focusLabel
            ? `${focusLabel}: ${metrics.length} ${metrics.length === 1 ? 'session' : 'sessions'} tracked`
            : `Your communication evolution across ${metrics.length} ${metrics.length === 1 ? 'session' : 'sessions'}`}
        </p>
      </div>

      {/* How to Read This - Expandable Guide */}
      <div className="myProgressPage__section myProgressPage__section--guide">
        <button 
          className="guideToggle"
          onClick={() => toggleSection('guide')}
        >
          <BarChart3 size={18} className="guideToggle__icon" />
          <span className="guideToggle__text">How to Read This Page</span>
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
                Your communication is analyzed across <strong>6 main categories</strong>, each containing multiple <strong>sub-parameters</strong> (25 total). 
                Each parameter is scored from 0-10, where higher scores indicate better performance.
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
                          {category.name === 'Voice Expression' && 'How you use your voice to communicate'}
                          {category.name === 'Presence' && 'Your physical presence and body language'}
                          {category.name === 'Clarity' && 'How clearly and organized your message is'}
                          {category.name === 'Authenticity' && 'How genuine and natural you appear'}
                          {category.name === 'Impact' && 'How engaging and persuasive you are'}
                          {category.name === 'Confidence' && 'How confident and comfortable you appear'}
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
              <h4 className="guideContent__tipsTitle">Understanding Your Scores</h4>
              <div className="guideContent__tipsGrid">
                <div className="guideTip">
                  <div className="guideTip__score guideTip__score--high">7-10</div>
                  <div className="guideTip__content">
                    <strong>Strong</strong>
                    <p>Excellent performance, keep it up!</p>
                  </div>
                </div>
                <div className="guideTip">
                  <div className="guideTip__score guideTip__score--medium">4-6</div>
                  <div className="guideTip__content">
                    <strong>Average</strong>
                    <p>Room for improvement, focus here</p>
                  </div>
                </div>
                <div className="guideTip">
                  <div className="guideTip__score guideTip__score--low">0-3</div>
                  <div className="guideTip__content">
                    <strong>Needs Work</strong>
                    <p>Priority focus area</p>
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
                    <span>Biggest Win</span>
                  </>
                ) : (
                  <>
                    <Target size={16} />
                    <span>Focus Area</span>
                  </>
                )}
              </div>
              <h2 className="progressHero__title">{heroInsight.title}</h2>
              <p className="progressHero__description">{heroInsight.description}</p>
            </div>
            <div className="progressHero__score">
              <div className="progressHero__scoreValue">{heroInsight.value}</div>
              <div className="progressHero__scoreLabel">/ 10</div>
              <div className={`progressHero__change progressHero__change--${heroInsight.type}`}>
                {heroInsight.change}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Areas to Focus On - PROMINENT */}
      {weaknesses.length > 0 && (
        <div className="myProgressPage__section myProgressPage__section--focus">
          <div className="progressSection__header">
            <AlertCircle size={28} className="progressSection__icon progressSection__icon--focus" />
            <div>
              <h2 className="progressSection__title">Areas to Focus On</h2>
              <p className="progressSection__subtitle">These parameters need your attention to improve your overall communication</p>
            </div>
          </div>
          <div className="focusGrid">
            {weaknesses.map((weakness, idx) => {
              const category = Object.values(PARAMETER_CATEGORIES).find(cat =>
                cat.parameters.some(p => p.key === weakness.key)
              );
              const param = category?.parameters.find(p => p.key === weakness.key);
              
              const guidance = FOCUS_GUIDANCE[weakness.key] || FOCUS_GUIDANCE.default;
              const isExpanded = expandedFocusCards[weakness.key];

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
                    <span className="focusCard__scoreLabel">/ 10</span>
                    {weakness.isDeclining && (
                      <span className="focusCard__declining">
                        <TrendingDown size={14} />
                        Declining
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
                    {generateWeaknessNarrative(param || { key: weakness.key, label: weakness.label, description: weakness.description }, weakness.current, weakness.trend)}
                  </p>
                  <div className="focusCard__why">{guidance.why}</div>
                  <button
                    type="button"
                    className="focusCard__toggle"
                    onClick={() => toggleFocusCard(weakness.key)}
                  >
                    {isExpanded ? 'Hide coach plan' : 'Show coach plan'}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isExpanded && (
                    <div className="focusPlan">
                      <div className="focusPlan__item">
                        <div className="focusPlan__label">Instant Tip</div>
                        <p>{guidance.instantTip}</p>
                      </div>
                      <div className="focusPlan__item">
                        <div className="focusPlan__label">Optional micro practice</div>
                        <p>{guidance.microPractice}</p>
                        {guidance.practiceTime && (
                          <span className="focusPlan__chip">{guidance.practiceTime}</span>
                        )}
                      </div>
                      <div className="focusPlan__item focusPlan__item--meta">
                        <div className="focusPlan__label">Track this</div>
                        <p>{guidance.trackThis}</p>
                      </div>
                    </div>
                  )}
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
                <h2 className="progressSection__title">What's Getting Better</h2>
                <p className="progressSection__subtitle">Your top {topImprovements.length} improving parameters</p>
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
                        <span className="improvementCard__subtext">{improvement.category} → {improvement.label}</span>
                      </div>
                    </div>
                    <div className="improvementCard__progress">
                      <div className="improvementCard__scores">
                        <div className="improvementCard__score">
                          <span className="improvementCard__scoreLabel">Started</span>
                          <span className="improvementCard__scoreValue">{improvement.first.toFixed(1)}</span>
                        </div>
                        <div className="improvementCard__arrow">→</div>
                        <div className="improvementCard__score">
                          <span className="improvementCard__scoreLabel">Now</span>
                          <span className="improvementCard__scoreValue improvementCard__scoreValue--current">
                            {improvement.latest.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="improvementCard__change">
                        <span className="improvementCard__changeValue">+{improvement.change.toFixed(1)}</span>
                        {improvement.changePercent && (
                          <span className="improvementCard__changePercent">({improvement.changePercent}% improvement)</span>
                        )}
                      </div>
                    </div>
                    <p className="improvementCard__description">
                      {generateImprovementNarrative(param || { key: improvement.key, label: improvement.label, description: improvement.description }, improvement)}
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
                <h2 className="progressSection__title">Your Consistent Strengths</h2>
                <p className="progressSection__subtitle">What makes you consistently strong</p>
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
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="strengthCard__meta">
                      <span className="strengthCard__category">{strength.category}</span>
                      <span className="strengthCard__label">{strength.label}</span>
                      <span className="strengthCard__subtext">{strength.category} → {strength.label}</span>
                    </div>
                  </div>
                  <div className="strengthCard__score">
                    <div className="strengthCard__scoreValue">{strength.average.toFixed(1)}</div>
                    <div className="strengthCard__scoreLabel">Average Score</div>
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
              <h2 className="progressSection__title">Complete Parameter Analysis</h2>
              <p className="progressSection__subtitle">All 25 communication parameters across your journey</p>
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
              const categoryScore = parseFloat(latestMetrics[catKey]) || 0;

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
                          <span className="parameterCategory__scoreLabel">/ 10</span>
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
                              <span className="parameterCard__scoreLabel">/ 10</span>
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
                                From {improvement.first.toFixed(1)} to {improvement.latest.toFixed(1)} (+{improvement.change.toFixed(1)})
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
