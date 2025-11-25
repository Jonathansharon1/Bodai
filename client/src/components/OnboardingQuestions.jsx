import React, { useMemo, useState } from 'react';
import { 
  Briefcase, 
  Award, 
  Dumbbell, 
  Mic,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  Zap,
  Clock3,
  Target,
  CalendarCheck2,
  Users,
  Heart,
  MessageCircle,
  Globe,
  Star,
  Shield,
  Sparkles
} from 'lucide-react';
import JourneyPreviewCard from './onboarding/JourneyPreviewCard';

const ACTIVE_GOALS = ['interview', 'leadership', 'confidence', 'presentation'];

const GOALS = [
  { id: 'interview', label: 'Interview Fast-Track', icon: Briefcase, description: 'Land the role with confident answers and body language' },
  { id: 'leadership', label: 'Executive Presence', icon: Award, description: 'Command every room with clear intent and gravitas' },
  { id: 'confidence', label: 'Confidence Accelerator', icon: Dumbbell, description: 'Raise your day-to-day confidence and personal presence' },
  { id: 'presentation', label: 'Presentation Mastery', icon: Mic, description: 'Deliver talks with structure, energy, and confident Q&A' },
];

const OPTION_ICON_MAP = {
  confidence: {
    question1: {
      work: { icon: Briefcase, color: '#2563eb' },
      social: { icon: Users, color: '#f97316' },
      dating: { icon: Heart, color: '#ec4899' },
      speaking: { icon: Mic, color: '#8b5cf6' },
      'new-people': { icon: MessageCircle, color: '#10b981' },
      general: { icon: Globe, color: '#0ea5e9' },
    },
    question2: {
      comfort: { icon: Smile, color: '#22c55e' },
      impression: { icon: Star, color: '#fcd34d' },
      'overcome-fear': { icon: Shield, color: '#f87171' },
      'self-assurance': { icon: TrendingUp, color: '#38bdf8' },
    }
  },
  presentation: {
    question1: {
      'small-team': { icon: Users, color: '#0ea5e9' },
      'large-conference': { icon: Mic, color: '#a855f7' },
      online: { icon: MessageCircle, color: '#14b8a6' },
      mixed: { icon: Globe, color: '#f97316' },
    },
    question2: {
      'stage-fright': { icon: Heart, color: '#f87171' },
      engaging: { icon: Sparkles, color: '#facc15' },
      qa: { icon: Target, color: '#22d3ee' },
      structure: { icon: Briefcase, color: '#94a3b8' },
    }
  }
};

const getOptionIcon = (goalId, questionKey, optionId) => {
  return OPTION_ICON_MAP[goalId]?.[questionKey]?.[optionId] || null;
};

const CONFIDENCE_LEVELS = [
  { 
    id: 'very-high', 
    label: 'Very Confident', 
    icon: TrendingUp,
    description: 'I feel comfortable and self-assured',
    color: '#10B981' // Green
  },
  { 
    id: 'high', 
    label: 'Confident', 
    icon: Smile,
    description: 'I generally feel good about myself',
    color: '#46B5D1' // Teal
  },
  { 
    id: 'medium', 
    label: 'Moderate', 
    icon: Meh,
    description: 'I have mixed feelings',
    color: '#FFC107' // Amber
  },
  { 
    id: 'low', 
    label: 'Not Very Confident', 
    icon: Frown,
    description: 'I often doubt myself',
    color: '#FF8C64' // Orange
  },
  { 
    id: 'very-low', 
    label: 'Very Insecure', 
    icon: AlertCircle,
    description: 'I struggle with confidence',
    color: '#EF4444' // Red
  },
];

