import React, { useEffect, useRef, useState } from 'react';
import { Brain, Eye, Smile, Hand, TrendingUp } from 'lucide-react';

const BODY_LANGUAGE_FACTS = [
  {
    icon: Eye,
    text: "Eye contact for 60-70% of a conversation shows confidence and engagement.",
    color: "#46B5D1"
  },
  {
    icon: Smile,
    text: "A genuine smile uses both the mouth and eyes, creating 'crow's feet' wrinkles.",
    color: "#FF8C64"
  },
  {
    icon: Hand,
    text: "Open palm gestures signal honesty and openness, while closed fists may indicate tension.",
    color: "#46B5D1"
  },
  {
    icon: Brain,
    text: "Mirroring someone's body language builds rapport and connection subconsciously.",
    color: "#004E64"
  },
  {
    icon: TrendingUp,
    text: "Upright posture with shoulders back increases perceived confidence by 40%.",
    color: "#FF8C64"
  },
  {
    icon: Eye,
    text: "People who maintain eye contact are perceived as more trustworthy and competent.",
    color: "#46B5D1"
  },
  {
    icon: Hand,
    text: "Hand gestures can increase audience retention by up to 60% in presentations.",
    color: "#004E64"
  },
  {
    icon: Smile,
    text: "Smiling releases endorphins and can actually make you feel happier, not just appear happier.",
    color: "#FF8C64"
  }
];

const PROCESSING_STEPS = [
  'Processing video...',
  'Analyzing body language...',
  'Detecting gestures and gaze...',
  'Generating insights...',
  'Preparing your results...'
];

export default function LoadingView({ active = true }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Rotate through processing steps
  useEffect(() => {
    if (!active) return;
    
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % PROCESSING_STEPS.length);
    }, 2500);

    return () => clearInterval(stepInterval);
  }, [active]);

  // Rotate through fun facts with animation
  useEffect(() => {
    if (!active) return;
    
    const factInterval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setFactIndex(prev => (prev + 1) % BODY_LANGUAGE_FACTS.length);
        setIsAnimating(false);
      }, 300);
    }, 7000); // Changed from 4000 to 7000 (7 seconds per fact)

    return () => clearInterval(factInterval);
  }, [active]);

  // Smooth progress animation
  useEffect(() => {
    if (!active) return;
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        return prev + Math.random() * 2;
      });
    }, 200);

    return () => clearInterval(progressInterval);
  }, [active]);

  const currentFact = BODY_LANGUAGE_FACTS[factIndex];
  const IconComponent = currentFact.icon;

  return (
    <div className="loadingView">
      <div className="loadingView__container">
        {/* Main Title */}
        <h2 className="loadingView__mainTitle">
          Running your body-language assessment
        </h2>
        <p className="loadingView__subtitle">
          We’re evaluating movement, eye contact, pacing, and presence signals from your recording.
        </p>

        {/* Progress Bar */}
        <div className="loadingView__progressWrapper">
          <div className="loadingView__progressTrack">
            <div 
              className="loadingView__progressFill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <p className="loadingView__currentStep">
          {PROCESSING_STEPS[currentStep]}
        </p>

        {/* Fun Fact Section */}
        <div className="loadingView__factSection">
          <div className={`loadingView__factCard ${isAnimating ? 'fade-out' : 'fade-in'}`}>
            <div className="loadingView__factIcon" style={{ color: currentFact.color }}>
              <IconComponent size={48} />
            </div>
            <p className="loadingView__factText">{currentFact.text}</p>
          </div>
        </div>

        {/* Bottom Hint */}
        <p className="loadingView__hint">
          This may take up to a 1-2 minutes depending on video length
        </p>
      </div>
    </div>
  );
}

