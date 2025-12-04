import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb, Target, ArrowRight } from 'lucide-react';
import './TopOpportunityCard.css';

export default function TopOpportunityCard({ opportunity, currentScore, targetScore, onLearnMore, onPractice }) {
  const { t } = useTranslation();
  if (!opportunity) return null;

  const opportunityText = typeof opportunity === 'string' 
    ? opportunity 
    : (opportunity.title || opportunity);
  
  const parts = opportunityText.split(/[.:]/);
  const title = parts[0]?.trim() || opportunityText.substring(0, 50);
  const description = parts.length > 1 
    ? parts.slice(1).join('.').trim() 
    : (typeof opportunity === 'object' && opportunity.description) || null;

  const extractImprovements = (text) => {
    if (!text) return [];
    return text
      .split(/(?:\n|•|-|–|—)/)
      .map((item) => item.replace(/^\d+[.)]\s*/, '').trim())
      .filter(Boolean)
      .map((item) => item.length > 120 ? `${item.slice(0, 117)}…` : item);
  };

  const improvementSource = typeof opportunity === 'object' 
    ? opportunity.howToImprove || ''
    : '';
  const improvementBullets = extractImprovements(improvementSource).slice(0, 3);

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
        <h3 className="topOpportunityCard__title">{t('analysisResult.topCards.biggestOpportunity')}</h3>
      </div>

      <div className="topOpportunityCard__content">
        <div className="topOpportunityCard__name">{title}</div>

        {current && (
          <div className="topOpportunityCard__scores">
            <div className="topOpportunityCard__scoreItem">
              <span className="topOpportunityCard__scoreLabel">{t('analysisResult.topCards.currentLabel')}:</span>
              <span className="topOpportunityCard__scoreValue">{current.toFixed(1)}/10</span>
            </div>
            <ArrowRight size={16} className="topOpportunityCard__arrow" />
            <div className="topOpportunityCard__scoreItem">
              <span className="topOpportunityCard__scoreLabel">{t('analysisResult.topCards.targetLabel')}:</span>
              <span className="topOpportunityCard__scoreValue topOpportunityCard__scoreValue--target">
                {target.toFixed(1)}/10
              </span>
            </div>
          </div>
        )}

        {current && (
          <div className="topOpportunityCard__progress topOpportunityCard__progress--meter">
            <div className="topOpportunityCard__progressMeter">
              <span className="topOpportunityCard__progressLabel">{t('analysisResult.topCards.nowLabel')}</span>
              <span className="topOpportunityCard__progressValue">{current.toFixed(1)}</span>
            </div>
            <div className="topOpportunityCard__progressMeter topOpportunityCard__progressMeter--target">
              <span className="topOpportunityCard__progressLabel">{t('analysisResult.topCards.targetLabel')}</span>
              <span className="topOpportunityCard__progressValue">{target.toFixed(1)}</span>
            </div>
          </div>
        )}

        {description && (
          <div className="topOpportunityCard__why">
            <span className="topOpportunityCard__tag">{t('analysisResult.whyItMatters')}</span>
            <p className="topOpportunityCard__whyText">{description}</p>
          </div>
        )}

        {improvementBullets.length > 0 && (
          <div className="topOpportunityCard__improvements">
            <span className="topOpportunityCard__tag">{t('analysisResult.topCards.focusOn')}</span>
            <ul className="topOpportunityCard__improvementList">
              {improvementBullets.map((item, idx) => (
                <li key={idx} className="topOpportunityCard__improvementItem">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!description && improvementBullets.length === 0 && (
          <p className="topOpportunityCard__hint">
            {t('analysisResult.topCards.opportunityHint')}
          </p>
        )}

        <div className="topOpportunityCard__actions">
          {onLearnMore && (
            <button
              className="topOpportunityCard__button topOpportunityCard__button--secondary"
              onClick={onLearnMore}
            >
              <Lightbulb size={16} />
              {t('analysisResult.topCards.learnHow')}
            </button>
          )}
          {onPractice && (
            <button
              className="topOpportunityCard__button topOpportunityCard__button--primary"
              onClick={onPractice}
            >
              <Target size={16} />
              {t('analysisResult.topCards.practiceNow')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