const JOURNEY_TEMPLATES = {
  interview: {
    id: 'interview-fast-track',
    title: 'Interview Fast-Track',
    tagline: 'Answer with clarity, posture and executive confidence.',
    durationLabel: '4-week sprint',
    focusPhrase: 'Each drill targets confidence under pressure, structured storytelling and clear vocal delivery.',
    kpis: ['Confidence', 'Clarity', 'Presence'],
    cadence: '2 guided drills / week',
    milestones: [
      { label: 'Week 1', detail: 'Baseline recording + clarity primer' },
      { label: 'Week 2', detail: 'Body language and filler reduction' },
      { label: 'Week 3', detail: 'Panel-style challenges' },
      { label: 'Week 4', detail: 'Mock final interview' }
    ],
    baselineCopy: {
      starter: 'We’ll reinforce foundational posture cues + reduce filler words.',
      steady: 'We’ll stress-test high-signal questions & refine closing stories.',
      trailblazer: 'We’ll simulate exec panels with harder timing and cross-questions.'
    },
    commitmentCopy: {
      light: '1 deep practice per week (15 min).',
      standard: '2 drills/week + async feedback nudges.',
      intense: '3+ drills/week + optional stretch prompts.'
    }
  },
  leadership: {
    id: 'executive-presence',
    title: 'Executive Presence Lab',
    tagline: 'Project authority, warmth and clarity in every leadership moment.',
    durationLabel: '6-week progression',
    focusPhrase: 'We rotate between high-stakes updates, tough conversations and stakeholder Q&A.',
    kpis: ['Presence', 'Authenticity', 'Voice'],
    cadence: '1 leadership scenario / week',
    milestones: [
      { label: 'Week 1', detail: 'Presence baseline + goals' },
      { label: 'Week 2', detail: 'Commanding openings' },
      { label: 'Week 3', detail: 'Influence & storytelling' },
      { label: 'Week 4', detail: 'Handling conflict' },
      { label: 'Week 5', detail: 'Executive Q&A gym' },
      { label: 'Week 6', detail: 'Summit demo + plan' }
    ],
    baselineCopy: {
      starter: 'We’ll cement eye contact, posture, and intentional pauses.',
      steady: 'We’ll refine framing, structure, and key leadership stories.',
      trailblazer: 'We’ll stress-test you with stretch board updates and investor-style scrutiny.'
    },
    commitmentCopy: {
      light: 'Weekly scenario with guided cues.',
      standard: 'Weekly scenario + mid-week quick drill.',
      intense: 'Twice-weekly scenario swaps + coach challenges.'
    }
  },
  confidence: {
    id: 'confidence-accelerator',
    title: 'Confidence Accelerator',
    tagline: 'Rebuild your internal hype loop with short, repeatable wins.',
    durationLabel: '3-week reset',
    focusPhrase: 'We combine micro-practices, positive feedback loops and reflection prompts.',
    kpis: ['Confidence', 'Authenticity', 'Voice'],
    cadence: 'Daily 5-min reps',
    milestones: [
      { label: 'Week 1', detail: 'Baseline + social warmups' },
      { label: 'Week 2', detail: 'Storytelling + body activation' },
      { label: 'Week 3', detail: 'Stretch conversations + recap' }
    ],
    baselineCopy: {
      starter: 'We’ll build comfort speaking on camera + celebrate micro wins.',
      steady: 'We’ll experiment with tone range, gestures, and authentic energy.',
      trailblazer: 'We’ll push into playful challenges + real-life scenario practice.'
    },
    commitmentCopy: {
      light: 'Quick check-ins 3x per week.',
      standard: 'Daily 5-minute drills.',
      intense: 'Daily drills + optional social challenges.'
    }
  },
  presentation: {
    id: 'presentation-mastery',
    title: 'Presentation Mastery Lab',
    tagline: 'Design and deliver talks that land every single time.',
    durationLabel: '4-week arc',
    focusPhrase: 'We cycle through story design, vocal energy, gesture mapping, and fearless Q&A.',
    kpis: ['Clarity', 'Impact', 'Confidence'],
    cadence: '2 talk reps / week',
    milestones: [
      { label: 'Week 1', detail: 'Message spine + story hook' },
      { label: 'Week 2', detail: 'Gesture + visual anchors' },
      { label: 'Week 3', detail: 'Slide sync + pacing' },
      { label: 'Week 4', detail: 'Q&A gauntlet + polish run' }
    ],
    baselineCopy: {
      starter: 'We’ll lock a clean outline and get comfortable speaking to camera.',
      steady: 'We’ll dial in energy, visuals, and vocal variety for tougher rooms.',
      trailblazer: 'We’ll simulate exec briefings with hot-seat Q&A and timed stretch drills.'
    },
    commitmentCopy: {
      light: 'Weekly rehearsal run + async notes.',
      standard: 'Two runs/week with targeted feedback.',
      intense: 'Three runs/week plus live Q&A prompts.'
    }
  }
};

