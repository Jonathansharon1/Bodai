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
    color: "#46B5D1"
  },
  {
    icon: Hand,
    text: "Open palm gestures signal honesty and openness, while closed fists may indicate tension.",
    color: "#46B5D1"
  },
  {
    icon: Brain,
    text: "Mirroring someone's body language builds rapport and connection subconsciously.",
    color: "#2563eb"
  },
  {
    icon: TrendingUp,
    text: "Upright posture with shoulders back increases perceived confidence by 40%.",
    color: "#46B5D1"
  },
  {
    icon: Eye,
    text: "People who maintain eye contact are perceived as more trustworthy and competent.",
    color: "#46B5D1"
  },
  {
    icon: Hand,
    text: "Hand gestures can increase audience retention by up to 60% in presentations.",
    color: "#2563eb"
  },
  {
    icon: Smile,
    text: "Smiling releases endorphins and can actually make you feel happier, not just appear happier.",
    color: "#46B5D1"
  }
];

const PROCESSING_STEPS = [
  { label: 'Uploading video...', duration: 5 },
  { label: 'Analyzing video...', duration: 20 },
  { label: 'Detecting body language and gestures...', duration: 15 },
  { label: 'Analyzing voice and speech patterns...', duration: 15 },
  { label: 'Generating personalized insights...', duration: 10 },
  { label: 'Almost done!', duration: 5 }
];

export default function LoadingView({ active = true }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Rotate through processing steps with realistic timing
  useEffect(() => {
    if (!active) return;
    
    let stepTimeout;
    const advanceStep = () => {
      setCurrentStep(prev => {
        const next = (prev + 1) % PROCESSING_STEPS.length;
        if (next < PROCESSING_STEPS.length && next > 0) {
          const duration = PROCESSING_STEPS[next].duration * 1000;
          stepTimeout = setTimeout(advanceStep, duration);
        }
        return next;
      });
    };
    
    // Start first step immediately, then advance based on durations
    const firstDuration = PROCESSING_STEPS[0].duration * 1000;
    stepTimeout = setTimeout(advanceStep, firstDuration);

    return () => {
      if (stepTimeout) clearTimeout(stepTimeout);
    };
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
          {PROCESSING_STEPS[currentStep].label}
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

        {/* Time Estimate */}
        <div className="loadingView__timeEstimate">
          <p className="loadingView__timeText">
            Usually takes <strong>1-2 minutes</strong>
          </p>
        </div>


      </div>
    </div>
  );
}

