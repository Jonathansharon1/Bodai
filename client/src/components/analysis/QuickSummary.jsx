import React from 'react';
import { CheckCircle2, Lightbulb, BarChart3 } from 'lucide-react';
import './QuickSummary.css';

export default function QuickSummary({ strengths, focusAreas, metrics }) {
  // Get top 2 strengths
  const topStrengths = strengths?.slice(0, 2) || [];
  
  // Get top 1 focus area (opportunity)
  const topOpportunity = focusAreas?.[0] || null;

  // Helper to get score for a strength/opportunity
  const getScoreForItem = (item) => {
    if (!metrics || !item) return null;
    
    // Try to match item text to metric keys
    const itemText = typeof item === 'string' ? item.toLowerCase() : (item.title || '').toLowerCase();
    
    if (itemText.includes('eye') || itemText.includes('contact')) {
      return metrics.presence ? parseFloat(metrics.presence).toFixed(1) : null;
    }
    if (itemText.includes('gesture') || itemText.includes('hand')) {
      return metrics.presence ? parseFloat(metrics.presence).toFixed(1) : null;
    }
    if (itemText.includes('voice') || itemText.includes('vocal') || itemText.includes('pace')) {
      return metrics.voice_expression ? parseFloat(metrics.voice_expression).toFixed(1) : null;
    }
    if (itemText.includes('clarity') || itemText.includes('structure')) {
      return metrics.clarity ? parseFloat(metrics.clarity).toFixed(1) : null;
    }
    if (itemText.includes('authentic') || itemText.includes('natural')) {
      return metrics.authenticity ? parseFloat(metrics.authenticity).toFixed(1) : null;
    }
    if (itemText.includes('confidence') || itemText.includes('filler')) {
      return metrics.confidence ? parseFloat(metrics.confidence).toFixed(1) : null;
    }
    
    return null;
  };

  if (topStrengths.length === 0 && !topOpportunity) {
    return null;
  }

  const splitIntoSentences = (text) => {
    if (!text) return [];
    return text
      .split(/(?<=[.?!])\s+/)
      .map(sentence => sentence.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);
  };

  return (
    <div className="quickSummary">
      <div className="quickSummary__header">
        <div className="quickSummary__headerLeft">
          <div className="quickSummary__headerIcon">
            <BarChart3 size={22} />
          </div>
          <div>
            <h3 className="quickSummary__title">Quick Summary</h3>
            <p className="quickSummary__subtitle">Key highlights at a glance</p>
          </div>
        </div>
      </div>

      <div className="quickSummary__grid">
        {/* Strengths */}
        {topStrengths.map((strength, index) => {
          const strengthText = typeof strength === 'string' ? strength : strength.title || strength;
          const score = getScoreForItem(strength);
          const parts = strengthText.split(/[.:]/);
          const title = parts[0]?.trim() || strengthText.substring(0, 40);
          const description = parts.length > 1 ? parts.slice(1).join('.').trim() : null;
          
          return (
            <div key={index} className="quickSummary__card quickSummary__card--strength">
              <div className="quickSummary__cardIcon">
                <CheckCircle2 size={24} />
              </div>
              <div className="quickSummary__cardContent">
                <div className="quickSummary__cardTitle">{title}</div>
                <div className="quickSummary__cardMeta">
                  {score ? (
                    <span className="quickSummary__cardMetric">Score {score}/10</span>
                  ) : (
                    <span className="quickSummary__cardMetric quickSummary__cardMetric--neutral">Keep doing this</span>
                  )}
                </div>
                <div className="quickSummary__cardDescription">
                  {splitIntoSentences(description || strengthText).map((sentence, idx) => (
                    <p key={idx}>{sentence}</p>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Opportunity */}
        {topOpportunity && (
          <div className="quickSummary__card quickSummary__card--opportunity">
            <div className="quickSummary__cardIcon">
              <Lightbulb size={24} />
            </div>
            <div className="quickSummary__cardContent">
              <div className="quickSummary__cardTitle">
                {typeof topOpportunity === 'string' 
                  ? topOpportunity.split(/[.:]/)[0]?.trim() || topOpportunity.substring(0, 40)
                  : topOpportunity.title || 'Improvement Opportunity'}
              </div>
              <div className="quickSummary__cardMeta">
                {(() => {
                  const score = getScoreForItem(topOpportunity);
                  return score ? (
                    <span className="quickSummary__cardMetric quickSummary__cardMetric--opportunity">
                      Current {score}/10
                    </span>
                  ) : (
                    <span className="quickSummary__cardMetric quickSummary__cardMetric--opportunity">
                      Priority focus
                    </span>
                  );
                })()}
              </div>
              <div className="quickSummary__cardDescription">
                {splitIntoSentences(
                  (typeof topOpportunity === 'object' && (topOpportunity.description || topOpportunity.howToImprove)) ||
                  (typeof topOpportunity === 'string' ? topOpportunity : '')
                ).map((sentence, idx) => (
                  <p key={idx}>{sentence}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

