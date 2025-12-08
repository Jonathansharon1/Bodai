import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingUp, Award, Target } from 'lucide-react';
import './ScoreCardHero.css';

export default function ScoreCardHero({ score, stageTitle, isFirstAnalysis, comparison }) {
  const { t } = useTranslation();
  const getScoreMessage = (score) => {
    if (score >= 85) return { text: "Outstanding!", emoji: "🌟", color: "#10b981" };
    if (score >= 70) return { text: "Great Job!", emoji: "🎉", color: "#3b82f6" };
    if (score >= 55) return { text: "Good Progress!", emoji: "👍", color: "#f59e0b" };
    if (score >= 40) return { text: "Keep Going!", emoji: "💪", color: "#f59e0b" };
    return { text: "You've Got This!", emoji: "🚀", color: "#ef4444" };
  };

  const getEncouragementMessage = (score) => {
    if (score >= 85) return "You're a master communicator!";
    if (score >= 70) return "You're on the right track!";
    if (score >= 55) return "You're making great progress!";
    if (score >= 40) return "Every expert was once a beginner. Keep practicing!";
    return "Every journey starts with a single step. You've got this!";
  };

  const scoreMessage = getScoreMessage(score);
  const encouragement = getEncouragementMessage(score);
  const percentage = Math.round(score);

  return (
    <div className="scoreCardHero">
      <div className="scoreCardHero__container">
        {/* Celebration Header */}
        <div className="scoreCardHero__header">
          <div className="scoreCardHero__emoji">{scoreMessage.emoji}</div>
          <h2 className="scoreCardHero__message" style={{ color: scoreMessage.color }}>
            {scoreMessage.text}
          </h2>
        </div>

        {/* Main Score */}
        <div className="scoreCardHero__score">
          <div className="scoreCardHero__scoreValue">{score}</div>
          <div className="scoreCardHero__scoreMax">/ 100</div>
        </div>

        {/* Stage Title */}
        {stageTitle && (
          <div className="scoreCardHero__stage">
            <Award size={20} />
            <span>{stageTitle}</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="scoreCardHero__progress">
          <div className="scoreCardHero__progressTrack">
            <div 
              className="scoreCardHero__progressFill"
              style={{ 
                width: `${percentage}%`,
                backgroundColor: scoreMessage.color
              }}
            />
          </div>
          <div className="scoreCardHero__progressLabel">{percentage}%</div>
        </div>

        {/* Comparison or First Analysis Message */}
        {isFirstAnalysis ? (
          <div className="scoreCardHero__comparison scoreCardHero__comparison--first">
            <Sparkles size={18} />
            <span>This is your first analysis! Track your progress from here.</span>
          </div>
        ) : comparison && (
          <div className={`scoreCardHero__comparison scoreCardHero__comparison--${comparison.type}`}>
            {React.createElement(comparison.icon, { size: 18 })}
            <span>
              {comparison.type === 'improved' && `+${comparison.diff} ${t('dashboard.pointsFromLastSession')}`}
              {comparison.type === 'declined' && `${comparison.diff} ${t('dashboard.pointsLowerThanLastSession')}`}
              {comparison.type === 'stable' && t('analysisResult.sameAsLastTime')}
            </span>
          </div>
        )}

        {/* Encouragement Message */}
        <div className="scoreCardHero__encouragement">
          <p>{encouragement}</p>
        </div>
      </div>
    </div>
  );
}

