import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Mic, Target, Heart, Zap, Award, ChevronDown } from 'lucide-react';
import './CategoryOverview.css';

const getStars = (score) => {
  const num = Math.round(score / 2); // Convert 0-10 to 0-5 stars
  return '⭐'.repeat(Math.max(0, Math.min(5, num)));
};

const getScoreColor = (score) => {
  if (score >= 8) return '#10b981'; // green
  if (score >= 6) return '#f59e0b'; // orange
  return '#ef4444'; // red
};

export default function CategoryOverview({ metrics, onCategoryClick }) {
  const { t } = useTranslation();
  const [expandedCategory, setExpandedCategory] = useState(null);

  const CATEGORIES = useMemo(() => [
    { key: 'presence', label: t('parameters.metrics.presence'), icon: Eye, color: '#3b82f6' },
    { key: 'voice_expression', label: t('parameters.metrics.voice'), icon: Mic, color: '#10b981' },
    { key: 'clarity', label: t('parameters.metrics.clarity'), icon: Target, color: '#f59e0b' },
    { key: 'authenticity', label: t('parameters.metrics.authenticity'), icon: Heart, color: '#8b5cf6' },
    { key: 'impact', label: t('parameters.metrics.impact'), icon: Zap, color: '#ef4444' },
    { key: 'confidence', label: t('parameters.metrics.confidence'), icon: Award, color: '#06b6d4' }
  ], [t]);

  if (!metrics) return null;

  const handleCategoryClick = (categoryKey) => {
    if (onCategoryClick) {
      onCategoryClick(categoryKey);
    } else {
      setExpandedCategory(expandedCategory === categoryKey ? null : categoryKey);
    }
  };

  return (
    <div className="categoryOverview">
      <div className="categoryOverview__header">
        <h3 className="categoryOverview__title">Performance Overview</h3>
        <p className="categoryOverview__subtitle">Click any category to see details</p>
      </div>

      <div className="categoryOverview__grid">
        {CATEGORIES.map((category) => {
          const score = parseFloat(metrics[category.key]) || 0;
          const IconComponent = category.icon;
          const isExpanded = expandedCategory === category.key;
          const scoreColor = getScoreColor(score);

          return (
            <div
              key={category.key}
              className={`categoryOverview__card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => handleCategoryClick(category.key)}
            >
              <div className="categoryOverview__cardHeader">
                <div className="categoryOverview__cardIcon" style={{ color: category.color }}>
                  <IconComponent size={24} />
                </div>
                <div className="categoryOverview__cardInfo">
                  <div className="categoryOverview__cardLabel">{category.label}</div>
                  <div className="categoryOverview__cardScore" style={{ color: scoreColor }}>
                    {score.toFixed(1)}
                  </div>
                </div>
                <div className="categoryOverview__cardStars">
                  {getStars(score)}
                </div>
              </div>
              
              {isExpanded && (
                <div className="categoryOverview__cardDetails">
                  <div className="categoryOverview__progressBar">
                    <div
                      className="categoryOverview__progressFill"
                      style={{
                        width: `${(score / 10) * 100}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                  <p className="categoryOverview__cardHint">
                    Click to see detailed breakdown
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

