import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Zap, ArrowRight, Check, TrendingUp, BarChart3 } from 'lucide-react';
import './UpgradeModal.css';

export default function UpgradeModal({ isOpen, onClose, message }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <div className="upgradeModal__overlay" onClick={onClose}>
      <div className="upgradeModal__content" onClick={(e) => e.stopPropagation()}>
        <button className="upgradeModal__close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="upgradeModal__icon">
          <div className="upgradeModal__iconWrapper">
            <Zap size={40} className="upgradeModal__iconMain" />
          </div>
        </div>
        
        <h2 className="upgradeModal__title">
          {t('subscription.limitModal.title')}
        </h2>
        
        <p className="upgradeModal__message">
          {t('subscription.limitModal.message')}
        </p>
        
        <div className="upgradeModal__actions">
          <button className="upgradeModal__button upgradeModal__button--primary" onClick={handleUpgrade}>
            {t('subscription.limitModal.viewPlans')}
            <ArrowRight size={18} />
          </button>
          <button className="upgradeModal__button upgradeModal__button--secondary" onClick={onClose}>
            {t('subscription.limitModal.maybeLater')}
          </button>
        </div>
      </div>
    </div>
  );
}

