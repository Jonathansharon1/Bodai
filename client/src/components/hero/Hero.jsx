import React from 'react';
import { useNavigate } from 'react-router-dom';

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
          <h1 className="hero__title">
            <span className="hero__titleLine1">Every Gesture Tells a Story.</span>
            <span className="hero__titleLine2">Make Yours Unforgettable.</span>
          </h1>
          <p className="hero__subtitle">Train your body language, refine your delivery, and master the art of influence through AI-guided video feedback.</p>
          <div className="hero__actions">
            <a className="btn btn--primary" href="#try">Get Started Now For Free</a>
            <button className="btn btn--ghost" onClick={() => navigate('/pricing')} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.3)', color: '#FFFFFF' }}>
              View Pricing
            </button>
          </div>
          <p className="hero__micro">No credit card required</p>
        </div>
      </div>
    </section>
  );
}