const BASELINE_LEVELS = [
  {
    id: 'starter',
    label: 'Just getting started',
    description: 'I’m new to video practice or returning after a break.'
  },
  {
    id: 'steady',
    label: 'Comfortable but inconsistent',
    description: 'I can hold my own but want sharper delivery.'
  },
  {
    id: 'trailblazer',
    label: 'Ready for stretch drills',
    description: 'I want the toughest prompts and feedback.'
  }
];

const COMMITMENT_LEVELS = [
  {
    id: 'light',
    label: 'Light rhythm',
    cadence: '1 session/week',
    description: '15 focused minutes to keep momentum'
  },
  {
    id: 'standard',
    label: 'Pro cadence',
    cadence: '2 sessions/week',
    description: 'Recommended for steady compounding'
  },
  {
    id: 'intense',
    label: 'Accelerator',
    cadence: '3 sessions/week',
    description: 'You want fast gains and accountability'
  }
];

const COACH_ARCHETYPES = [
  {
    id: 'strategist',
    label: 'Strategist',
    description: 'You thrive with tight frameworks and clear scoring.'
  },
  {
    id: 'storyteller',
    label: 'Storyteller',
    description: 'You want prompts that unlock emotion and narrative.'
  },
  {
    id: 'closer',
    label: 'Closer',
    description: 'You crave high-pressure reps to stay sharp.'
  }
];

const WEEKLY_PROMISES = [
  {
    id: 'one-rep',
    label: '1 filmed rep / week',
    description: 'Minimum cadence—keeps the muscles awake.'
  },
  {
    id: 'two-reps',
    label: '2 filmed reps / week',
    description: 'Recommended pace for steady compounding.'
  },
  {
    id: 'three-reps',
    label: '3 filmed reps / week',
    description: 'Sprint mode with accountability nudges.'
  }
];

const CONSENT_VERSION = '2025-01';
const CONSENT_POINTS = [
  'Your uploads are analyzed only for coaching feedback.',
  'You can delete analyses anytime from Dashboard > History.',
  'We never share raw videos without your explicit permission.'
];

