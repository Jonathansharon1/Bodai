import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Clock, AlertCircle } from 'lucide-react';
import './VideoTooShortModal.css';

export default function VideoTooShortModal({ isOpen, onClose, message, isRtl }) {
  const { t, i18n } = useTranslation();
  const isHebrew = i18n.language && i18n.language.startsWith('he');
  const rtlClass = isHebrew || isRtl ? 'videoTooShortModal--rtl' : '';

  if (!isOpen) return null;

  return (
    <div className={`videoTooShortModal__overlay ${rtlClass}`} onClick={onClose}>
      <div className="videoTooShortModal__content" onClick={(e) => e.stopPropagation()}>
        <button className="videoTooShortModal__close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="videoTooShortModal__icon">
          <div className="videoTooShortModal__iconWrapper">
            <Clock size={40} className="videoTooShortModal__iconMain" />
          </div>
        </div>
        
        <h2 className="videoTooShortModal__title">
          {t('videoTooShortModal.title', { defaultValue: 'Video Too Short' })}
        </h2>
        
        <p className="videoTooShortModal__message">
          {t('videoTooShortModal.message', { defaultValue: message || 'Your video needs to be at least 30 seconds long to capture usable signal for analysis.' })}
        </p>
        
        <div className="videoTooShortModal__info">
          <div className="videoTooShortModal__infoItem">
            <div className="videoTooShortModal__infoIcon">
              <AlertCircle size={18} />
            </div>
            <div className="videoTooShortModal__infoText">
              <strong>{t('videoTooShortModal.whyTitle', { defaultValue: 'Why 30 seconds?' })}</strong>
              <p>{t('videoTooShortModal.whyDescription', { defaultValue: 'We need enough footage to analyze your body language patterns and provide meaningful feedback.' })}</p>
            </div>
          </div>
        </div>
        
        <div className="videoTooShortModal__actions">
          <button className="videoTooShortModal__button videoTooShortModal__button--primary" onClick={onClose}>
            {t('videoTooShortModal.understood', { defaultValue: 'Got it' })}
          </button>
        </div>
      </div>
    </div>
  );
}

