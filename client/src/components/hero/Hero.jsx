import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

export default function Hero({ isSignedIn = false, onNewAnalysis }) {
  const navigate = useNavigate();

  const handleCTAClick = (e) => {
    if (isSignedIn) {
      e.preventDefault();
      if (onNewAnalysis) {
        onNewAnalysis();
      } else {
        navigate('/new-analysis');
      }
    }
  };

  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__bgGradient" />
        <div className="hero__bgPattern" />
        <div className="hero__bgScrim" />
      </div>
      
      <div className="hero__container">
        <div className="hero__content">

          <h1 className="hero__title">
            <span className="hero__titleLine1">Every Gesture Tells a Story.</span>
            <span className="hero__titleLine2">Make Yours Unforgettable.</span>
          </h1>
          <p className="hero__subtitle">
            {isSignedIn 
              ? "Continue your journey to confident communication. Upload a new video to track your progress."
              : "Master the art of confident communication with AI-guided video feedback. Transform how you present yourself in every interaction."
            }
          </p>
          <div className="hero__actions">
            {isSignedIn ? (
              <button 
                className="btn btn--primary hero__cta" 
                onClick={handleCTAClick}
              >
                <span>Start New Analysis</span>
                <div className="hero__ctaGlow" />
              </button>
            ) : (
              <a className="btn btn--primary hero__cta" href="#try">
                <span>Get Started Now For Free</span>
                <div className="hero__ctaGlow" />
              </a>
            )}
          </div>
          {!isSignedIn && (
            <p className="hero__micro">No credit card required • Start improving today</p>
          )}
        </div>
        
        <div className="hero__visual">
          <div className="hero__visualOrb hero__visualOrb--1" />
          <div className="hero__visualOrb hero__visualOrb--2" />
          <div className="hero__visualOrb hero__visualOrb--3" />
          <div className="hero__visualGlow" />
          <div className="hero__visualRing" />
          <img 
            src="/images/character.png" 
            alt="AI Analysis Visualization" 
            className="hero__figure"
          />
        </div>
      </div>
    </section>
  );
}