import React from 'react';
import { useTranslation } from 'react-i18next';

export default function JourneySwitcher({
  journeys = [],
  journeysLoading = false,
  activeJourneyId = null,
  onSelectJourney,
  onAddJourney,
  className = ''
}) {
  const { t } = useTranslation();
  const containerClass = className?.trim() || 'dashboard__journeyTabs';

  // Re-implement formatGoalLabel using i18n
  const getGoalLabel = (slug) => {
    const goalMap = {
      'confidence': t('myProgress.goals.confidence', 'Build Confidence'),
      'content': t('myProgress.goals.content', 'Content Creator'),
      'presentation': t('myProgress.goals.presentation', 'Presentation Skills'),
      'leadership': t('myProgress.goals.leadership', 'Executive Presence'),
      'interview': t('myProgress.goals.interview', 'Job Interviews'),
      'sales': t('myProgress.goals.sales', 'Face-to-face Sales'),
      'dating': t('myProgress.goals.dating', 'Dating & Romantic'),
      'social': t('myProgress.goals.social', 'Social Confidence'),
      'general': t('myProgress.goals.general', 'General Improvement')
    };
    if (!slug) return t('dashboard.journey', 'Journey');
    return goalMap[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
  };

  if (journeysLoading) {
    return (
      <div className={containerClass}>
        <div className="journeyTabs__loading">{t('common.buttons.loading', 'Loading...')}</div>
      </div>
    );
  }

  if (!journeys || journeys.length === 0) {
    return (
      <div className={containerClass}>
        <div className="journeyTabs__empty">
          <div>
            <p className="journeyTabs__emptyTitle">{t('myAnalyses.emptyTitle', 'No journeys yet')}</p>
            <p className="journeyTabs__emptySubtitle">
              {t('myAnalyses.emptyDescription', 'Choose a journey to get personalized coaching.')}
            </p>
          </div>
          {onAddJourney && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={onAddJourney}
            >
              {t('dashboard.newJourney', 'Start Your First Journey')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {journeys.map((journey) => {
        // Use translated label if available via goal slug map, fallback to db values
        const label = journey.focus_slug 
          ? getGoalLabel(journey.focus_slug) 
          : (journey.display_name || journey.focus_label);
          
        return (
          <button
            key={journey.id}
            type="button"
            className={`journeyTab ${journey.id === activeJourneyId ? 'journeyTab--active' : ''}`}
            onClick={() => journey.id !== activeJourneyId && onSelectJourney?.(journey.id)}
          >
            <span className="journeyTab__title">{label}</span>
          </button>
        );
      })}
      {onAddJourney && (
        <button
          type="button"
          className="journeyTab journeyTab--add"
          onClick={onAddJourney}
        >
          + {t('dashboard.newJourney', 'New Journey')}
        </button>
      )}
    </div>
  );
}
