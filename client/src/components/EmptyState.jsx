import React from 'react';
import { Video, Target, BarChart3, Award, ArrowRight } from 'lucide-react';
import './EmptyState.css';

export default function EmptyState({
  icon: Icon = Target,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default', // 'default', 'practice', 'analyses', 'progress', 'achievements'
  showIllustration = true
}) {
  const variants = {
    practice: {
      icon: Target,
      gradient: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
      accentColor: '#2563eb'
    },
    analyses: {
      icon: Video,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
      accentColor: '#8b5cf6'
    },
    progress: {
      icon: BarChart3,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      accentColor: '#10b981'
    },
    achievements: {
      icon: Award,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      accentColor: '#f59e0b'
    },
    default: {
      icon: Icon,
      gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      accentColor: '#64748b'
    }
  };

  const config = variants[variant] || variants.default;
  const IconComponent = config.icon;

  return (
    <div className={`emptyState emptyState--${variant}`}>
      {showIllustration && (
        <div className="emptyState__illustration">
          <div className="emptyState__iconWrapper">
            <div 
              className="emptyState__iconBg"
              style={{ background: config.gradient }}
            />
            <IconComponent size={64} className="emptyState__icon" />
          </div>
        </div>
      )}
      <div className="emptyState__content">
        <h2 className="emptyState__title">{title}</h2>
        <p className="emptyState__description">{description}</p>
        {onAction && actionLabel && (
          <button 
            className="btn btn--primary btn--large emptyState__action"
            onClick={onAction}
          >
            <span>{actionLabel}</span>
            <ArrowRight size={18} className="emptyState__actionArrow" />
          </button>
        )}
      </div>
    </div>
  );
}

