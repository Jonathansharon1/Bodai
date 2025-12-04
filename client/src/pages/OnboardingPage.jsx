import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import OnboardingQuestions from '../components/OnboardingQuestions';
import './OnboardingPage.css';

export default function OnboardingPage({ onComplete }) {
  const { t } = useTranslation();

  return (
    <div className="onboardingPage">
      {/* Background Elements */}
      <div className="onboardingPage__bg">
        <div className="onboardingPage__bgGradient" />
        <div className="onboardingPage__bgOrb onboardingPage__bgOrb--1" />
        <div className="onboardingPage__bgOrb onboardingPage__bgOrb--2" />
        <div className="onboardingPage__bgOrb onboardingPage__bgOrb--3" />
        </div>

      {/* Header */}
      <header className="onboardingPage__header">
        <Link to="/" className="onboardingPage__logo">
          <span className="onboardingPage__logoText">BodAI</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="onboardingPage__main">
        <div className="onboardingPage__content">
          {/* Headline */}
          <div className="onboardingPage__headline">
            <div className="onboardingPage__badge">
              <Sparkles size={14} />
              <span>{t('onboarding.badge')}</span>
            </div>
            <h1 className="onboardingPage__title">
              {t('onboarding.titleLine1')}<br />
              <span className="onboardingPage__titleAccent">{t('onboarding.titleAccent')}</span>
            </h1>
            <p className="onboardingPage__subtitle">
              {t('onboarding.subtitle')}
            </p>
          </div>

          {/* Questions Card */}
          <div className="onboardingPage__card">
            <OnboardingQuestions onComplete={onComplete} />
        </div>

          {/* Trust Note */}
          <p className="onboardingPage__trust">
            {t('onboarding.trustNote')}
          </p>
        </div>
      </main>
    </div>
  );
}
