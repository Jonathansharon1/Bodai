import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import './VideoDuplicateModal.css';

export default function VideoDuplicateModal({ isOpen, onClose, message, isRtl }) {
  const { t, i18n } = useTranslation();
  const isHebrew = i18n.language && i18n.language.startsWith('he');
  const rtlClass = isHebrew || isRtl ? 'videoDuplicateModal--rtl' : '';

  if (!isOpen) return null;

  return (
    <div className={`videoDuplicateModal__overlay ${rtlClass}`} onClick={onClose}>
      <div className="videoDuplicateModal__content" onClick={(e) => e.stopPropagation()}>
        <button className="videoDuplicateModal__close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="videoDuplicateModal__icon">
          <div className="videoDuplicateModal__iconWrapper">
            <RefreshCw size={40} className="videoDuplicateModal__iconMain" />
          </div>
        </div>
        
        <h2 className="videoDuplicateModal__title">
          {t('videoDuplicateModal.title')}
        </h2>
        
        <p className="videoDuplicateModal__message">
          {t('videoDuplicateModal.message', { defaultValue: message || 'Looks like this exact clip was already analyzed. Record a fresh take to unlock new insights.' })}
        </p>
        
        <div className="videoDuplicateModal__info">
          <div className="videoDuplicateModal__infoItem">
            <div className="videoDuplicateModal__infoIcon">
              <AlertCircle size={18} />
            </div>
            <div className="videoDuplicateModal__infoText">
              <strong>{t('videoDuplicateModal.whyTitle')}</strong>
              <p>{t('videoDuplicateModal.whyDescription')}</p>
            </div>
          </div>
        </div>
        
        <div className="videoDuplicateModal__actions">
          <button 
            className="videoDuplicateModal__button videoDuplicateModal__button--primary" 
            onClick={onClose}
          >
            {t('videoDuplicateModal.cta')}
          </button>
        </div>
      </div>
    </div>
  );
}


