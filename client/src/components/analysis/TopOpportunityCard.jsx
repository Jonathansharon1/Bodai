import React from 'react';
import { Lightbulb, Target, ArrowRight } from 'lucide-react';
import './TopOpportunityCard.css';

export default function TopOpportunityCard({ opportunity, currentScore, targetScore, onLearnMore, onPractice }) {
  if (!opportunity) return null;

  const opportunityText = typeof opportunity === 'string' 
    ? opportunity 
    : (opportunity.title || opportunity);
  
  const parts = opportunityText.split(/[.:]/);
  const title = parts[0]?.trim() || opportunityText.substring(0, 50);
  const description = parts.length > 1 
    ? parts.slice(1).join('.').trim() 
    : (typeof opportunity === 'object' && opportunity.description) || null;

  const current = currentScore ? parseFloat(currentScore) : null;
  const target = targetScore ? parseFloat(targetScore) : (current ? current + 2 : 7);
  const currentPercent = current ? (current / 10) * 100 : 0;
  const targetPercent = (target / 10) * 100;

  return (
    <div className="topOpportunityCard">
      <div className="topOpportunityCard__header">
        <div className="topOpportunityCard__icon">
          <Lightbulb size={24} />
        </div>
        <h3 className="topOpportunityCard__title">Biggest Opportunity</h3>
      </div>

      <div className="topOpportunityCard__content">
        <div className="topOpportunityCard__name">{title}</div>

        {current && (
          <div className="topOpportunityCard__scores">
            <div className="topOpportunityCard__scoreItem">
              <span className="topOpportunityCard__scoreLabel">Current:</span>
              <span className="topOpportunityCard__scoreValue">{current.toFixed(1)}/10</span>
            </div>
            <ArrowRight size={16} className="topOpportunityCard__arrow" />
            <div className="topOpportunityCard__scoreItem">
              <span className="topOpportunityCard__scoreLabel">Target:</span>
              <span className="topOpportunityCard__scoreValue topOpportunityCard__scoreValue--target">
                {target.toFixed(1)}/10
              </span>
            </div>
          </div>
        )}

        <div className="topOpportunityCard__progress">
          <div className="topOpportunityCard__progressTrack">
            <div
              className="topOpportunityCard__progressCurrent"
              style={{ width: `${currentPercent}%` }}
            />
            <div
              className="topOpportunityCard__progressTarget"
              style={{ width: `${targetPercent}%` }}
            />
          </div>
          <div className="topOpportunityCard__progressLabels">
            <span>{currentPercent.toFixed(0)}%</span>
            <span>{targetPercent.toFixed(0)}%</span>
          </div>
        </div>

        {description && (
          <p className="topOpportunityCard__description">{description}</p>
        )}

        {!description && (
          <p className="topOpportunityCard__hint">
            Improving this will help you communicate more effectively. Let's work on it together!
          </p>
        )}

        <div className="topOpportunityCard__actions">
          {onLearnMore && (
            <button
              className="topOpportunityCard__button topOpportunityCard__button--secondary"
              onClick={onLearnMore}
            >
              <Lightbulb size={16} />
              Learn How
            </button>
          )}
          {onPractice && (
            <button
              className="topOpportunityCard__button topOpportunityCard__button--primary"
              onClick={onPractice}
            >
              <Target size={16} />
              Practice Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

