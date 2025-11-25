import React, { useEffect, useRef, useState } from 'react';
import './Section1BiologyOfJudgment.css';

export default function Section1BiologyOfJudgment({ onComplete }) {
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const containerTop = rect.top;
      const containerHeight = rect.height;

      // Calculate scroll progress (0 to 1)
      const progress = Math.max(0, Math.min(1, -containerTop / (containerHeight - windowHeight)));
      setScrollProgress(progress);

      // Determine current step based on progress
      if (progress < 0.25) {
        setCurrentStep(0); // Screen 1.0 - The Hook
      } else if (progress < 0.5) {
        setCurrentStep(1); // Screen 1.1 - The Trigger
      } else if (progress < 0.75) {
        setCurrentStep(2); // Screen 1.2 - The Science
      } else {
        setCurrentStep(3); // Screen 1.3 - The Filter
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Timer animation for step 2
  const timerValue = currentStep >= 2 ? Math.min(0.1, (scrollProgress - 0.5) * 0.4) : 0;

  return (
    <section ref={containerRef} className="section1Biology">
      {/* Sticky Background Container */}
      <div className="section1StickyContainer">
        {/* Screen 1.0: The Hook - Eye Close-up */}
        <div className={`section1Screen ${currentStep === 0 ? 'active' : ''}`}>
          <div className="section1EyeImage">
            {/* Placeholder for eye image - replace with actual image */}
            <div className="section1PlaceholderImage" style={{ 
              background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4rem'
            }}>
              👁️
            </div>
          </div>
          <div className="section1TextOverlay">
            <h2 className="section1FloatingText fadeIn">Before you speak a single word...</h2>
          </div>
        </div>

        {/* Screen 1.1: The Trigger - Zoom into pupil */}
        <div className={`section1Screen ${currentStep === 1 ? 'active' : ''}`}>
          <div className="section1EyeImage" style={{ transform: `scale(${1 + (scrollProgress - 0.25) * 2})` }}>
            <div className="section1PlaceholderImage" style={{ 
              background: 'radial-gradient(circle, #2a2a2a 0%, #000000 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '6rem'
            }}>
              👁️
            </div>
          </div>
          <div className="section1TextOverlay">
            <div className="section1Timer">0.000s</div>
            <h2 className="section1MainText">...the human brain has already decided if you are a Friend or a Threat.</h2>
            <p className="section1Subtext" style={{ marginTop: '1rem' }}>
              You think you control your reputation. You don't. Your amygdala does.
            </p>
          </div>
        </div>

        {/* Screen 1.2: The Science - Brain with Amygdala */}
        <div className={`section1Screen ${currentStep === 2 ? 'active' : ''}`}>
          <div className="section1BrainImage">
            {/* Placeholder for brain illustration */}
            <div className="section1PlaceholderImage" style={{ 
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8rem',
              position: 'relative'
            }}>
              🧠
              {/* Glowing Amygdala */}
              <div 
                className="section1AmygdalaGlow"
                style={{ 
                  opacity: currentStep >= 2 ? 1 : 0,
                  transform: `scale(${currentStep >= 2 ? 1 : 0.5})`
                }}
              >
                <div className="section1AmygdalaDot"></div>
              </div>
            </div>
          </div>
          <div className="section1TextOverlay">
            <div className="section1Timer" style={{ color: timerValue >= 0.1 ? '#ef4444' : '#FFFFFF' }}>
              {timerValue.toFixed(3)}s
            </div>
            <h2 className="section1MainText">The 100-Millisecond Rule</h2>
            <p className="section1Subtext">
              Evolution designed us to answer two questions in 0.1 seconds: Can this person hurt me? (Competence). And... Do they want to? (Warmth).
            </p>
            <p className="section1Subtext" style={{ marginTop: '1rem', fontSize: '0.95rem', opacity: 0.9 }}>
              Princeton research (Willis & Todorov, 2006) confirms that your Amygdala processes a stranger's face faster than conscious thought. 
              This is a survival mechanism, not a social choice.
            </p>
          </div>
        </div>

        {/* Screen 1.3: The Filter - Confirmation Bias */}
        <div className={`section1Screen ${currentStep === 3 ? 'active' : ''}`}>
          <div className="section1FilterImage">
            {/* Placeholder for silhouette with filter */}
            <div className="section1PlaceholderImage" style={{ 
              background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '6rem',
              position: 'relative'
            }}>
              👤
              {/* Filter overlay */}
              <div 
                className="section1FilterOverlay"
                style={{ 
                  transform: `translateX(${currentStep >= 3 ? 0 : -100}%)`,
                  transition: 'transform 0.8s ease-out'
                }}
              ></div>
            </div>
          </div>
          <div className="section1TextOverlay">
            <h2 className="section1MainText">The Confirmation Bias Loop</h2>
            <p className="section1Subtext">
              Fail this split-second test, and you spend the rest of the conversation fighting your own face.
            </p>
            <p className="section1Subtext" style={{ marginTop: '1rem', fontSize: '0.95rem', opacity: 0.9 }}>
              Once the judgment is made (0.1s), the brain spends the next 7 seconds looking for evidence to prove itself right. 
              You are fighting biology.
            </p>
          </div>
        </div>
      </div>

      {/* Scroll Spacer to enable scrolling */}
      <div className="section1Spacer" style={{ height: '400vh' }}></div>

      {/* Completion Indicator */}
      {currentStep === 3 && scrollProgress > 0.95 && (
        <div className="section1CompleteIndicator">
          <button 
            className="section1ContinueBtn"
            onClick={onComplete}
          >
            Continue to Assessment Lab →
          </button>
        </div>
      )}
    </section>
  );
}

