import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Target, TrendingUp, Sparkles } from 'lucide-react';

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero">
      {/* Background video layer */}
      <div className="hero__bg" aria-hidden="true">
        <video
          className="hero__bgVideo"
          src="/hero-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="hero__bgScrim" />
      </div>
      <div className="hero__inner">
        <div className="hero__copy">
          <div className="hero__badge">
            <Sparkles size={16} />
            <span>AI-Powered Body Language Analysis</span>
          </div>
          <h1 className="hero__title">
            <span className="hero__titleLine1">Every Gesture Tells a Story.</span>
            <span className="hero__titleLine2">Make Yours Unforgettable.</span>
          </h1>
          <p className="hero__subtitle">
            Master the art of confident communication with AI-guided video feedback. 
            Get personalized insights on your body language, delivery, and presence.
          </p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="#try">Get Started Now For Free</a>
            <button className="btn btn--ghost" onClick={() => navigate('/pricing')} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#FFFFFF' }}>
              View Pricing
            </button>
          </div>
          <p className="hero__micro">No credit card required • Start improving today</p>
          <div className="hero__benefits">
            <div className="hero__benefit">
              <div className="hero__benefitIcon">
                <Brain size={20} />
              </div>
              <span>AI-Powered Analysis</span>
            </div>
            <div className="hero__benefit">
              <div className="hero__benefitIcon">
                <Target size={20} />
              </div>
              <span>Personalized Feedback</span>
            </div>
            <div className="hero__benefit">
              <div className="hero__benefitIcon">
                <TrendingUp size={20} />
              </div>
              <span>Track Your Progress</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

