import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import './UpgradeModal.css';

export default function UpgradeModal({ isOpen, onClose, message }) {
  const navigate = useNavigate();

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
          <AlertCircle size={48} color="#F59E0B" />
        </div>
        
        <h2 className="upgradeModal__title">No Analyses Remaining</h2>
        
        <p className="upgradeModal__message">
          {message || "You've used all your analyses for this month. Upgrade to continue analyzing your body language and improving your communication skills."}
        </p>
        
        <div className="upgradeModal__benefits">
          <div className="upgradeModal__benefit">
            <Sparkles size={20} color="#46B5D1" />
            <span>Get more analyses per month</span>
          </div>
          <div className="upgradeModal__benefit">
            <Sparkles size={20} color="#46B5D1" />
            <span>Track your progress with advanced insights</span>
          </div>
          <div className="upgradeModal__benefit">
            <Sparkles size={20} color="#46B5D1" />
            <span>Unlock premium features</span>
          </div>
        </div>
        
        <div className="upgradeModal__actions">
          <button className="upgradeModal__button upgradeModal__button--primary" onClick={handleUpgrade}>
            View Pricing Plans
            <ArrowRight size={18} />
          </button>
          <button className="upgradeModal__button upgradeModal__button--secondary" onClick={onClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

