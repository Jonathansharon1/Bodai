import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus, Calendar, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import './BeforeAfterComparison.css';

const METRIC_ORDER = ['overall_score', 'presence', 'voice_expression', 'clarity', 'authenticity', 'impact', 'confidence'];

export default function BeforeAfterComparison({ 
  firstAnalysis, 
  latestAnalysis,
  allMetrics = []
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const METRIC_LABELS = {
    overall_score: t('parameters.metrics.overallScore'),
    presence: t('parameters.metrics.presence'),
    voice_expression: t('parameters.metrics.voice'),
    clarity: t('parameters.metrics.clarity'),
    authenticity: t('parameters.metrics.authenticity'),
    impact: t('parameters.metrics.impact'),
    confidence: t('parameters.metrics.confidence')
  };

  // Calculate comparison data
  const comparisonData = useMemo(() => {
    if (!firstAnalysis || !latestAnalysis) return null;

    const firstMetrics = firstAnalysis.metrics || firstAnalysis;
    const latestMetrics = latestAnalysis.metrics || latestAnalysis;

    const comparisons = METRIC_ORDER.map(key => {
      const first = parseFloat(firstMetrics[key]) || 0;
      const latest = parseFloat(latestMetrics[key]) || 0;
      const change = latest - first;
      const percentChange = first > 0 ? ((latest - first) / first * 100) : 0;
      
      return {
        key,
        label: METRIC_LABELS[key] || key,
        first: first.toFixed(1),
        latest: latest.toFixed(1),
        change: change.toFixed(1),
        percentChange: percentChange.toFixed(0),
        isPositive: change > 0.2,
        isNegative: change < -0.2,
        isNeutral: Math.abs(change) <= 0.2
      };
    });

    // Calculate overall improvement
    const overallFirst = parseFloat(firstMetrics.overall_score) || 0;
    const overallLatest = parseFloat(latestMetrics.overall_score) || 0;
    const overallChange = overallLatest - overallFirst;
    
    return {
      comparisons,
      overallChange,
      overallFirst,
      overallLatest,
      firstDate: firstAnalysis.created_at || firstAnalysis.date,
      latestDate: latestAnalysis.created_at || latestAnalysis.date,
      totalSessions: allMetrics.length || 2,
      improvements: comparisons.filter(c => c.isPositive).length,
      declines: comparisons.filter(c => c.isNegative).length
    };
  }, [firstAnalysis, latestAnalysis, allMetrics]);

  if (!comparisonData) {
    return null;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTrendIcon = (comparison) => {
    if (comparison.isPositive) return <TrendingUp size={16} className="trend-icon positive" />;
    if (comparison.isNegative) return <TrendingDown size={16} className="trend-icon negative" />;
    return <Minus size={16} className="trend-icon neutral" />;
  };

  const getProgressBarWidth = (value, max = 10) => {
    return `${(parseFloat(value) / max) * 100}%`;
  };

  return (
    <div className={`beforeAfter ${expanded ? 'beforeAfter--expanded' : ''}`}>
      {/* Header Summary */}
      <div className="beforeAfter__header" onClick={() => setExpanded(!expanded)}>
        <div className="beforeAfter__titleRow">
          <Trophy size={20} className="beforeAfter__icon" />
          <h3 className="beforeAfter__title">Your Progress Journey</h3>
          <button className="beforeAfter__toggle" aria-label={expanded ? 'Collapse' : 'Expand'}>
            <span className="beforeAfter__toggleText">{expanded ? 'Hide Details' : 'View Details'}</span>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
        
        <div className="beforeAfter__summary">
          <div className="beforeAfter__overallChange">
            <span className={`beforeAfter__changeValue ${comparisonData.overallChange >= 0 ? 'positive' : 'negative'}`}>
              {comparisonData.overallChange >= 0 ? '+' : ''}{comparisonData.overallChange.toFixed(1)}
            </span>
            <span className="beforeAfter__changeLabel">overall improvement</span>
          </div>
          
          <div className="beforeAfter__quickStats">
            <span className="beforeAfter__stat">
              <span className="beforeAfter__statValue">{comparisonData.totalSessions}</span>
              <span className="beforeAfter__statLabel">sessions</span>
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Comparison View */}
      {expanded && (
        <div className="beforeAfter__content">
          {/* Timeline */}
          <div className="beforeAfter__timeline">
            <div className="beforeAfter__timelinePoint beforeAfter__timelinePoint--first">
              <Calendar size={14} />
              <span>First: {formatDate(comparisonData.firstDate)}</span>
            </div>
            <div className="beforeAfter__timelineLine" />
            <div className="beforeAfter__timelinePoint beforeAfter__timelinePoint--latest">
              <Calendar size={14} />
              <span>Latest: {formatDate(comparisonData.latestDate)}</span>
            </div>
          </div>

          {/* Detailed Comparisons */}
          <div className="beforeAfter__metrics">
            {comparisonData.comparisons.map((metric) => (
              <div key={metric.key} className="beforeAfter__metric">
                <div className="beforeAfter__metricHeader">
                  <span className="beforeAfter__metricLabel">{metric.label}</span>
                  <div className="beforeAfter__metricChange">
                    {getTrendIcon(metric)}
                    <span className={`beforeAfter__metricDiff ${metric.isPositive ? 'positive' : metric.isNegative ? 'negative' : 'neutral'}`}>
                      {parseFloat(metric.change) >= 0 ? '+' : ''}{metric.change}
                    </span>
                  </div>
                </div>
                
                <div className="beforeAfter__metricBars">
                  <div className="beforeAfter__metricBar">
                    <span className="beforeAfter__barLabel">Before</span>
                    <div className="beforeAfter__barContainer">
                      <div 
                        className="beforeAfter__barFill beforeAfter__barFill--first" 
                        style={{ width: getProgressBarWidth(metric.first) }}
                      />
                    </div>
                    <span className="beforeAfter__barValue">{metric.first}</span>
                  </div>
                  
                  <div className="beforeAfter__metricBar">
                    <span className="beforeAfter__barLabel">Now</span>
                    <div className="beforeAfter__barContainer">
                      <div 
                        className={`beforeAfter__barFill beforeAfter__barFill--latest ${metric.isPositive ? 'improved' : ''}`}
                        style={{ width: getProgressBarWidth(metric.latest) }}
                      />
                    </div>
                    <span className="beforeAfter__barValue">{metric.latest}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Encouragement Message */}
          <div className="beforeAfter__encouragement">
            {comparisonData.overallChange >= 2 ? (
              <p>Amazing progress! You've improved significantly since you started. Keep up the great work!</p>
            ) : comparisonData.overallChange >= 0.5 ? (
              <p>You're making steady progress! Consistency is key - keep practicing.</p>
            ) : comparisonData.overallChange >= 0 ? (
              <p>You're maintaining your skills. Try focusing on one area at a time for faster improvement.</p>
            ) : (
              <p>Don't worry about small dips - they're normal! Focus on your strengths and keep practicing.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

