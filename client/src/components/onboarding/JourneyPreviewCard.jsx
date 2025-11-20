import React from 'react';
import { Compass, Target, CalendarCheck2, Sparkles } from 'lucide-react';

export default function JourneyPreviewCard({
  template,
  difficultyBaseline,
  practiceCommitment,
  coachArchetypeLabel,
  weeklyPromiseLabel
}) {
  if (!template) return null;

  return (
    <div className="journeyPreview">
      <div className="journeyPreview__header">
        <div>
          <p className="journeyPreview__eyebrow">{template.id}</p>
          <h3 className="journeyPreview__title">{template.title}</h3>
          <p className="journeyPreview__subtitle">{template.tagline}</p>
        </div>
        <div className="journeyPreview__badge">
          <Compass size={18} />
          <span>{template.durationLabel}</span>
        </div>
      </div>

      <div className="journeyPreview__grid">
        <div className="journeyPreview__panel">
          <div className="journeyPreview__panelHeader">
            <Target size={16} />
            <span>Primary KPIs</span>
          </div>
          <div className="journeyPreview__chips">
            {template.kpis.map((kpi) => (
              <span key={kpi} className="journeyPreview__chip">
                {kpi}
              </span>
            ))}
          </div>
          <p className="journeyPreview__panelBody">{template.focusPhrase}</p>
        </div>

        <div className="journeyPreview__panel">
          <div className="journeyPreview__panelHeader">
            <CalendarCheck2 size={16} />
            <span>Milestones</span>
          </div>
          <ul className="journeyPreview__timeline">
            {template.milestones.map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="journeyPreview__footer">
        <div className="journeyPreview__meta">
          <span className="journeyPreview__metaLabel">Baseline</span>
          <span className="journeyPreview__metaValue">
            {difficultyBaseline ? template.baselineCopy[difficultyBaseline] : 'Select your comfort level'}
          </span>
        </div>
        <div className="journeyPreview__meta">
          <span className="journeyPreview__metaLabel">Practice cadence</span>
          <span className="journeyPreview__metaValue">
            {practiceCommitment ? template.commitmentCopy[practiceCommitment] : template.cadence}
          </span>
        </div>
        {coachArchetypeLabel && (
          <div className="journeyPreview__meta">
            <span className="journeyPreview__metaLabel">Coach archetype</span>
            <span className="journeyPreview__metaValue">
              {coachArchetypeLabel}
            </span>
          </div>
        )}
        {weeklyPromiseLabel && (
          <div className="journeyPreview__meta">
            <span className="journeyPreview__metaLabel">Weekly promise</span>
            <span className="journeyPreview__metaValue">
              {weeklyPromiseLabel}
            </span>
          </div>
        )}
        <div className="journeyPreview__meta journeyPreview__meta--highlight">
          <Sparkles size={16} />
          <span>{template.promise}</span>
        </div>
      </div>
    </div>
  );
}

