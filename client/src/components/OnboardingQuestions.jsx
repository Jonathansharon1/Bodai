import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Dumbbell, 
  Mic,
  Video,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  Calendar,
  Zap,
  Target
} from 'lucide-react';
import './OnboardingQuestions.css';

const ACTIVE_GOALS = ['content', 'leadership', 'confidence', 'presentation'];

const GOALS = [
  { id: 'content', label: 'Content Creator', icon: Video, description: 'Master talking to camera for videos, podcasts, and social content' },
  { id: 'leadership', label: 'Executive Presence', icon: Award, description: 'Command every room with clear intent and gravitas' },
  { id: 'confidence', label: 'Build Confidence', icon: Dumbbell, description: 'Raise your day-to-day confidence and personal presence' },
  { id: 'presentation', label: 'Presentation Skills', icon: Mic, description: 'Deliver talks with structure, energy, and confident Q&A' },
];

const CONFIDENCE_LEVELS = [
  { 
    id: 'very-high', 
    label: 'Very Confident', 
    icon: TrendingUp,
    description: 'I feel comfortable and self-assured',
    color: '#10B981'
  },
  { 
    id: 'high', 
    label: 'Confident', 
    icon: Smile,
    description: 'I generally feel good about myself',
    color: '#46B5D1'
  },
  { 
    id: 'medium', 
    label: 'Moderate', 
    icon: Meh,
    description: 'I have mixed feelings',
    color: '#FFC107'
  },
  { 
    id: 'low', 
    label: 'Not Very Confident', 
    icon: Frown,
    description: 'I often doubt myself',
    color: '#FF8C64'
  },
  { 
    id: 'very-low', 
    label: 'Building Up', 
    icon: AlertCircle,
    description: 'I struggle with confidence but want to grow',
    color: '#EF4444'
  },
];

const PRACTICE_FREQUENCY = [
  {
    id: 'casual',
    label: 'Casual',
    icon: Calendar,
    frequency: '1-2 times per month',
    description: 'Quick check-ins when I have time'
    },
  {
    id: 'regular',
    label: 'Regular',
    icon: Target,
    frequency: '1-2 times per week',
    description: 'Steady practice for consistent improvement'
  },
  {
    id: 'intensive',
    label: 'Intensive',
    icon: Zap,
    frequency: '3+ times per week',
    description: 'Focused training for faster results'
  }
];

export default function OnboardingQuestions({ onComplete }) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [confidence, setConfidence] = useState('');
  const [practiceFrequency, setPracticeFrequency] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredGoals = useMemo(() => GOALS.filter(g => ACTIVE_GOALS.includes(g.id)), []);

  const handleGoalSelect = (goalId) => {
    setGoal(goalId);
  };

  const handleContinue = () => {
    if (step === 1 && !goal) return;
    if (step === 2 && !confidence) return;
    if (step === 3 && !practiceFrequency) return;

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (step === 3) {
      if (submitting) return;
      setSubmitting(true);

      const answers = {
        primaryGoal: goal,
        confidenceLevel: confidence,
        practiceCommitment: practiceFrequency,
        commitmentLevel: practiceFrequency,
        // Set sensible defaults for removed fields
        difficultyBaseline: 'steady',
        coachArchetype: 'default',
        weeklyPromise: 'flexible',
        goalSpecificContext: {},
        journeyTemplateId: goal,
        templateId: goal
      };

      try {
        const maybePromise = onComplete(answers);
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.finally(() => setSubmitting(false));
        } else {
          setSubmitting(false);
        }
      } catch (error) {
        setSubmitting(false);
        throw error;
      }
    }
  };

  const isContinueDisabled =
    (step === 1 && !goal) ||
    (step === 2 && !confidence) ||
    (step === 3 && !practiceFrequency);

  const totalSteps = 3;
  const buttonLabel = step === 3 
    ? (submitting ? 'Getting started...' : 'Get Started') 
    : 'Continue';

  return (
    <div className="onboardingQuestions">
      {step === 1 && (
        <div className="onboardingQuestions__step">
          <label className="onboardingQuestions__label">
            What brings you here? <span className="required">*</span>
          </label>
          <div className="onboardingQuestions__options">
            {filteredGoals.map((goalOption) => {
              const IconComponent = goalOption.icon;
              return (
                <button
                  key={goalOption.id}
                  type="button"
                  className={`onboardingQuestions__option ${goal === goalOption.id ? 'active' : ''}`}
                  onClick={() => handleGoalSelect(goalOption.id)}
                >
                  <div className="onboardingQuestions__icon">
                    <IconComponent size={32} />
                  </div>
                  <div className="onboardingQuestions__optionContent">
                    <span className="onboardingQuestions__optionLabel">{goalOption.label}</span>
                    <span className="onboardingQuestions__optionDescription">{goalOption.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="onboardingQuestions__step">
          <label className="onboardingQuestions__label">
            How would you describe your current confidence level?
            <span className="required"> *</span>
          </label>
          <div className="onboardingQuestions__confidenceOptions">
            {CONFIDENCE_LEVELS.map((level) => {
              const IconComponent = level.icon;
              return (
                <button
                  key={level.id}
                  type="button"
                  className={`onboardingQuestions__confidenceOption ${confidence === level.id ? 'active' : ''}`}
                  onClick={() => setConfidence(level.id)}
                  style={confidence === level.id ? { '--confidence-color': level.color } : {}}
                >
                  <div className="onboardingQuestions__confidenceIcon">
                    <IconComponent size={24} />
                  </div>
                  <div className="onboardingQuestions__confidenceContent">
                    <span className="onboardingQuestions__confidenceLabel">{level.label}</span>
                    <span className="onboardingQuestions__confidenceDescription">{level.description}</span>
                  </div>
                  {confidence === level.id && (
                    <div className="onboardingQuestions__confidenceCheck">
                      <div className="onboardingQuestions__confidenceCheckmark"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="onboardingQuestions__step">
          <label className="onboardingQuestions__label">
            How often do you want to practice?
            <span className="required"> *</span>
          </label>
          <div className="onboardingQuestions__options">
            {PRACTICE_FREQUENCY.map((freq) => {
              const IconComponent = freq.icon;
              return (
                <button
                  key={freq.id}
                  type="button"
                  className={`onboardingQuestions__option ${practiceFrequency === freq.id ? 'active' : ''}`}
                  onClick={() => setPracticeFrequency(freq.id)}
                >
                  <div className="onboardingQuestions__icon">
                    <IconComponent size={32} />
                  </div>
                  <div className="onboardingQuestions__optionContent">
                    <span className="onboardingQuestions__optionLabel">{freq.label}</span>
                    <span className="onboardingQuestions__optionDescription">
                      <strong>{freq.frequency}</strong> — {freq.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="onboardingQuestions__actions">
        <span className="onboardingQuestions__progress">
          Step {step} of {totalSteps}
        </span>
        {step > 1 && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setStep(Math.max(1, step - 1))}
          >
            Back
          </button>
        )}
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleContinue}
          disabled={isContinueDisabled || submitting}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
