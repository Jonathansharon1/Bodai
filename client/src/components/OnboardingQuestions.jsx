import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Award, 
  Briefcase,
  Dumbbell, 
  Mic,
  Users,
  Video,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  Calendar,
  Zap,
  Target,
  CheckCircle2,
  PlayCircle,
  BarChart3
} from 'lucide-react';
import './OnboardingQuestions.css';

const ACTIVE_GOALS = ['content', 'leadership', 'confidence', 'presentation', 'interview', 'sales'];

export const GOAL_EXPLANATIONS = {
  // This export is kept for legacy/other component usage if needed, 
  // but the component below uses the translated version.
  // Ideally this would be refactored out entirely in favor of i18n keys.
};

export default function OnboardingQuestions({ onComplete }) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [confidence, setConfidence] = useState('');
  const [practiceFrequency, setPracticeFrequency] = useState('');
  const [includeEnvironmentFeedback, setIncludeEnvironmentFeedback] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  const GOALS = useMemo(() => [
    { 
      id: 'content', 
      label: t('onboarding.goal.content.label'), 
      icon: Video, 
      description: t('onboarding.goal.content.description') 
    },
    { 
      id: 'leadership', 
      label: t('onboarding.goal.leadership.label'), 
      icon: Award, 
      description: t('onboarding.goal.leadership.description') 
    },
    { 
      id: 'confidence', 
      label: t('onboarding.goal.confidence.label'), 
      icon: Dumbbell, 
      description: t('onboarding.goal.confidence.description') 
    },
    { 
      id: 'presentation', 
      label: t('onboarding.goal.presentation.label'), 
      icon: Mic, 
      description: t('onboarding.goal.presentation.description') 
    },
    { 
      id: 'interview', 
      label: t('onboarding.goal.interview.label'), 
      icon: Briefcase, 
      description: t('onboarding.goal.interview.description') 
    },
    { 
      id: 'sales', 
      label: t('onboarding.goal.sales.label'), 
      icon: Users, 
      description: t('onboarding.goal.sales.description') 
    },
  ], [t]);

  const CONFIDENCE_LEVELS = useMemo(() => [
    { 
      id: 'very-high', 
      label: t('onboarding.confidence.very-high.label'), 
      icon: TrendingUp,
      description: t('onboarding.confidence.very-high.description'),
      color: '#10B981'
    },
    { 
      id: 'high', 
      label: t('onboarding.confidence.high.label'), 
      icon: Smile,
      description: t('onboarding.confidence.high.description'),
      color: '#46B5D1'
    },
    { 
      id: 'medium', 
      label: t('onboarding.confidence.medium.label'), 
      icon: Meh,
      description: t('onboarding.confidence.medium.description'),
      color: '#FFC107'
    },
    { 
      id: 'low', 
      label: t('onboarding.confidence.low.label'), 
      icon: Frown,
      description: t('onboarding.confidence.low.description'),
      color: '#FF8C64'
    },
    { 
      id: 'very-low', 
      label: t('onboarding.confidence.very-low.label'), 
      icon: AlertCircle,
      description: t('onboarding.confidence.very-low.description'),
      color: '#EF4444'
    },
  ], [t]);

  const PRACTICE_FREQUENCY = useMemo(() => [
    {
      id: 'casual',
      label: t('onboarding.frequency.casual.label'),
      icon: Calendar,
      frequency: t('onboarding.frequency.casual.frequency'),
      description: t('onboarding.frequency.casual.description')
    },
    {
      id: 'regular',
      label: t('onboarding.frequency.regular.label'),
      icon: Target,
      frequency: t('onboarding.frequency.regular.frequency'),
      description: t('onboarding.frequency.regular.description')
    },
    {
      id: 'intensive',
      label: t('onboarding.frequency.intensive.label'),
      icon: Zap,
      frequency: t('onboarding.frequency.intensive.frequency'),
      description: t('onboarding.frequency.intensive.description')
    }
  ], [t]);

  const getGoalExplanation = (goalId) => {
    if (!goalId) return null;
    const bullets = t(`onboarding.goal.${goalId}.bullets`, { returnObjects: true });
    
    // Ensure bullets is an array (fallback if key missing or not array)
    const safeBullets = Array.isArray(bullets) ? bullets : [
      t('onboarding.questions.defaultBullet1'),
      t('onboarding.questions.defaultBullet2'),
      t('onboarding.questions.defaultBullet3')
    ];

    return {
      label: t(`onboarding.goal.${goalId}.label`),
      headline: t(`onboarding.goal.${goalId}.headline`),
      bullets: safeBullets,
      timeline: t(`onboarding.goal.${goalId}.timeline`)
    };
  };

  const filteredGoals = useMemo(() => GOALS.filter(g => ACTIVE_GOALS.includes(g.id)), [GOALS]);

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
      setStep(4);
      return;
    }

    if (step === 4) {
      if (submitting) return;
      setSubmitting(true);

      const answers = {
        primaryGoal: goal,
        confidenceLevel: confidence,
        practiceCommitment: practiceFrequency,
        commitmentLevel: practiceFrequency,
        includeEnvironmentFeedback: includeEnvironmentFeedback,
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

  const totalSteps = 4;
  const buttonLabel = step === 4 
    ? (submitting ? t('onboarding.questions.gettingStarted') : t('onboarding.questions.getStarted')) 
    : t('onboarding.questions.continue');

  const getStepContext = () => {
    switch(step) {
      case 1:
        return {
          explanation: t('onboarding.questions.step1ContextExplanation'),
          preview: goal
            ? t('onboarding.questions.step1ContextPreviewWithGoal', {
                goalLabel: GOALS.find(g => g.id === goal)?.label || t('onboarding.questions.defaultGoalLabel')
              })
            : t('onboarding.questions.step1ContextPreviewDefault')
        };
      case 2:
        return {
          explanation: t('onboarding.questions.step2ContextExplanation'),
          preview: confidence ? t('onboarding.questions.step2ContextPreview', {
            confidenceLabel: CONFIDENCE_LEVELS.find(c => c.id === confidence)?.label.toLowerCase() || t('onboarding.questions.defaultConfidenceLabel')
          }) : null
        };
      case 3:
        return {
          explanation: t('onboarding.questions.step3ContextExplanation'),
          preview: practiceFrequency ? t('onboarding.questions.step3ContextPreview', {
            frequencyLabel: PRACTICE_FREQUENCY.find(p => p.id === practiceFrequency)?.label.toLowerCase() || t('onboarding.questions.defaultFrequencyLabel')
          }) : null
        };
      case 4:
        return {
          explanation: t('onboarding.questions.step4ContextExplanation'),
          preview: null
        };
      default:
        return { explanation: "", preview: null };
    }
  };

  const stepContext = getStepContext();
  const selectedGoalExplanation = getGoalExplanation(goal);

  return (
    <div className="onboardingQuestions">
      {/* Progress Bar */}
      <div className="onboardingQuestions__progressBar">
        <div 
          className="onboardingQuestions__progressFill"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Context Explanation */}
      {stepContext.explanation && (
        <div className="onboardingQuestions__context">
          <p className="onboardingQuestions__contextText">{stepContext.explanation}</p>
          {stepContext.preview && (
            <p className="onboardingQuestions__preview">{stepContext.preview}</p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="onboardingQuestions__step">
          <label className="onboardingQuestions__label">
            {t('onboarding.questions.step1Label')} <span className="required">{t('onboarding.questions.step1Required')}</span>
          </label>
          <div className="onboardingQuestions__goalLayout">
            <div className="onboardingQuestions__goalList">
              <div className="onboardingQuestions__goalListHeader">
                <span className="onboardingQuestions__goalListTitle">
                  {t('onboarding.questions.chooseFocusTitle')}
                </span>
                <span className="onboardingQuestions__goalListHint">
                  {t('onboarding.questions.chooseFocusHint')}
                </span>
              </div>
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
                    <span className="onboardingQuestions__optionLabel">
                      {goalOption.label}
                    </span>
                    <span className="onboardingQuestions__optionDescription">
                      {goalOption.description}
                    </span>
                  </div>
                </button>
              );
            })}
              </div>
            </div>

            <div className="onboardingQuestions__goalDetails">
              <div className="onboardingQuestions__goalDetailsHeader">
                <span className="onboardingQuestions__goalDetailsBadge">
                  <PlayCircle size={14} />
                  <span>{t('onboarding.questions.learnByDoingBadge')}</span>
                </span>
                <h3 className="onboardingQuestions__goalDetailsTitle">
                  {selectedGoalExplanation
                    ? t('onboarding.questions.goalDetailsTitleWithLabel', { label: selectedGoalExplanation.label })
                    : t('onboarding.questions.goalDetailsDefaultTitle')}
                </h3>
                <p className="onboardingQuestions__goalDetailsSubtitle">
                  {selectedGoalExplanation
                    ? selectedGoalExplanation.headline
                    : t('onboarding.questions.goalDetailsDefaultSubtitle')}
                </p>
              </div>

              <ul className="onboardingQuestions__goalDetailsList">
                {(selectedGoalExplanation?.bullets || [
                  t('onboarding.questions.defaultBullet1'),
                  t('onboarding.questions.defaultBullet2'),
                  t('onboarding.questions.defaultBullet3')
                ]).map((item, index) => (
                  <li key={index} className="onboardingQuestions__goalDetailsItem">
                    <span className="onboardingQuestions__goalDetailsIcon">
                      {index === 0 && <CheckCircle2 size={16} />}
                      {index === 1 && <PlayCircle size={16} />}
                      {index === 2 && <BarChart3 size={16} />}
                      {index > 2 && <CheckCircle2 size={16} />}
                    </span>
                    <span className="onboardingQuestions__goalDetailsText">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="onboardingQuestions__goalDetailsFooter">
                <span className="onboardingQuestions__goalDetailsTimeline">
                  {selectedGoalExplanation?.timeline ||
                    t('onboarding.questions.goalDetailsTimelineFallback')}
                </span>
                <span className="onboardingQuestions__goalDetailsNote">
                  {t('onboarding.questions.goalDetailsNote')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="onboardingQuestions__step">
          <label className="onboardingQuestions__label">
            {t('onboarding.questions.step2Label')}
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
                    <span className="onboardingQuestions__confidenceLabel">
                      {level.label}
                    </span>
                    <span className="onboardingQuestions__confidenceDescription">
                      {level.description}
                    </span>
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
            {t('onboarding.questions.step3Label')}
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
                    <span className="onboardingQuestions__optionLabel">
                      {freq.label}
                    </span>
                    <span className="onboardingQuestions__optionDescription">
                      <strong>{freq.frequency}</strong> —{' '}
                      {freq.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="onboardingQuestions__step">
          <label className="onboardingQuestions__label">
            {t('onboarding.questions.step4Title')}
          </label>
          <p className="onboardingQuestions__description">
            {t('onboarding.questions.step4Description')}
          </p>
          <div className="onboardingQuestions__options">
            <button
              type="button"
              className={`onboardingQuestions__option ${includeEnvironmentFeedback === true ? 'active' : ''}`}
              onClick={() => setIncludeEnvironmentFeedback(true)}
            >
              <div className="onboardingQuestions__icon">
                <Video size={32} />
              </div>
              <div className="onboardingQuestions__optionContent">
                <span className="onboardingQuestions__optionLabel">
                  {t('onboarding.questions.environmentFeedbackOption1')}
                </span>
                <span className="onboardingQuestions__optionDescription">
                  {t('onboarding.questions.environmentFeedbackOption1Desc')}
                </span>
              </div>
            </button>
            <button
              type="button"
              className={`onboardingQuestions__option ${includeEnvironmentFeedback === false ? 'active' : ''}`}
              onClick={() => setIncludeEnvironmentFeedback(false)}
            >
              <div className="onboardingQuestions__icon">
                <Target size={32} />
              </div>
              <div className="onboardingQuestions__optionContent">
                <span className="onboardingQuestions__optionLabel">
                  {t('onboarding.questions.environmentFeedbackOption2')}
                </span>
                <span className="onboardingQuestions__optionDescription">
                  {t('onboarding.questions.environmentFeedbackOption2Desc')}
                </span>
              </div>
            </button>
          </div>
          <p className="onboardingQuestions__note">
            {t('onboarding.questions.environmentFeedbackNote')}
          </p>
        </div>
      )}

      <div className="onboardingQuestions__actions">
        <span className="onboardingQuestions__progress">
          {t('onboarding.questions.stepsProgress', { step, total: totalSteps })}
        </span>
        {step > 1 && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setStep(Math.max(1, step - 1))}
          >
            {t('onboarding.questions.back')}
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
