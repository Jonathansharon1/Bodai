import React from 'react';
import './WarmthCompetenceSlider.css';

export default function WarmthCompetenceSlider({ warmth, competence, onChange }) {
  const handleWarmthChange = (e) => {
    const newWarmth = parseInt(e.target.value);
    onChange(newWarmth, competence);
  };

  const handleCompetenceChange = (e) => {
    const newCompetence = parseInt(e.target.value);
    onChange(warmth, newCompetence);
  };

  const getWarmthLabel = (value) => {
    if (value <= 3) return 'Low';
    if (value <= 6) return 'Medium';
    return 'High';
  };

  const getCompetenceLabel = (value) => {
    if (value <= 3) return 'Low';
    if (value <= 6) return 'Medium';
    return 'High';
  };

  return (
    <div className="warmthCompetenceSlider">
      <div className="sliderGroup">
        <div className="sliderHeader">
          <label className="sliderLabel">Warmth</label>
          <span className="sliderValue">{warmth}/10 - {getWarmthLabel(warmth)}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={warmth}
          onChange={handleWarmthChange}
          className="sliderInput"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #f59e0b ${(warmth - 1) * 11.11}%, #3b82f6 ${(warmth - 1) * 11.11}%, #3b82f6 100%)`
          }}
        />
        <div className="sliderScale">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <div className="sliderGroup">
        <div className="sliderHeader">
          <label className="sliderLabel">Competence</label>
          <span className="sliderValue">{competence}/10 - {getCompetenceLabel(competence)}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={competence}
          onChange={handleCompetenceChange}
          className="sliderInput"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #f59e0b ${(competence - 1) * 11.11}%, #22c55e ${(competence - 1) * 11.11}%, #22c55e 100%)`
          }}
        />
        <div className="sliderScale">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}


