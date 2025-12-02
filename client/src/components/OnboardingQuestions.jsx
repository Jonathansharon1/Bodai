import React, { useState, useMemo } from 'react';
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

const GOALS = [
  { 
    id: 'content', 
    label: 'Content Creator', 
    icon: Video, 
    description: 'Master talking to camera for videos, podcasts, and social content.' 
  },
  { 
    id: 'leadership', 
    label: 'Executive Presence', 
    icon: Award, 
    description: 'Command every room with clear intent and gravitas.' 
  },
  { 
    id: 'confidence', 
    label: 'Build Confidence', 
    icon: Dumbbell, 
    description: 'Raise your day-to-day confidence and personal presence.' 
  },
  { 
    id: 'presentation', 
    label: 'Presentation Skills', 
    icon: Mic, 
    description: 'Deliver talks with structure, energy, and confident Q&A.' 
  },
  { 
    id: 'interview', 
    label: 'Job Interviews', 
    icon: Briefcase, 
    description: 'Practice interviews so you show up calm, clear, and ready for tough questions.' 
  },
  { 
    id: 'sales', 
    label: 'Face-to-face Sales', 
    icon: Users, 
    description: 'Improve live sales conversations, discovery, and closing moments.' 
  },
];

export const GOAL_EXPLANATIONS = {
  confidence: {
    label: 'Build Confidence',
    headline: "We turn vague 'be more confident' into concrete, trainable skills.",
    bullets: [
      'Record short reps where we score tension, vocal stability, and filler words on every video.',
      'Follow 60–120 second practice missions that each train one behavior at a time.',
      'Compare before/after sessions so you can see your confidence trend objectively improving.'
    ],
    timeline: 'Most people feel more in control after 3–5 focused sessions.'
  },
  interview: {
    label: 'Job Interviews',
    headline: 'We help you show up prepared, calm, and clear in interviews by rehearsing the real thing.',
    bullets: [
      'Practice with realistic prompts — from behavioral questions to role-specific scenarios.',
      'Get feedback on clarity, structure, and first impression for each recorded answer.',
      'Turn weak spots into specific action items you can fix before the real interview.'
    ],
    timeline: 'Use BodAI daily the week before your interview to build muscle-memory answers.'
  },
  presentation: {
    label: 'Presentation Skills',
    headline: 'We strengthen your presence and clarity for talks and demos through repeated run-throughs.',
    bullets: [
      'Record multiple takes and analyze structure, pacing, and energy for each one.',
      'Run targeted drills on key moments like your opening, transitions, and call-to-action.',
      'Watch your presence and impact scores improve as you rehearse, not just imagine.'
    ],
    timeline: 'Aim for 2–3 practice runs per important presentation.'
  },
  sales: {
    label: 'Face-to-face Sales',
    headline: 'We help you look and sound more trustworthy and persuasive in live conversations.',
    bullets: [
      'Role-play discovery, pitching, and objection-handling calls on camera.',
      'Get analysis on warmth vs authority, eye contact, and listening cues from each rep.',
      'Turn key moves — like asking for the close — into repeatable habits instead of guesswork.'
    ],
    timeline: 'Practice 1–2 calls per week and track how your conversations improve across deals.'
  },
  content: {
    label: 'Content Creator',
    headline: 'We help you get comfortable talking to camera by making reps feel like episodes, not homework.',
    bullets: [
      'Record short, themed clips that mirror the content you want to publish.',
      'Get feedback on energy, clarity, and hooks so each take improves the next.',
      'Build a library of practiced intros and explanations you can reuse on camera.'
    ],
    timeline: 'Most creators feel a big shift after a week of quick daily reps.'
  },
  leadership: {
    label: 'Executive Presence',
    headline: 'We help you practice high-stakes moments so your presence feels steady, not improvised.',
    bullets: [
      'Rehearse tough updates, 1:1s, and all-hands moments on camera.',
      'Get feedback on clarity, calm, and authority so your message lands under pressure.',
      'Turn your natural style into a repeatable presence you can rely on in any room.'
    ],
    timeline: 'Leaders usually notice clearer, calmer delivery after a few focused sessions.'
  }
};

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

  const getStepContext = () => {
    switch(step) {
      case 1:
        return {
          explanation: "This helps us personalize your experience and tailor feedback to your specific goals.",
          preview: goal
            ? `You'll get a hands-on practice path for ${GOALS.find(g => g.id === goal)?.label || 'your goal'} — with short missions and clear feedback.`
            : "You'll pick a goal and immediately see how BodAI will train you with short, focused practice missions."
        };
      case 2:
        return {
          explanation: "Understanding your confidence level helps us adjust our feedback style and recommendations.",
          preview: confidence ? `We'll adapt our coaching to match your ${CONFIDENCE_LEVELS.find(c => c.id === confidence)?.label.toLowerCase() || 'confidence'} level` : null
        };
      case 3:
        return {
          explanation: "This helps us suggest the right practice schedule and set realistic expectations.",
          preview: practiceFrequency ? `We'll recommend a practice plan that fits your ${PRACTICE_FREQUENCY.find(p => p.id === practiceFrequency)?.label.toLowerCase() || 'schedule'} schedule` : null
        };
      default:
        return { explanation: "", preview: null };
    }
  };

  const stepContext = getStepContext();

  const selectedGoalExplanation = goal
    ? GOAL_EXPLANATIONS[goal]
    : null;

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
            What brings you here? <span className="required">*</span>
          </label>
          <div className="onboardingQuestions__goalLayout">
            <div className="onboardingQuestions__goalList">
              <div className="onboardingQuestions__goalListHeader">
                <span className="onboardingQuestions__goalListTitle">
                  Choose your main focus
                </span>
                <span className="onboardingQuestions__goalListHint">
                  You’ll learn by doing: short missions, real recordings, clear feedback.
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
                    <span className="onboardingQuestions__optionLabel">{goalOption.label}</span>
                    <span className="onboardingQuestions__optionDescription">{goalOption.description}</span>
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
                  <span>Learn by doing</span>
                </span>
                <h3 className="onboardingQuestions__goalDetailsTitle">
                  {selectedGoalExplanation
                    ? `How BodAI will help with ${selectedGoalExplanation.label}`
                    : 'See how BodAI will train you'}
                </h3>
                <p className="onboardingQuestions__goalDetailsSubtitle">
                  {selectedGoalExplanation
                    ? selectedGoalExplanation.headline
                    : 'Pick a goal on the left to preview the short missions, feedback loops, and reps you’ll run inside BodAI.'}
                </p>
              </div>

              <ul className="onboardingQuestions__goalDetailsList">
                {(selectedGoalExplanation?.bullets || [
                  'Record a short practice video instead of filling out long forms.',
                  'Get instant, visual feedback on how you’re doing — not vague advice.',
                  'Turn each session into a small win that stacks over time.'
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
                    'Most people feel a noticeable shift after just a few short practice sessions.'}
                </span>
                <span className="onboardingQuestions__goalDetailsNote">
                  You’ll see these steps echoed in your dashboard and practice missions so it never feels abstract.
                </span>
              </div>
            </div>
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
