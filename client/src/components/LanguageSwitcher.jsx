import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { Globe } from 'lucide-react';
import './LanguageSwitcher.css';

export default function LanguageSwitcher({ showLabel = false, className = '' }) {
  const { i18n } = useTranslation();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Load user's language preference on mount
  useEffect(() => {
    if (user?.id) {
      const loadLanguagePreference = async () => {
        try {
          const res = await fetch(`${apiBase}/api/user/language-preference`, {
            headers: {
              'X-Clerk-User-Id': user.id,
              'Content-Type': 'application/json'
            }
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.languagePreference && data.languagePreference !== i18n.language) {
              await i18n.changeLanguage(data.languagePreference);
            }
          }
        } catch (err) {
          console.error('Failed to load language preference:', err);
        }
      };
      
      loadLanguagePreference();
    }
  }, [user?.id, apiBase, i18n]);

  const handleLanguageChange = async (newLanguage) => {
    if (newLanguage === i18n.language || loading) return;
    
    setLoading(true);
    try {
      // Change language immediately for better UX
      await i18n.changeLanguage(newLanguage);
      
      // Save to database if user is logged in
      if (user?.id) {
        const res = await fetch(`${apiBase}/api/user/language-preference`, {
          method: 'PUT',
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ languagePreference: newLanguage })
        });
        
        if (!res.ok) {
          console.error('Failed to save language preference');
          // Revert on error
          await i18n.changeLanguage(i18n.language);
        }
      }
    } catch (err) {
      console.error('Failed to change language:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentLanguage = i18n.language;

  const { t } = useTranslation();

  return (
    <div className={`languageSwitcher ${className}`}>
      {showLabel && (
        <span className="languageSwitcher__label">
          <Globe size={16} />
          <span>{t('header.language.label')}</span>
        </span>
      )}
      <div className="languageSwitcher__options">
        <button
          className={`languageSwitcher__option ${currentLanguage === 'en' ? 'is-active' : ''}`}
          onClick={() => handleLanguageChange('en')}
          disabled={loading}
          aria-label="Switch to English"
        >
          English
        </button>
        <button
          className={`languageSwitcher__option ${currentLanguage === 'he' ? 'is-active' : ''}`}
          onClick={() => handleLanguageChange('he')}
          disabled={loading}
          aria-label="Switch to Hebrew"
        >
          עברית
        </button>
      </div>
    </div>
  );
}


