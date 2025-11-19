import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { 
  ChevronDown, 
  CheckCircle2, 
  Circle, 
  Copy, 
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Rocket,
  MessageSquare,
  Eye,
  Mic,
  Target,
  Heart,
  Zap,
  Award
} from 'lucide-react';
import TopStrengthCard from './analysis/TopStrengthCard';
import TopOpportunityCard from './analysis/TopOpportunityCard';
import NextStepsPreview from './analysis/NextStepsPreview';
import './AnalysisResult.css';

// Parse markdown text into structured sections
const parseAnalysisText = (markdown) => {
  if (!markdown) return null;

  const sections = {
    overallImpression: null,
    keyStrengths: [],
    focusAreas: [],
    actionPlan: [],
    quickWins: [],
    closingEncouragement: null
  };

  // Split by markdown headers (## or **)
  const lines = markdown.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect section headers - check for emoji patterns and text
    if (line.includes('🪞') && (line.includes('Overall') || line.includes('Impression'))) {
      // Save previous section
      if (currentSection === 'overall' && currentContent.length > 0) {
        sections.overallImpression = currentContent.join('\n').trim();
      }
      currentSection = 'overall';
      currentContent = [];
      continue;
    }
    
    if ((line.includes('🎯') || line.includes('Key Strengths')) && (line.includes('**') || line.match(/^##?/))) {
      if (currentSection === 'overall' && currentContent.length > 0) {
        sections.overallImpression = currentContent.join('\n').trim();
      }
      currentSection = 'strengths';
      currentContent = [];
      continue;
    }
    
    if ((line.includes('💡') || line.includes('Focus Areas')) && (line.includes('**') || line.match(/^##?/))) {
      if (currentSection === 'strengths' && currentContent.length > 0) {
        sections.keyStrengths = parseListItems(currentContent.join('\n'));
      }
      currentSection = 'focus';
      currentContent = [];
      continue;
    }
    
    if ((line.includes('🚀') || line.includes('Action Plan')) && (line.includes('**') || line.match(/^##?/))) {
      if (currentSection === 'focus' && currentContent.length > 0) {
        sections.focusAreas = parseFocusAreas(currentContent.join('\n'));
      }
      currentSection = 'action';
      currentContent = [];
      continue;
    }
    
    if ((line.includes('💬') || line.includes('Quick Wins')) && (line.includes('**') || line.match(/^##?/))) {
      if (currentSection === 'action' && currentContent.length > 0) {
        sections.actionPlan = parseActionItems(currentContent.join('\n'));
      }
      currentSection = 'quick';
      currentContent = [];
      continue;
    }

    // Skip empty lines at section boundaries
    if (!line && currentContent.length === 0) {
      continue;
    }

    if (line) {
      currentContent.push(line);
    }
  }

  // Process final section
  if (currentSection === 'quick') {
    sections.quickWins = parseQuickWins(currentContent.join('\n'));
  } else if (currentSection === 'action') {
    sections.actionPlan = parseActionItems(currentContent.join('\n'));
  } else if (currentSection === 'focus') {
    sections.focusAreas = parseFocusAreas(currentContent.join('\n'));
  } else if (currentSection === 'strengths') {
    sections.keyStrengths = parseListItems(currentContent.join('\n'));
  } else if (currentSection === 'overall' || !sections.overallImpression) {
    const text = currentContent.join('\n').trim();
    if (text && !text.includes('**') && text.length > 50) {
      sections.overallImpression = text;
    }
  }

  // Extract closing encouragement (usually the last paragraph)
  const lastParagraph = lines.slice(-5).join('\n').trim();
  if (lastParagraph && !lastParagraph.includes('**') && lastParagraph.length > 30) {
    sections.closingEncouragement = lastParagraph;
  }

  return sections;
};

const parseListItems = (text) => {
  const items = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    let cleaned = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
    // Remove markdown bold
    cleaned = cleaned.replace(/\*\*/g, '').trim();
    // Skip section headers
    if (cleaned.match(/^[🎯💡🚀💬✨🪞]/) || cleaned.match(/^##?\s/)) {
      continue;
    }
    if (cleaned && cleaned.length > 10 && !cleaned.match(/^\(/)) {
      items.push(cleaned);
    }
  }
  
  return items.length > 0 ? items : (text.trim() ? [text.trim()] : []);
};

const parseFocusAreas = (text) => {
  const areas = [];
  const lines = text.split('\n');
  let currentArea = null;
  
  for (const line of lines) {
    const cleaned = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
    if (cleaned) {
      // Check if it's a new area (usually starts with bold or emoji)
      if (cleaned.match(/^[🎯💡🚀💬✨]/) || cleaned.length < 100) {
        if (currentArea) areas.push(currentArea);
        currentArea = { title: cleaned, description: '', howToImprove: '' };
      } else if (currentArea) {
        if (!currentArea.description) {
          currentArea.description = cleaned;
        } else {
          currentArea.howToImprove = cleaned;
        }
      }
    }
  }
  
  if (currentArea) areas.push(currentArea);
  
  // Fallback: split by lines
  if (areas.length === 0) {
    return parseListItems(text).map(item => ({ title: item, description: '', howToImprove: '' }));
  }
  
  return areas;
};

const normalizeActionText = (text) => {
  if (!text) return '';
  let normalized = text;
  // Ensure each action starts on a new line
  normalized = normalized.replace(/\*\s*Action:/gi, '\nAction:');
  normalized = normalized.replace(/(?<!^)(?=Action:)/gi, '\n'); // fallback if multiple in same line

  // Split inline details into their own lines
  normalized = normalized.replace(/-\s*(What to do|Why it matters|Example)/gi, '\n  $1');
  normalized = normalized.replace(/•\s*(What to do|Why it matters|Example)/gi, '\n  $1');

  // Replace multiple spaces after colon
  normalized = normalized.replace(/(Action:|What to do|Why it matters|Example):\s*/gi, '$1: ');

  return normalized;
};

const parseActionItems = (text) => {
  const items = [];
  const normalizedText = normalizeActionText(text);
  const lines = normalizedText.split('\n');
  let currentAction = null;
  let introText = []; // Store any text before first action
  
  // Patterns that indicate this is NOT an action item (intro text)
  const introPatterns = [
    /^here are/i,
    /^these are/i,
    /^below are/i,
    /^following are/i,
    /^you'll find/i,
    /^let's/i,
    /^we'll/i,
    /^i'll/i,
    /^this will/i,
    /^these steps/i,
    /^these actions/i,
    /^the following/i,
    /^some practical/i,
    /^a few practical/i,
    /^practical steps/i
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    let cleaned = originalLine.trim();
    
    // Skip empty lines
    if (!cleaned) {
      continue;
    }
    
    // Skip section headers
    if (cleaned.match(/^[🎯💡🚀💬✨🪞]/) || cleaned.match(/^##?\s/)) {
      continue;
    }
    
    // Remove markdown bold but keep structure
    cleaned = cleaned.replace(/\*\*/g, '').trim();
    
    // Check if line starts with "Action:" (case-insensitive) - this is definitely an action
    const actionMatch = cleaned.match(/^Action:\s*(.+)/i);
    
    if (actionMatch) {
      // Save previous action if exists
      if (currentAction) {
        items.push(currentAction);
      }
      
      // Start new action with title from "Action: ..."
      const actionTitle = actionMatch[1].trim();
      currentAction = {
        title: actionTitle,
        details: []
      };
      introText = []; // Clear intro text
    } else if (currentAction) {
      // We're inside an action - check if it's a detail
      const isSubItem = originalLine.match(/^\s{2,}/) || // Has indentation
        cleaned.match(/^[-*•]\s*(What to do|Why|How|Example|Tip|Why it matters)/i) || // Starts with dash + keyword
        cleaned.match(/^(What to do|Why|How|Example|Tip|Why it matters)[:\s-]/i); // Starts with keyword
      
      if (isSubItem) {
        // Add as detail to current action
        let detailText = cleaned.replace(/^[-*•]\s*/, '').trim();
        // Remove keyword prefix but keep the text
        detailText = detailText.replace(/^(What to do|Why|How|Example|Tip|Why it matters)[:\s-]+/i, '').trim();
        if (detailText) {
          currentAction.details.push(detailText);
        }
      } else if (cleaned && cleaned.length > 5 && originalLine.match(/^\s{2,}/)) {
        // Indented text - add as detail
        currentAction.details.push(cleaned);
      }
    } else {
      // No current action yet - check if this is intro text or an action
      const isIntroText = introPatterns.some(pattern => pattern.test(cleaned)) ||
        (cleaned.length < 100 && !cleaned.match(/^\d+[.)]\s/) && !cleaned.match(/^[A-Z][^:]*:/));
      
      if (isIntroText) {
        // This is intro text - store it but don't create an action
        if (cleaned && cleaned.length > 10) {
          introText.push(cleaned);
        }
      } else {
        // This might be an action (numbered, or starts with capital and colon, or looks like action)
        const isNumbered = cleaned.match(/^\d+[.)]\s/);
        const hasActionPattern = cleaned.match(/^[A-Z][^:]{5,}:/) || // Starts with capital, has colon
          (cleaned.length > 15 && cleaned.match(/^[A-Z]/) && !cleaned.includes('.')); // Long line starting with capital
        
        if (isNumbered || hasActionPattern) {
          // Save previous action if exists
          if (currentAction) {
            items.push(currentAction);
          }
          
          // Start new action - remove numbering if exists
          const title = cleaned.replace(/^\d+[.)]\s*/, '').replace(/^Action:\s*/i, '').trim();
          currentAction = {
            title: title,
            details: []
          };
          introText = []; // Clear intro text
        } else if (cleaned && cleaned.length > 10) {
          // Might be intro text - store it
          introText.push(cleaned);
        }
      }
    }
  }
  
  // Add last action
  if (currentAction) {
    items.push(currentAction);
  }
  
  // If we have intro text but no actions, create a single intro item
  if (items.length === 0 && introText.length > 0) {
    return [{ title: introText.join(' '), details: [], isIntro: true }];
  }
  
  // If no actions found, return empty
  if (items.length === 0) {
    return [];
  }
  
  return items;
};

const parseQuickWins = (text) => {
  return parseListItems(text);
};

export default function AnalysisResult({ markdown, loading, analysisId, viewingAnalysis }) {
  const { user } = useUser();
  const [expandedSections, setExpandedSections] = useState({
    overall: false,
    strengths: false,
    focus: false,
    action: false,
    quick: false
  });
  const [copied, setCopied] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [previousMetrics, setPreviousMetrics] = useState(null);
  const [isFirstAnalysis, setIsFirstAnalysis] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [viewMode, setViewMode] = useState('summary');

  const sections = parseAnalysisText(markdown);

  // Fetch metrics and comparison data
  useEffect(() => {
    if (!user?.id || !analysisId) return;

    const fetchMetrics = async () => {
      setLoadingMetrics(true);
      try {
        // Fetch current analysis metrics
        const metricsRes = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/communication/metrics`,
          {
            headers: {
              'X-Clerk-User-Id': user.id,
              'Content-Type': 'application/json'
            }
          }
        );

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          if (metricsData && metricsData.length > 0) {
            // Find current analysis metrics
            const current = metricsData.find(m => m.analyses?.id === analysisId) || metricsData[metricsData.length - 1];
            setMetrics(current);

            // Check if this is the first analysis
            if (metricsData.length === 1) {
              setIsFirstAnalysis(true);
            } else {
              // Get previous analysis (second to last)
              const previous = metricsData[metricsData.length - 2];
              setPreviousMetrics(previous);
            }
          } else {
            setIsFirstAnalysis(true);
          }
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchMetrics();
  }, [user, analysisId]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = () => {
    if (markdown) {
      navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="analysisResult">
        <div className="analysisResult__loading">Analyzing your video...</div>
      </div>
    );
  }

  if (!markdown) {
    return (
      <div className="analysisResult">
        <p className="analysisResult__empty">The analysis will appear here.</p>
      </div>
    );
  }

  // Fallback to markdown if parsing fails - but still try to show initial experience
  const hasValidSections = sections && (sections.overallImpression || (sections.keyStrengths && sections.keyStrengths.length > 0));
  
  if (!hasValidSections) {
    return (
      <div className="analysisResult">
        <div className="analysisResult__header">
          <h3 className="analysisResult__title">Analysis Results</h3>
          <button 
            className="analysisResult__copyBtn"
            onClick={copyToClipboard}
            title="Copy analysis"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <div className="analysisResult__markdown">
          {markdown.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    );
  }

  // Prepare metrics data for visualization
  const getMetricsData = () => {
    if (!metrics) return null;

    const categories = [
      { key: 'presence', label: 'Presence', icon: Eye, color: '#3b82f6' },
      { key: 'voice_expression', label: 'Voice', icon: Mic, color: '#10b981' },
      { key: 'clarity', label: 'Clarity', icon: Target, color: '#f59e0b' },
      { key: 'authenticity', label: 'Authenticity', icon: Heart, color: '#8b5cf6' },
      { key: 'impact', label: 'Impact', icon: Zap, color: '#ef4444' },
      { key: 'confidence', label: 'Confidence', icon: Award, color: '#06b6d4' }
    ];

    return categories.map(cat => ({
      category: cat.label,
      value: parseFloat(metrics[cat.key]) || 0,
      fullMark: 10,
      icon: cat.icon,
      color: cat.color
    }));
  };

  const metricsData = getMetricsData();
  const overallScore = metrics?.overall_score ? Math.round(metrics.overall_score) : null;
  const stageTitle = metrics?.stage_title || null;

  // Calculate comparison
  const getComparison = () => {
    if (isFirstAnalysis) {
      return { type: 'first', message: 'This is your first analysis!' };
    }
    if (!previousMetrics || !metrics) {
      return null;
    }

    const currentScore = parseFloat(metrics.overall_score) || 0;
    const previousScore = parseFloat(previousMetrics.overall_score) || 0;
    const diff = currentScore - previousScore;

    if (Math.abs(diff) < 0.5) {
      return { type: 'stable', diff: 0, icon: Minus };
    } else if (diff > 0) {
      return { type: 'improved', diff: diff.toFixed(1), icon: TrendingUp };
    } else {
      return { type: 'declined', diff: Math.abs(diff).toFixed(1), icon: TrendingDown };
    }
  };

  const comparison = getComparison();

  // Get top strength and opportunity for initial view
  const topStrength = sections?.keyStrengths?.[0] || null;
  const topOpportunity = sections?.focusAreas?.[0] || null;
  const actionItems = (sections?.actionPlan || []).filter(item => !item?.isIntro);
  const hasActionItems = actionItems.length > 0;
  
  // Get strength score (try to match to metrics)
  const getStrengthScore = (strength) => {
    if (!strength || !metrics) return null;
    const strengthText = typeof strength === 'string' ? strength.toLowerCase() : (strength.title || '').toLowerCase();
    if (strengthText.includes('eye') || strengthText.includes('contact')) return metrics.presence;
    if (strengthText.includes('gesture') || strengthText.includes('hand')) return metrics.presence;
    if (strengthText.includes('voice') || strengthText.includes('vocal')) return metrics.voice_expression;
    if (strengthText.includes('clarity')) return metrics.clarity;
    if (strengthText.includes('authentic')) return metrics.authenticity;
    if (strengthText.includes('confidence')) return metrics.confidence;
    return null;
  };

  const getOpportunityScore = (opportunity) => {
    if (!opportunity || !metrics) return null;
    const oppText = typeof opportunity === 'string' ? opportunity.toLowerCase() : (opportunity.title || '').toLowerCase();
    if (oppText.includes('eye') || oppText.includes('contact')) return metrics.presence;
    if (oppText.includes('gesture') || oppText.includes('hand')) return metrics.presence;
    if (oppText.includes('voice') || oppText.includes('vocal') || oppText.includes('pace')) return metrics.voice_expression;
    if (oppText.includes('clarity')) return metrics.clarity;
    if (oppText.includes('authentic')) return metrics.authenticity;
    if (oppText.includes('confidence')) return metrics.confidence;
    return null;
  };

  const strengthScore = getStrengthScore(topStrength);
  const opportunityScore = getOpportunityScore(topOpportunity);

  const handleViewAllActions = () => {
    setViewMode('full');
    setExpandedSections(prev => ({ ...prev, action: true }));
    setTimeout(() => {
      const actionSection = document.getElementById('accordion-content-action');
      if (actionSection) {
        actionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const renderQuickSummaryView = () => (
    <div className="analysisResult__summaryView">
      {topStrength && (
        <TopStrengthCard
          strength={topStrength}
          score={strengthScore}
        />
      )}

      {topOpportunity && (
        <TopOpportunityCard
          opportunity={topOpportunity}
          currentScore={opportunityScore}
          targetScore={opportunityScore ? opportunityScore + 2 : 7}
        />
      )}

      {hasActionItems && (
        <NextStepsPreview
          actionItems={actionItems}
          onViewAll={handleViewAllActions}
        />
      )}

      {!topStrength && !topOpportunity && !hasActionItems && (
        <div className="analysisResult__emptySummary">
          <p>Upload a new analysis to unlock your personalized summary.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="analysisResult">
    <div className="analysisResult__header">
      <div className="analysisResult__titleGroup">
        <h3 className="analysisResult__title">Your Video Analysis</h3>
        <div className="analysisResult__viewMode">
          <div className="analysisResult__viewToggle" role="tablist" aria-label="Analysis view mode">
            <button
              className={`analysisResult__toggleOption ${viewMode === 'summary' ? 'is-active' : ''}`}
              onClick={() => setViewMode('summary')}
              role="tab"
              aria-selected={viewMode === 'summary'}
            >
              Quick Summary
            </button>
            <button
              className={`analysisResult__toggleOption ${viewMode === 'full' ? 'is-active' : ''}`}
              onClick={() => setViewMode('full')}
              role="tab"
              aria-selected={viewMode === 'full'}
            >
              Full Analysis
            </button>
            <span className={`analysisResult__toggleThumb ${viewMode === 'summary' ? 'is-left' : 'is-right'}`} />
          </div>
        </div>
      </div>
    </div>

      {viewMode === 'summary' && renderQuickSummaryView()}

      {viewMode === 'full' && (
        <>
          {/* Key Strengths */}
          {sections.keyStrengths && sections.keyStrengths.length > 0 && (
            <AccordionSection
              id="strengths"
              icon={<TrendingUp size={20} />}
              title="Key Strengths"
              expanded={expandedSections.strengths}
              onToggle={() => toggleSection('strengths')}
            >
              <div className="analysisResult__strengths">
                {sections.keyStrengths.map((strength, index) => {
                  const parts = strength.split(/[.:]/);
                  const title = parts[0]?.trim() || strength.substring(0, 50);
                  const description = parts.length > 1 ? parts.slice(1).join('.').trim() : strength;
                  
                  return (
                    <div key={index} className="analysisResult__strengthCard">
                      <div className="analysisResult__strengthIcon">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="analysisResult__strengthText">
                        <strong>{title}</strong>
                        {description !== title && <span>{description}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionSection>
          )}

          {/* Focus Areas */}
          {sections.focusAreas && sections.focusAreas.length > 0 && (
            <AccordionSection
              id="focus"
              icon={<Lightbulb size={20} />}
              title="Focus Areas"
              expanded={expandedSections.focus}
              onToggle={() => toggleSection('focus')}
            >
              <div className="analysisResult__focusAreas">
                {sections.focusAreas.map((area, index) => (
                  <div key={index} className="analysisResult__focusCard">
                    <h5 className="analysisResult__focusTitle">{area.title || area}</h5>
                    {area.description && (
                      <p className="analysisResult__focusDescription">{area.description}</p>
                    )}
                    {area.howToImprove && (
                      <div className="analysisResult__focusImprove">
                        <strong>How to improve:</strong> {area.howToImprove}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Action Plan */}
          {sections.actionPlan && sections.actionPlan.length > 0 && (
            <AccordionSection
              id="action"
              icon={<Rocket size={20} />}
              title="Action Plan"
              expanded={expandedSections.action}
              onToggle={() => toggleSection('action')}
            >
              <div className="analysisResult__actionPlan">
                {sections.actionPlan.map((action, actionIndex) => {
                  const actionTitle = typeof action === 'string' ? action : action.title;
                  const actionDetails = typeof action === 'string' ? [] : (action.details || []);
                  const isIntro = action.isIntro || false;
                  
                  if (isIntro) {
                    return (
                      <div key={actionIndex} className="analysisResult__actionIntro">
                        <p>{actionTitle}</p>
                      </div>
                    );
                  }
                  
                  const actualActionIndex = sections.actionPlan
                    .slice(0, actionIndex)
                    .filter(a => !a.isIntro).length;
                  
                  const parsedDetails = {
                    whatToDo: null,
                    whyItMatters: null,
                    example: null,
                    other: []
                  };

                  actionDetails.forEach((detail) => {
                    const lowerDetail = detail.toLowerCase();
                    if (lowerDetail.includes('what to do') || (parsedDetails.whatToDo === null && actionDetails.indexOf(detail) === 0)) {
                      parsedDetails.whatToDo = detail.replace(/^[-*•]\s*(what to do)[:\s-]+/i, '').trim();
                    } else if (lowerDetail.includes('why it matters') || lowerDetail.includes('why')) {
                      parsedDetails.whyItMatters = detail.replace(/^[-*•]\s*(why it matters|why)[:\s-]+/i, '').trim();
                    } else if (lowerDetail.includes('example')) {
                      parsedDetails.example = detail.replace(/^[-*•]\s*(example)[:\s-]+/i, '').trim();
                    } else {
                      parsedDetails.other.push(detail);
                    }
                  });

                  const summary =
                    parsedDetails.whyItMatters ||
                    parsedDetails.whatToDo ||
                    parsedDetails.example ||
                    actionDetails[0] ||
                    'Keep this focus top-of-mind during your next recording.';

                  const showSummaryToggle = summary.length > 220;

                  return (
                    <div key={actionIndex} className="analysisResult__actionCard">
                      <div className="analysisResult__actionBadge">
                        Focus {actualActionIndex + 1}
                      </div>
                      <div className="analysisResult__actionTitle">{actionTitle}</div>
                      {summary && (
                        <ExpandableText text={summary} collapsedLines={3} />
                      )}
                      {(parsedDetails.whatToDo || parsedDetails.whyItMatters || parsedDetails.example || parsedDetails.other.length > 0) && (
                        <div className="analysisResult__actionDetails">
                          {parsedDetails.whatToDo && (
                            <div className="analysisResult__actionDetail">
                              <span className="analysisResult__actionDetailLabel">What to practice</span>
                              <ExpandableText text={parsedDetails.whatToDo} collapsedLines={2} threshold={600} />
                            </div>
                          )}
                          {parsedDetails.whyItMatters && (
                            <div className="analysisResult__actionDetail">
                              <span className="analysisResult__actionDetailLabel">Why it matters</span>
                              <ExpandableText text={parsedDetails.whyItMatters} collapsedLines={2} threshold={600} />
                            </div>
                          )}
                          {parsedDetails.example && (
                            <div className="analysisResult__actionDetail">
                              <span className="analysisResult__actionDetailLabel">Example</span>
                              <ExpandableText text={parsedDetails.example} collapsedLines={2} threshold={600} />
                            </div>
                          )}
                          {parsedDetails.other.map((detail, detailIndex) => (
                            <div key={detailIndex} className="analysisResult__actionDetail">
                              <ExpandableText text={detail} collapsedLines={2} threshold={600} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </AccordionSection>
          )}

          {/* Quick Wins */}
          {sections.quickWins && sections.quickWins.length > 0 && (
            <AccordionSection
              id="quick"
              icon={<MessageSquare size={20} />}
              title="Quick Wins"
              expanded={expandedSections.quick}
              onToggle={() => toggleSection('quick')}
            >
              <div className="analysisResult__quickWins">
                {sections.quickWins.map((win, index) => (
                  <div key={index} className="analysisResult__quickWinCard">
                    <div className="analysisResult__quickWinIcon">
                      <Lightbulb size={20} />
                    </div>
                    <p className="analysisResult__quickWinText">{win}</p>
                  </div>
                ))}
              </div>
            </AccordionSection>
          )}
        </>
      )}

    </div>
  );
}

// Accordion Section Component
function AccordionSection({ id, icon, title, emoji, expanded, onToggle, children }) {
  return (
    <div className={`analysisResult__section analysisResult__accordion ${expanded ? 'expanded' : ''}`}>
      <button
        className="analysisResult__accordionHeader"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`accordion-content-${id}`}
      >
        <div className="analysisResult__sectionHeader">
          <div className="analysisResult__sectionIcon">
            {icon}
          </div>
          <h4 className="analysisResult__sectionTitle">
            {title}
          </h4>
        </div>
        <ChevronDown 
          className={`analysisResult__chevron ${expanded ? 'expanded' : ''}`}
          size={20}
        />
      </button>
      <div
        id={`accordion-content-${id}`}
        className={`analysisResult__accordionContent ${expanded ? 'expanded' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}

const ExpandableText = ({ text, collapsedLines = 3, threshold = 220 }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const shouldCollapse = text.length > threshold;

  return (
    <div className={`analysisResult__expandableText ${expanded ? 'expanded' : ''}`}>
      <p className="analysisResult__actionSummary" style={shouldCollapse && !expanded ? {
        display: '-webkit-box',
        WebkitLineClamp: collapsedLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      } : undefined}>
        {text}
      </p>
      {shouldCollapse && (
        <button
          type="button"
          className="analysisResult__expandToggle"
          onClick={() => setExpanded(prev => !prev)}
        >
          {expanded ? 'Show less' : 'Show more'}
          <ChevronDown size={16} className={expanded ? 'rotated' : ''} />
        </button>
      )}
    </div>
  );
};
