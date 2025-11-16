import React, { useState } from 'react';
import { 
  Dumbbell, 
  Briefcase, 
  Mic, 
  MessageCircle, 
  Award, 
  Heart, 
  Users,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  AlertCircle
} from 'lucide-react';

const GOALS = [
  { id: 'confidence', label: 'Build Self-Confidence', icon: Dumbbell, description: 'Feel more confident in your daily interactions' },
  { id: 'interview', label: 'Job Interview Preparation', icon: Briefcase, description: 'Excel in job interviews and make a strong impression' },
  { id: 'presentation', label: 'Improve Presentations & Speeches', icon: Mic, description: 'Deliver engaging presentations and public speeches' },
  { id: 'communication', label: 'Better Interpersonal Communication', icon: MessageCircle, description: 'Improve your communication skills in conversations' },
  { id: 'leadership', label: 'Develop Leadership Presence', icon: Award, description: 'Command respect and inspire as a leader' },
  { id: 'dating', label: 'Dating & Romantic Situations', icon: Heart, description: 'Make a positive impression in romantic situations' },
  { id: 'social', label: 'Social Confidence', icon: Users, description: 'Feel comfortable and confident in social settings' },
];

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

  const handleGoalSelect = (goalId) => {
    setGoal(goalId);
    // Reset goal-specific answers when goal changes
    setGoalSpecificAnswer1('');
    setGoalSpecificAnswer2('');
  };

  const handleContinue = () => {
    if (step === 1 && !goal) return;
    if (step === 2 && !confidence) return;
    if (step === 3 && !goalSpecificAnswer1) return;
    if (step === 4 && !goalSpecificAnswer2) return;
    
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      // Check if there's a second question for this goal
      const goalQuestions = GOAL_SPECIFIC_QUESTIONS[goal];
      if (goalQuestions?.question2) {
        setStep(4);
      } else {
        // No second question, complete onboarding
        const answers = {
          primaryGoal: goal,
          confidenceLevel: confidence,
          goalSpecificContext: {
            question1: goalSpecificAnswer1,
          }
        };
        onComplete(answers);
      }
    } else {
      // Step 4 - complete onboarding
      const answers = {
        primaryGoal: goal,
        confidenceLevel: confidence,
        goalSpecificContext: {
          question1: goalSpecificAnswer1,
          question2: goalSpecificAnswer2,
        }
      };
      onComplete(answers);
    }
  };

  return (
    <div className="onboardingQuestions">


      {step === 1 && (
        <div className="onboardingQuestions__step">
          <label className="onboardingQuestions__label">
            What's your main goal? <span className="required">*</span>
          </label>
          <div className="onboardingQuestions__options">
            {GOALS.map((g) => {
              const IconComponent = g.icon;
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`onboardingQuestions__option ${goal === g.id ? 'active' : ''}`}
                  onClick={() => handleGoalSelect(g.id)}
                >
                  <div className="onboardingQuestions__icon">
                    <IconComponent size={32} />
                  </div>
                  <div className="onboardingQuestions__optionContent">
                    <span className="onboardingQuestions__optionLabel">{g.label}</span>
                    <span className="onboardingQuestions__optionDescription">{g.description}</span>
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
            {GOAL_SPECIFIC_QUESTIONS[goal].question1.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`onboardingQuestions__option ${goalSpecificAnswer1 === option.id ? 'active' : ''}`}
                onClick={() => setGoalSpecificAnswer1(option.id)}
              >
                <div className="onboardingQuestions__optionContent">
                  <span className="onboardingQuestions__optionLabel">{option.label}</span>
                </div>
              </button>
            ))}
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
            {GOAL_SPECIFIC_QUESTIONS[goal].question2.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`onboardingQuestions__option ${goalSpecificAnswer2 === option.id ? 'active' : ''}`}
                onClick={() => setGoalSpecificAnswer2(option.id)}
              >
                <div className="onboardingQuestions__optionContent">
                  <span className="onboardingQuestions__optionLabel">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="onboardingQuestions__actions">
        {step > 1 && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
        )}
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleContinue}
          disabled={
            (step === 1 && !goal) || 
            (step === 2 && !confidence) || 
            (step === 3 && !goalSpecificAnswer1) ||
            (step === 4 && !goalSpecificAnswer2)
          }
        >
          {step === 4 || (step === 3 && !GOAL_SPECIFIC_QUESTIONS[goal]?.question2) 
            ? 'Continue to Dashboard' 
            : 'Continue'}
        </button>
      </div>
    </div>
  );
}

