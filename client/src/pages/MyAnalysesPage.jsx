import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  Target,
  Dumbbell,
  Briefcase,
  Mic,
  MessageCircle,
  Award,
  Heart,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import './MyAnalysesPage.css';

export default function MyAnalysesPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    } else {
      setAnalyses([]);
      setLoading(false);
    }
  }, [user]);

  const fetchAnalyses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const res = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:5000/api/analyses', {
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

  const extractInsights = (markdown) => {
    if (!markdown) return { strengths: [], improvements: [], recommendations: [], preview: '' };
    
    const strengths = [];
    const improvements = [];
    const recommendations = [];
    let preview = '';
    
    // Extract Key Strengths
    const strengthsMatch = markdown.match(/\*\*🎯 Key Strengths\*\*([\s\S]*?)(?=\*\*|$)/i);
    if (strengthsMatch) {
      const strengthsText = strengthsMatch[1];
      const items = strengthsText.match(/[-•]\s*(.+?)(?=\n[-•]|\n\n|$)/g);
      if (items) {
        items.forEach(item => {
          const clean = item.replace(/[-•]\s*/, '').trim();
          if (clean) {
            strengths.push(clean);
            if (!preview) {
              preview = clean.length > 100 ? clean.substring(0, 100) + '...' : clean;
            }
          }
        });
      }
    }
    
    // Extract Focus Areas
    const improvementsMatch = markdown.match(/\*\*💡 Focus Areas\*\*([\s\S]*?)(?=\*\*|$)/i);
    if (improvementsMatch) {
      const improvementsText = improvementsMatch[1];
      const items = improvementsText.match(/[-•]\s*(.+?)(?=\n[-•]|\n\n|$)/g);
      if (items) {
        items.forEach(item => {
          const clean = item.replace(/[-•]\s*/, '').trim();
          if (clean) improvements.push(clean);
        });
      }
    }
    
    // Extract Action Plan / Recommendations
    const recommendationsMatch = markdown.match(/\*\*🚀 Action Plan\*\*([\s\S]*?)(?=\*\*|$)/i);
    if (recommendationsMatch) {
      const recommendationsText = recommendationsMatch[1];
      const items = recommendationsText.match(/[-•]\s*(.+?)(?=\n[-•]|\n\n|$)/g);
      if (items) {
        items.forEach(item => {
          const clean = item.replace(/[-•]\s*/, '').trim();
          if (clean) recommendations.push(clean);
        });
      }
    }
    
    if (!preview && recommendations.length > 0) {
      preview = recommendations[0].length > 100 ? recommendations[0].substring(0, 100) + '...' : recommendations[0];
    }
    
    return { strengths, improvements, recommendations, preview };
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
        <h1 className="myAnalysesPage__title">My Analyses</h1>
        <div className="myAnalysesPage__empty">
          <p>No analyses yet. Start your first analysis to see it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="myAnalysesPage">
      <h1 className="myAnalysesPage__title">My Analyses</h1>
      <p className="myAnalysesPage__subtitle">{analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'} completed</p>
      
      <div className="myAnalysesPage__list">
        {analyses.map((analysis) => {
          const insights = extractInsights(analysis.analysis_result);
          const isExpanded = expandedId === analysis.id;
          const goal = analysis.user_context?.primaryGoal || 'general';
          const IconComponent = getGoalIcon(goal);
          
          return (
            <div key={analysis.id} className={`analysisCard ${isExpanded ? 'analysisCard--expanded' : ''}`}>
              <div 
                className="analysisCard__header"
                onClick={() => setExpandedId(isExpanded ? null : analysis.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedId(isExpanded ? null : analysis.id);
                  }
                }}
              >
                <div className="analysisCard__info">
                  <div className="analysisCard__meta">
                    <div className="analysisCard__date">{formatDate(analysis.created_at)}</div>
                    <div className="analysisCard__goal">
                      <IconComponent className="analysisCard__goalIcon" size={16} />
                      <span>{analysis.user_context?.primaryGoal || 'General'}</span>
                    </div>
                  </div>
                  <div className="analysisCard__filename">{analysis.video_filename}</div>
                  {!isExpanded && insights.preview && (
                    <div className="analysisCard__preview">{insights.preview}</div>
                  )}
                </div>
                <div className="analysisCard__toggle">
                  {isExpanded ? (
                    <ChevronUp className="analysisCard__toggleIcon" size={20} />
                  ) : (
                    <ChevronDown className="analysisCard__toggleIcon" size={20} />
                  )}
                </div>
              </div>
              
              {isExpanded && (
                <div className="analysisCard__content">
                  {insights.strengths.length > 0 && (
                    <div className="insightSection">
                      <h3 className="insightSection__title">
                        <CheckCircle className="insightSection__icon" size={20} />
                        Key Strengths
                      </h3>
                      <ul className="insightSection__list">
                        {insights.strengths.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insights.improvements.length > 0 && (
                    <div className="insightSection">
                      <h3 className="insightSection__title">
                        <AlertCircle className="insightSection__icon" size={20} />
                        Focus Areas
                      </h3>
                      <ul className="insightSection__list">
                        {insights.improvements.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insights.recommendations.length > 0 && (
                    <div className="insightSection">
                      <h3 className="insightSection__title">
                        <Lightbulb className="insightSection__icon" size={20} />
                        Top Recommendations
                      </h3>
                      <ul className="insightSection__list">
                        {insights.recommendations.slice(0, 3).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="analysisCard__actions">
                    <button 
                      className="btn btn--ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/analysis/${analysis.id}`);
                      }}
                    >
                      View Full Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