// Goal-specific questions configuration
const GOAL_SPECIFIC_QUESTIONS = {
  'confidence': {
    question1: {
      label: 'What situations challenge you most?',
      options: [
        { id: 'work', label: 'Work/Professional situations' },
        { id: 'social', label: 'Social gatherings' },
        { id: 'dating', label: 'Dating/Romantic situations' },
        { id: 'speaking', label: 'Public speaking' },
        { id: 'new-people', label: 'Meeting new people' },
        { id: 'general', label: 'General daily interactions' },
      ]
    },
    question2: {
      label: 'What would success look like for you?',
      options: [
        { id: 'comfort', label: 'Feel more comfortable in challenging situations' },
        { id: 'impression', label: 'Make a better first impression' },
        { id: 'overcome-fear', label: 'Overcome specific fears or anxieties' },
        { id: 'self-assurance', label: 'Feel more self-assured overall' },
      ]
    }
  },
  'interview': {
    question1: {
      label: 'What type of interviews are you preparing for?',
      options: [
        { id: 'technical', label: 'Technical interviews' },
        { id: 'behavioral', label: 'Behavioral interviews' },
        { id: 'panel', label: 'Panel interviews' },
        { id: 'phone-video', label: 'Phone/Video interviews' },
        { id: 'all-types', label: 'All types' },
      ]
    },
    question2: {
      label: 'What\'s your biggest concern?',
      options: [
        { id: 'nervousness', label: 'Nervousness/Anxiety' },
        { id: 'answering', label: 'Answering questions clearly' },
        { id: 'body-language', label: 'Body language/First impression' },
        { id: 'technical-skills', label: 'Technical skills presentation' },
        { id: 'all-concerns', label: 'All of the above' },
      ]
    }
  },
  'presentation': {
    question1: {
      label: 'What\'s your typical audience?',
      options: [
        { id: 'small-team', label: 'Small team (5-10 people)' },
        { id: 'large-conference', label: 'Large conference (50+ people)' },
        { id: 'online', label: 'Online/Virtual presentations' },
        { id: 'mixed', label: 'Mixed audience sizes' },
      ]
    },
    question2: {
      label: 'What challenges you most?',
      options: [
        { id: 'stage-fright', label: 'Stage fright/Nervousness' },
        { id: 'engaging', label: 'Engaging the audience' },
        { id: 'qa', label: 'Handling Q&A sessions' },
        { id: 'structure', label: 'Structuring and delivering content' },
      ]
    }
  },
  'communication': {
    question1: {
      label: 'What communication situations are most important?',
      options: [
        { id: 'one-on-one', label: 'One-on-one conversations' },
        { id: 'team-meetings', label: 'Team meetings' },
        { id: 'difficult-conversations', label: 'Difficult conversations' },
        { id: 'networking', label: 'Networking events' },
        { id: 'all-situations', label: 'All communication situations' },
      ]
    },
    question2: {
      label: 'What would help you communicate better?',
      options: [
        { id: 'listening', label: 'Better listening skills' },
        { id: 'expressing', label: 'Expressing ideas clearly' },
        { id: 'non-verbal', label: 'Using non-verbal cues effectively' },
        { id: 'confidence', label: 'Feeling more confident while speaking' },
      ]
    }
  },
  'leadership': {
    question1: {
      label: 'What leadership situations do you face?',
      options: [
        { id: 'team-lead', label: 'Leading a team' },
        { id: 'meetings', label: 'Leading meetings' },
        { id: 'presentations', label: 'Presenting to stakeholders' },
        { id: 'conflict', label: 'Managing conflict' },
        { id: 'all-leadership', label: 'All leadership situations' },
      ]
    },
    question2: {
      label: 'What leadership challenges do you want to overcome?',
      options: [
        { id: 'authority', label: 'Commanding authority and respect' },
        { id: 'influence', label: 'Influencing and persuading' },
        { id: 'presence', label: 'Building executive presence' },
        { id: 'confidence', label: 'Feeling more confident as a leader' },
      ]
    }
  },
  'dating': {
    question1: {
      label: 'What dating situations are most important?',
      options: [
        { id: 'first-dates', label: 'First dates' },
        { id: 'online-dating', label: 'Online dating (video calls)' },
        { id: 'meeting-family', label: 'Meeting parents/family' },
        { id: 'long-term', label: 'Long-term relationships' },
        { id: 'all-dating', label: 'All dating situations' },
      ]
    },
    question2: {
      label: 'What would help you feel more confident?',
      options: [
        { id: 'first-impression', label: 'Making a good first impression' },
        { id: 'relaxed', label: 'Being more relaxed and natural' },
        { id: 'showing-interest', label: 'Showing interest effectively' },
        { id: 'reading-cues', label: 'Reading body language cues' },
      ]
    }
  },
  'social': {
    question1: {
      label: 'What social situations challenge you most?',
      options: [
        { id: 'parties', label: 'Parties and social gatherings' },
        { id: 'networking', label: 'Networking events' },
        { id: 'small-groups', label: 'Small group conversations' },
        { id: 'new-people', label: 'Meeting new people' },
        { id: 'all-social', label: 'All social situations' },
      ]
    },
    question2: {
      label: 'What would make social interactions easier?',
      options: [
        { id: 'comfort', label: 'Feeling more comfortable' },
        { id: 'starting-conversations', label: 'Starting conversations' },
        { id: 'maintaining', label: 'Maintaining engaging conversations' },
        { id: 'body-language', label: 'Using positive body language' },
      ]
    }
  },
};

