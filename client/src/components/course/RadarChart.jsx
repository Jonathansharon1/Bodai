import React from 'react';
import './RadarChart.css';

export default function RadarChart({ warmth, competence }) {
  // Normalize scores to 0-100 for display
  const warmthPercent = Math.min(100, Math.max(0, (warmth / 10) * 100));
  const competencePercent = Math.min(100, Math.max(0, (competence / 10) * 100));

  // Calculate positions for radar chart (polar coordinates)
  const centerX = 150;
  const centerY = 150;
  const radius = 120;

  // Warmth axis (horizontal, right side)
  const warmthX = centerX + (warmthPercent / 100) * radius;
  const warmthY = centerY;

  // Competence axis (vertical, top side)
  const competenceX = centerX;
  const competenceY = centerY - (competencePercent / 100) * radius;

  // Calculate quadrant
  const getQuadrant = () => {
    if (warmth >= 6 && competence >= 6) return 'admiration';
    if (warmth >= 6 && competence < 6) return 'pity';
    if (warmth < 6 && competence >= 6) return 'threat';
    return 'contempt';
  };

  const quadrant = getQuadrant();

  const getQuadrantColor = () => {
    switch (quadrant) {
      case 'admiration': return '#22c55e';
      case 'pity': return '#3b82f6';
      case 'threat': return '#f59e0b';
      case 'contempt': return '#ef4444';
      default: return '#64748B';
    }
  };

  return (
    <div className="radarChart">
      <svg width="300" height="300" viewBox="0 0 300 300" className="radarChartSvg">
        {/* Grid circles */}
        <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#E2E8F0" strokeWidth="1" />
        <circle cx={centerX} cy={centerY} r={radius * 0.75} fill="none" stroke="#E2E8F0" strokeWidth="1" />
        <circle cx={centerX} cy={centerY} r={radius * 0.5} fill="none" stroke="#E2E8F0" strokeWidth="1" />
        <circle cx={centerX} cy={centerY} r={radius * 0.25} fill="none" stroke="#E2E8F0" strokeWidth="1" />

        {/* Axes */}
        <line x1={centerX} y1={0} x2={centerX} y2={300} stroke="#E2E8F0" strokeWidth="1" />
        <line x1={0} y1={centerY} x2={300} y2={centerY} stroke="#E2E8F0" strokeWidth="1" />

        {/* Quadrant fill */}
        <path
          d={`M ${centerX} ${centerY} L ${warmthX} ${warmthY} L ${competenceX} ${competenceY} Z`}
          fill={getQuadrantColor()}
          fillOpacity="0.2"
        />

        {/* Warmth line */}
        <line
          x1={centerX}
          y1={centerY}
          x2={warmthX}
          y2={warmthY}
          stroke={getQuadrantColor()}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Competence line */}
        <line
          x1={centerX}
          y1={centerY}
          x2={competenceX}
          y2={competenceY}
          stroke={getQuadrantColor()}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Warmth point */}
        <circle
          cx={warmthX}
          cy={warmthY}
          r="6"
          fill={getQuadrantColor()}
          stroke="#FFFFFF"
          strokeWidth="2"
        />

        {/* Competence point */}
        <circle
          cx={competenceX}
          cy={competenceY}
          r="6"
          fill={getQuadrantColor()}
          stroke="#FFFFFF"
          strokeWidth="2"
        />

        {/* Labels */}
        <text x={centerX + radius + 10} y={centerY + 5} fill="#64748B" fontSize="12" fontWeight="600">
          Warmth
        </text>
        <text x={centerX - 50} y={20} fill="#64748B" fontSize="12" fontWeight="600">
          Competence
        </text>

        {/* Score labels */}
        <text
          x={warmthX}
          y={warmthY - 15}
          fill={getQuadrantColor()}
          fontSize="14"
          fontWeight="700"
          textAnchor="middle"
        >
          {warmth.toFixed(1)}
        </text>
        <text
          x={competenceX + 20}
          y={competenceY}
          fill={getQuadrantColor()}
          fontSize="14"
          fontWeight="700"
        >
          {competence.toFixed(1)}
        </text>
      </svg>

      <div className="radarChartLegend">
        <div className="radarChartLegendItem">
          <div className="radarChartLegendColor" style={{ backgroundColor: getQuadrantColor() }}></div>
          <span className="radarChartLegendLabel">
            {quadrant.charAt(0).toUpperCase() + quadrant.slice(1)} Quadrant
          </span>
        </div>
      </div>
    </div>
  );
}


