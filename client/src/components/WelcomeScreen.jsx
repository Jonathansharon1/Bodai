import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Video, Brain, TrendingUp, ArrowRight, X } from 'lucide-react';
import './WelcomeScreen.css';

const STEPS = [
  {
    icon: Video,
    title: 'Record',
    description: 'Record 30 seconds to 2 minutes of you speaking'
  },
  {
    icon: Brain,
    title: 'Analyze',
    description: 'Get instant AI-powered feedback on your communication'
  },
  {
    icon: TrendingUp,
    title: 'Improve',
    description: 'Practice with personalized tips and track your progress'
  }
];

export default function WelcomeScreen({ onContinue, onSkip }) {
  const navigate = useNavigate();

  const handleContinue = () => {
    localStorage.setItem('bodai_welcome_seen', 'true');
    if (onContinue) {
      onContinue();
    } else {
      navigate('/onboarding');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('bodai_welcome_seen', 'true');
    if (onSkip) {
      onSkip();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="welcomeScreen">
      {/* Background Elements */}
      <div className="welcomeScreen__bg">
        <div className="welcomeScreen__bgGradient" />
        <div className="welcomeScreen__bgOrb welcomeScreen__bgOrb--1" />
        <div className="welcomeScreen__bgOrb welcomeScreen__bgOrb--2" />
      </div>

      {/* Header */}
      <header className="welcomeScreen__header">
        <Link to="/" className="welcomeScreen__logo">
          <span className="welcomeScreen__logoText">BodAI</span>
        </Link>
        <button 
          className="welcomeScreen__skip"
          onClick={handleSkip}
          aria-label="Skip welcome"
        >
          <X size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="welcomeScreen__main">
        <div className="welcomeScreen__content">
          {/* Hero Section */}
          <div className="welcomeScreen__hero">
            <h1 className="welcomeScreen__title">
              Welcome to <span className="welcomeScreen__titleAccent">BodAI</span>!
            </h1>
            <p className="welcomeScreen__subtitle">
              Your AI-powered coach for better communication and presence
            </p>
          </div>

          {/* What is BodAI */}
          <div className="welcomeScreen__section">
            <h2 className="welcomeScreen__sectionTitle">What is BodAI?</h2>
            <p className="welcomeScreen__sectionText">
              BodAI analyzes your video recordings to give you instant feedback on your body language, 
              voice, and communication style. Get personalized tips to improve your presence and 
              confidence in any situation.
            </p>
          </div>

          {/* How it Works */}
          <div className="welcomeScreen__section">
            <h2 className="welcomeScreen__sectionTitle">How it works</h2>
            <div className="welcomeScreen__steps">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="welcomeScreen__step">
                    <div className="welcomeScreen__stepIcon">
                      <Icon size={24} />
                    </div>
                    <div className="welcomeScreen__stepContent">
                      <h3 className="welcomeScreen__stepTitle">{step.title}</h3>
                      <p className="welcomeScreen__stepDescription">{step.description}</p>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className="welcomeScreen__stepArrow">
                        <ArrowRight size={20} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="welcomeScreen__cta">
            <button 
              className="welcomeScreen__ctaButton"
              onClick={handleContinue}
            >
              Let's personalize your experience
              <ArrowRight size={20} />
            </button>
            <button 
              className="welcomeScreen__skipButton"
              onClick={handleSkip}
            >
              I'll explore first
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