export default function OnboardingQuestions({ onComplete }) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [confidence, setConfidence] = useState('');
  const [goalSpecificAnswer1, setGoalSpecificAnswer1] = useState('');
  const [goalSpecificAnswer2, setGoalSpecificAnswer2] = useState('');
  const [difficultyBaseline, setDifficultyBaseline] = useState('');
  const [practiceCommitment, setPracticeCommitment] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);
  const [coachArchetype, setCoachArchetype] = useState('');
  const [weeklyPromise, setWeeklyPromise] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [goalConsents, setGoalConsents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bodai_goal_consents')) || {};
    } catch (err) {
      return {};
    }
  });

  const filteredGoals = useMemo(() => GOALS.filter(goalOption => ACTIVE_GOALS.includes(goalOption.id)), []);
  const selectedTemplate = useMemo(() => JOURNEY_TEMPLATES[goal] || null, [goal]);
  const selectedArchetype = useMemo(() => COACH_ARCHETYPES.find(option => option.id === coachArchetype) || null, [coachArchetype]);
  const selectedPromise = useMemo(() => WEEKLY_PROMISES.find(option => option.id === weeklyPromise) || null, [weeklyPromise]);
  const hasSecondQuestion = goal ? Boolean(GOAL_SPECIFIC_QUESTIONS[goal]?.question2) : false;
  const customizationStep = hasSecondQuestion ? 5 : 4;
  const isCustomizationStep = goal && step === customizationStep;
  const existingGoalConsent = goal ? goalConsents[goal] : null;
  const consentRequired = !existingGoalConsent;
  const consentAcceptedDate = existingGoalConsent?.acceptedAt
    ? new Date(existingGoalConsent.acceptedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const handleGoalSelect = (goalId) => {
    const hasConsent = Boolean(goalConsents[goalId]);
    setGoal(goalId);
    setGoalSpecificAnswer1('');
    setGoalSpecificAnswer2('');
    setDifficultyBaseline('');
    setPracticeCommitment('');
    setConsentAccepted(hasConsent);
    setConsentTouched(false);
    setCoachArchetype('');
    setWeeklyPromise('');
    setSubmitting(false);
  };

  const renderGoalSpecificOptions = (questionKey, selectedValue, onSelect) => {
    const questionConfig = GOAL_SPECIFIC_QUESTIONS[goal]?.[questionKey];
    if (!questionConfig) return null;

    return questionConfig.options.map((option) => {
      const isActive = selectedValue === option.id;
      const iconConfig = getOptionIcon(goal, questionKey, option.id);
      const IconComponent = iconConfig?.icon;
      return (
        <button
          key={option.id}
          type="button"
          className={`onboardingQuestions__option ${isActive ? 'active' : ''}`}
          onClick={() => onSelect(option.id)}
        >
          <div className="onboardingQuestions__optionBody">
            {IconComponent && (
              <div
                className="onboardingQuestions__icon onboardingQuestions__icon--compact"
                style={{
                  backgroundColor: `${iconConfig.color}1f`,
                  color: iconConfig.color
                }}
              >
                <IconComponent size={18} />
              </div>
            )}
            <div className="onboardingQuestions__optionContent">
              <span className="onboardingQuestions__optionLabel">{option.label}</span>
            </div>
          </div>
        </button>
      );
    });
  };


  const saveGoalConsent = (goalId, consentData) => {
    setGoalConsents((prev) => {
      const next = { ...prev, [goalId]: consentData };
      localStorage.setItem('bodai_goal_consents', JSON.stringify(next));
      return next;
    });
  };

  const handleContinue = () => {
    if (step === 1 && !goal) return;
    if (step === 2 && !confidence) return;
    if (step === 3 && !goalSpecificAnswer1) return;
    if (hasSecondQuestion && step === 4 && !goalSpecificAnswer2) return;
    if (
      isCustomizationStep &&
      (
        !difficultyBaseline ||
        !practiceCommitment ||
        !coachArchetype ||
        !weeklyPromise ||
        (consentRequired && !consentAccepted)
      )
    ) return;

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (step === 3) {
      setStep(hasSecondQuestion ? 4 : customizationStep);
      return;
    }

    if (hasSecondQuestion && step === 4) {
      setStep(5);
      return;
    }

    if (isCustomizationStep) {
      if (submitting) {
        return;
      }
      setSubmitting(true);
      const activeConsent = goal ? goalConsents[goal] : null;
      const consentNeeded = !activeConsent;
      const newConsentPayload = consentNeeded
        ? {
            goal,
            accepted: true,
            version: CONSENT_VERSION,
            acceptedAt: new Date().toISOString()
          }
        : activeConsent || null;

      const goalSpecificContext = {
        question1: goalSpecificAnswer1
      };
      if (hasSecondQuestion) {
        goalSpecificContext.question2 = goalSpecificAnswer2;
      }

      const answers = {
        primaryGoal: goal,
        confidenceLevel: confidence,
        goalSpecificContext,
        journeyTemplateId: selectedTemplate?.id || null,
        templateId: selectedTemplate?.id || null,
        difficultyBaseline,
        practiceCommitment,
        commitmentLevel: practiceCommitment,
        coachArchetype,
        coachArchetypeLabel: selectedArchetype?.label || null,
        weeklyPromise,
        weeklyPromiseLabel: selectedPromise?.label || null,
        consent: newConsentPayload,
        identityCommitment: {
          archetype: coachArchetype,
          archetypeLabel: selectedArchetype?.label || null,
          weeklyPromise,
          weeklyPromiseLabel: selectedPromise?.label || null
        },
        journeyPreview: selectedTemplate ? {
          templateId: selectedTemplate.id,
          cadence: selectedTemplate.cadence,
          milestones: selectedTemplate.milestones,
          coachArchetype: selectedArchetype?.label || null,
          weeklyPromise: selectedPromise?.label || null
        } : null
      };

      const persistConsentIfNeeded = () => {
        if (consentNeeded && newConsentPayload) {
          saveGoalConsent(goal, newConsentPayload);
        }
      };

      try {
        const maybePromise = onComplete(answers);
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise
            .then(() => {
              persistConsentIfNeeded();
            })
            .finally(() => setSubmitting(false));
        } else {
          persistConsentIfNeeded();
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
    (step === 3 && !goalSpecificAnswer1) ||
    (hasSecondQuestion && step === 4 && !goalSpecificAnswer2) ||
    (isCustomizationStep && (
      !difficultyBaseline ||
      !practiceCommitment ||
      !coachArchetype ||
      !weeklyPromise ||
      (consentRequired && !consentAccepted)
    ));

  const totalSteps = goal ? customizationStep : 5;
  const currentStepNumber = Math.min(step, totalSteps);
  const baseButtonLabel = isCustomizationStep ? 'Start journey' : 'Continue';
  const buttonLabel = submitting ? 'Creating journey...' : baseButtonLabel;

  return (
    <div className="onboardingQuestions">
      {step === 1 && (
        <div className="onboardingQuestions__step">
          <label className="onboardingQuestions__label">
            What’s your focus for the next few weeks? <span className="required">*</span>
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

      {step === 3 && goal && GOAL_SPECIFIC_QUESTIONS[goal]?.question1 && (
        <div className="onboardingQuestions__step">
          <label className="onboardingQuestions__label">
            {GOAL_SPECIFIC_QUESTIONS[goal].question1.label}
            <span className="required"> *</span>
          </label>
          <div className="onboardingQuestions__options">
            {renderGoalSpecificOptions('question1', goalSpecificAnswer1, setGoalSpecificAnswer1)}
          </div>
        </div>
      )}

      {step === 4 && goal && GOAL_SPECIFIC_QUESTIONS[goal]?.question2 && (
        <div className="onboardingQuestions__step">
          <label className="onboardingQuestions__label">
            {GOAL_SPECIFIC_QUESTIONS[goal].question2.label}
            <span className="required"> *</span>
          </label>
          <div className="onboardingQuestions__options">
            {renderGoalSpecificOptions('question2', goalSpecificAnswer2, setGoalSpecificAnswer2)}
          </div>
        </div>
      )}

      {isCustomizationStep && (
        <div className="onboardingQuestions__step onboardingQuestions__step--preview">
          <div className="onboardingQuestions__customizer">
            <label className="onboardingQuestions__label">
              Where are you starting from today?
              <span className="required"> *</span>
            </label>
            <div className="onboardingQuestions__options onboardingQuestions__options--compact">
              {BASELINE_LEVELS.map((baseline) => (
                <button
                  key={baseline.id}
                  type="button"
                  className={`onboardingQuestions__option ${difficultyBaseline === baseline.id ? 'active' : ''}`}
                  onClick={() => setDifficultyBaseline(baseline.id)}
                >
                  <div className="onboardingQuestions__optionContent">
                    <span className="onboardingQuestions__optionLabel">{baseline.label}</span>
                    <span className="onboardingQuestions__optionDescription">{baseline.description}</span>
                  </div>
                </button>
              ))}
            </div>

            <label className="onboardingQuestions__label">
              How much practice cadence keeps you honest?
              <span className="required"> *</span>
            </label>
            <div className="onboardingQuestions__options onboardingQuestions__options--compact">
              {COMMITMENT_LEVELS.map((commitment) => (
                <button
                  key={commitment.id}
                  type="button"
                  className={`onboardingQuestions__option ${practiceCommitment === commitment.id ? 'active' : ''}`}
                  onClick={() => setPracticeCommitment(commitment.id)}
                >
                  <div className="onboardingQuestions__optionContent">
                    <span className="onboardingQuestions__optionLabel">{commitment.label}</span>
                    <span className="onboardingQuestions__optionDescription">
                      {commitment.cadence} · {commitment.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <label className="onboardingQuestions__label">
              Choose the coach archetype that fits you
              <span className="required"> *</span>
            </label>
            <div className="onboardingQuestions__options onboardingQuestions__options--compact">
              {COACH_ARCHETYPES.map((archetype) => (
                <button
                  key={archetype.id}
                  type="button"
                  className={`onboardingQuestions__option ${coachArchetype === archetype.id ? 'active' : ''}`}
                  onClick={() => setCoachArchetype(archetype.id)}
                >
                  <div className="onboardingQuestions__optionContent">
                    <span className="onboardingQuestions__optionLabel">{archetype.label}</span>
                    <span className="onboardingQuestions__optionDescription">{archetype.description}</span>
                  </div>
                </button>
              ))}
            </div>

            <label className="onboardingQuestions__label">
              What weekly promise should we hold you to?
              <span className="required"> *</span>
            </label>
            <div className="onboardingQuestions__options onboardingQuestions__options--compact">
              {WEEKLY_PROMISES.map((promise) => (
                <button
                  key={promise.id}
                  type="button"
                  className={`onboardingQuestions__option ${weeklyPromise === promise.id ? 'active' : ''}`}
                  onClick={() => setWeeklyPromise(promise.id)}
                >
                  <div className="onboardingQuestions__optionContent">
                    <span className="onboardingQuestions__optionLabel">{promise.label}</span>
                    <span className="onboardingQuestions__optionDescription">{promise.description}</span>
                  </div>
                </button>
              ))}
            </div>

            {consentRequired ? (
              <div className={`onboardingQuestions__consent ${consentTouched && !consentAccepted ? 'error' : ''}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(event) => {
                      setConsentTouched(true);
                      setConsentAccepted(event.target.checked);
                    }}
                  />
                  <span>
                    I consent to BodAI analyzing my recordings with AI to deliver coaching insights (v{CONSENT_VERSION}).
                  </span>
                </label>
                <ul>
                  {CONSENT_POINTS.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="onboardingQuestions__consent onboardingQuestions__consent--ack">
                <p>
                  <strong>Consent already on file.</strong>{' '}
                  {consentAcceptedDate
                    ? `You agreed on ${consentAcceptedDate}.`
                    : 'You have previously agreed to these terms.'}
                </p>
              </div>
            )}

            <div className="onboardingQuestions__summaryRow">
              <div className="onboardingQuestions__summaryCard">
                <Zap size={16} />
                <div>
                  <p>Goal</p>
                  <strong>{selectedTemplate?.title || 'Select a journey'}</strong>
                </div>
              </div>
              <div className="onboardingQuestions__summaryCard">
                <Clock3 size={16} />
                <div>
                  <p>Cadence</p>
                  <strong>{selectedTemplate?.cadence || 'Choose commitment'}</strong>
                </div>
              </div>
              <div className="onboardingQuestions__summaryCard">
                <Target size={16} />
                <div>
                  <p>Archetype</p>
                  <strong>{selectedArchetype?.label || 'Pick your vibe'}</strong>
                </div>
              </div>
              <div className="onboardingQuestions__summaryCard">
                <CalendarCheck2 size={16} />
                <div>
                  <p>Weekly promise</p>
                  <strong>{selectedPromise?.label || 'Set your promise'}</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="onboardingQuestions__preview">
            <JourneyPreviewCard
              template={selectedTemplate}
              difficultyBaseline={difficultyBaseline}
              practiceCommitment={practiceCommitment}
              coachArchetypeLabel={selectedArchetype?.label || null}
              weeklyPromiseLabel={selectedPromise?.label || null}
            />
          </div>
        </div>
      )}

      <div className="onboardingQuestions__actions">
        <span className="onboardingQuestions__progress">
          Step {currentStepNumber} of {totalSteps}
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

