import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { X, TrendingUp, Star } from 'lucide-react';
import './CelebrationModal.css';

export default function CelebrationModal({ 
  isOpen, 
  onClose, 
  improvement,
  metric = 'overall',
  currentScore,
  previousScore
}) {
  const { t } = useTranslation();
  const triggerConfetti = useCallback(() => {
    // Fire confetti from both sides
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 10001
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    // Left side burst
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      origin: { x: 0.2, y: 0.7 }
    });

    // Center burst
    fire(0.2, {
      spread: 60,
      origin: { x: 0.5, y: 0.7 }
    });

    // Right side burst
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      origin: { x: 0.8, y: 0.7 }
    });

    // Delayed second wave
    setTimeout(() => {
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });
    }, 200);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Small delay to let modal render first
      const timer = setTimeout(() => {
        triggerConfetti();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, triggerConfetti]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getMetricLabel = (metricKey) => {
    const labels = {
      overall: t('parameters.metrics.overallScore'),
      presence: t('parameters.metrics.presence'),
      voice_expression: t('parameters.metrics.voice'),
      clarity: t('parameters.metrics.clarity'),
      authenticity: t('parameters.metrics.authenticity'),
      impact: t('parameters.metrics.impact'),
      confidence: t('parameters.metrics.confidence')
    };
    return labels[metricKey] || t('parameters.metrics.overallScore');
  };

  const getMessage = () => {
    if (improvement >= 5) {
      return "Incredible progress! You're really leveling up!";
    } else if (improvement >= 3) {
      return "Amazing improvement! Keep up the great work!";
    } else if (improvement >= 1) {
      return "You're making steady progress! Every step counts.";
    } else {
      return "You're improving! Small wins lead to big changes.";
    }
  };

  return (
    <div className="celebrationModal__overlay" onClick={onClose}>
      <div className="celebrationModal" onClick={(e) => e.stopPropagation()}>
        <button className="celebrationModal__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        
        <div className="celebrationModal__content">
          <div className="celebrationModal__icon">
            <Star size={48} />
          </div>
          
          <h2 className="celebrationModal__title">You're Improving!</h2>
          
          <div className="celebrationModal__scoreChange">
            <div className="celebrationModal__scores">
              <span className="celebrationModal__prevScore">{Math.round(previousScore)}</span>
              <TrendingUp size={24} className="celebrationModal__arrow" />
              <span className="celebrationModal__newScore">{Math.round(currentScore)}</span>
            </div>
            <span className="celebrationModal__metric">{getMetricLabel(metric)}</span>
          </div>
          
          <div className="celebrationModal__improvement">
            <span className="celebrationModal__plus">+{improvement.toFixed(1)}</span>
            <span>{t('dashboard.pointsSinceLastSession')}</span>
          </div>
          
          <p className="celebrationModal__message">{getMessage()}</p>
          
          <button className="btn btn--primary celebrationModal__cta" onClick={onClose}>
            Keep Going!
          </button>
        </div>
      </div>
    </div>
  );
}

