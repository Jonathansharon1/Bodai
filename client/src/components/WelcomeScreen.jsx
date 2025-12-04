import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Video, Brain, TrendingUp, ArrowRight, X } from 'lucide-react';
import './WelcomeScreen.css';

export default function WelcomeScreen({ onContinue, onSkip }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const STEPS = useMemo(() => [
    {
      icon: Video,
      title: t('marketing.welcome.step1.title'),
      description: t('marketing.welcome.step1.description')
    },
    {
      icon: Brain,
      title: t('marketing.welcome.step2.title'),
      description: t('marketing.welcome.step2.description')
    },
    {
      icon: TrendingUp,
      title: t('marketing.welcome.step3.title'),
      description: t('marketing.welcome.step3.description')
    }
  ], [t]);

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
              {t('marketing.welcome.title')} <span className="welcomeScreen__titleAccent">{t('marketing.welcome.titleAccent')}</span>!
            </h1>
            <p className="welcomeScreen__subtitle">
              {t('marketing.welcome.subtitle')}
            </p>
          </div>

          {/* What is BodAI */}
          <div className="welcomeScreen__section">
            <h2 className="welcomeScreen__sectionTitle">{t('marketing.welcome.whatIsTitle')}</h2>
            <p className="welcomeScreen__sectionText">
              {t('marketing.welcome.whatIsText')}
            </p>
          </div>

          {/* How it Works */}
          <div className="welcomeScreen__section">
            <h2 className="welcomeScreen__sectionTitle">{t('marketing.welcome.howItWorksTitle')}</h2>
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
              {t('marketing.welcome.cta')}
              <ArrowRight size={20} />
            </button>
            <button 
              className="welcomeScreen__skipButton"
              onClick={handleSkip}
            >
              {t('marketing.welcome.skip')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

