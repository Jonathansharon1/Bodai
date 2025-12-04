import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Eye, Smile, Hand, TrendingUp } from 'lucide-react';

// Facts shown in the loading view while analysis runs
const BODY_LANGUAGE_FACTS = [
  {
    icon: Eye,
    key: 'eyeContact',
    color: '#46B5D1'
  },
  {
    icon: Smile,
    key: 'genuineSmile',
    color: '#46B5D1'
  },
  {
    icon: Hand,
    key: 'openPalms',
    color: '#46B5D1'
  },
  {
    icon: Brain,
    key: 'mirroring',
    color: '#2563eb'
  },
  {
    icon: TrendingUp,
    key: 'uprightPosture',
    color: '#46B5D1'
  },
  {
    icon: Eye,
    key: 'trustEyeContact',
    color: '#46B5D1'
  },
  {
    icon: Hand,
    key: 'handGestures',
    color: '#2563eb'
  },
  {
    icon: Smile,
    key: 'smiling',
    color: '#46B5D1'
  }
];

// Background processing steps shown under the progress bar
const PROCESSING_STEPS = [
  { key: 'uploading', duration: 5 },
  { key: 'analyzing', duration: 20 },
  { key: 'detectingBodyLanguage', duration: 15 },
  { key: 'analyzingVoice', duration: 15 },
  { key: 'generatingInsights', duration: 10 },
  { key: 'almostDone', duration: 5 }
];

export default function LoadingView({ active = true }) {
  const { t } = useTranslation();
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
          {t('analysisResult.analyzing')}
        </h2>
        <p className="loadingView__subtitle">
          {t('loadingView.subtitle')}
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
          {t(`loadingView.steps.${PROCESSING_STEPS[currentStep].key}`)}
        </p>

        {/* Fun Fact Section */}
        <div className="loadingView__factSection">
          <div className={`loadingView__factCard ${isAnimating ? 'fade-out' : 'fade-in'}`}>
            <div className="loadingView__factIcon" style={{ color: currentFact.color }}>
              <IconComponent size={48} />
            </div>
            <p className="loadingView__factText">
              {t(`loadingView.facts.${currentFact.key}`)}
            </p>
          </div>
        </div>

        {/* Time Estimate */}
        <div className="loadingView__timeEstimate">
          <p className="loadingView__timeText">
            {t('loadingView.timeEstimate', { minutes: '1–2' })}
          </p>
        </div>


      </div>
    </div>
  );
}

