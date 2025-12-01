import React from 'react';

const formatGoalLabel = (slug) => {
  const labels = {
    confidence: 'Build Confidence',
    content: 'Content Creator',
    presentation: 'Presentation Skills',
    communication: 'Better Communication',
    leadership: 'Executive Presence',
    dating: 'Dating & Romantic',
    social: 'Social Confidence',
    general: 'General Improvement',
    interview: 'Job Interview Prep' // Legacy support
  };
  if (!slug) return 'Focus';
  return labels[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
};

export default function JourneySwitcher({
  journeys = [],
  journeysLoading = false,
  activeJourneyId = null,
  onSelectJourney,
  onAddJourney,
  className = ''
}) {
  const containerClass = className?.trim() || 'dashboard__journeyTabs';

  if (journeysLoading) {
    return (
      <div className={containerClass}>
        <div className="journeyTabs__loading">Loading focuses…</div>
      </div>
    );
  }

  if (!journeys || journeys.length === 0) {
    return (
      <div className={containerClass}>
        <div className="journeyTabs__empty">
          <div>
            <p className="journeyTabs__emptyTitle">No focuses yet</p>
            <p className="journeyTabs__emptySubtitle">
              Choose a goal (presentations, confidence, interviews, and more) to get personalized coaching.
            </p>
          </div>
          {onAddJourney && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={onAddJourney}
            >
              Start Your First Focus
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {journeys.map((journey) => {
        const label = journey.display_name || journey.focus_label || formatGoalLabel(journey.focus_slug);
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
          + New Focus
        </button>
      )}
    </div>
  );
}


