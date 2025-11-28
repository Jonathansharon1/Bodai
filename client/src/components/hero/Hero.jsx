import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
                className="hero__cta"
                onClick={handleCTAClick}
              >
                <span>Start New Analysis</span>
                <ArrowRight size={18} strokeWidth={2.5} />
                <div className="hero__ctaGlow" />
              </button>
            ) : (
              <Link to="/sign-up" className="hero__cta">
                <span>Get Started Free</span>
                <ArrowRight size={18} strokeWidth={2.5} />
                <div className="hero__ctaGlow" />
              </Link>
            )}
          </div>
          {!isSignedIn && (
            <p className="hero__micro">No credit card required · Start improving today</p>
          )}
        </div>

        <div className="hero__visual">
          <div className="hero__visualOrb hero__visualOrb--1" />
          <div className="hero__visualOrb hero__visualOrb--2" />
          <div className="hero__visualOrb hero__visualOrb--3" />
          <div className="hero__visualGlow" />
          <div className="hero__visualRing" />

          {/* Analysis Animation Elements */}
          <div className="hero__scanLine" />
          
          {/* SVG Skeleton Lines */}
          <svg className="hero__skeleton" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Shoulder line */}
            <line className="hero__skeletonLine hero__skeletonLine--shoulders" x1="36" y1="24" x2="64" y2="24" />
            {/* Left arm */}
            <line className="hero__skeletonLine hero__skeletonLine--armL" x1="36" y1="24" x2="28" y2="48" />
            {/* Right arm */}
            <line className="hero__skeletonLine hero__skeletonLine--armR" x1="64" y1="24" x2="72" y2="48" />
            {/* Spine to head */}
            <line className="hero__skeletonLine hero__skeletonLine--spine" x1="50" y1="24" x2="50" y2="12" />
          </svg>

          {/* Pose Tracking Markers */}
          <div className="hero__marker hero__marker--head">
            <div className="hero__markerBracket" />
            <span className="hero__markerLabel">Posture 94%</span>
          </div>
          <div className="hero__marker hero__marker--shoulderL">
            <div className="hero__markerBracket" />
            <span className="hero__markerLabel hero__markerLabel--left">Confidence 91%</span>
          </div>
          <div className="hero__marker hero__marker--shoulderR">
            <div className="hero__markerBracket" />
            <span className="hero__markerLabel">Eye Contact 89%</span>
          </div>
          <div className="hero__marker hero__marker--handL">
            <div className="hero__markerBracket" />
            <span className="hero__markerLabel hero__markerLabel--left">Gestures 87%</span>
          </div>
          <div className="hero__marker hero__marker--handR">
            <div className="hero__markerBracket" />
            <span className="hero__markerLabel">Energy 92%</span>
          </div>

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