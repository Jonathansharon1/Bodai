import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingUp } from 'lucide-react';
import './TopStrengthCard.css';

export default function TopStrengthCard({ strength, score, category }) {
  const { t } = useTranslation();
  if (!strength) return null;

  const strengthText = typeof strength === 'string' ? strength : strength.title || strength;
  const parts = strengthText.split(/[.:]/);
  const title = parts[0]?.trim() || strengthText.substring(0, 50);
  const description = parts.length > 1 ? parts.slice(1).join('.').trim() : null;

  const getStars = (score) => {
    if (!score) return '⭐⭐⭐⭐⭐';
    const num = Math.round(parseFloat(score) / 2);
    return '⭐'.repeat(Math.max(1, Math.min(5, num)));
  };

  return (
    <div className="topStrengthCard">
      <div className="topStrengthCard__header">
        <div className="topStrengthCard__icon">
          <Sparkles size={24} />
        </div>
        <h3 className="topStrengthCard__title">{t('analysisResult.topCards.strongestPoint')}</h3>
      </div>

      <div className="topStrengthCard__content">
        <div className="topStrengthCard__name">{title}</div>
        
        {score && (
          <div className="topStrengthCard__scoreSection">
            <div className="topStrengthCard__scoreValue">{parseFloat(score).toFixed(1)}</div>
            <div className="topStrengthCard__scoreMax">/ 10</div>
            <div className="topStrengthCard__stars">{getStars(score)}</div>
          </div>
        )}

        {description && (
          <p className="topStrengthCard__description">{description}</p>
        )}

        {!description && (
          <p className="topStrengthCard__encouragement">
            {t('analysisResult.topCards.strongestEncouragement')}
          </p>
        )}

        {category && (
          <div className="topStrengthCard__category">
            <TrendingUp size={16} />
            <span>{category}</span>
          </div>
        )}
      </div>
    </div>
  );
}

