import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import OnboardingQuestions from '../components/OnboardingQuestions';
import './OnboardingPage.css';

export default function OnboardingPage({ onComplete }) {
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
              <span>Quick Setup</span>
            </div>
            <h1 className="onboardingPage__title">
              Let's personalize your<br />
              <span className="onboardingPage__titleAccent">experience</span>
            </h1>
            <p className="onboardingPage__subtitle">
              Answer 3 quick questions so we can tailor your feedback
            </p>
          </div>

          {/* Questions Card */}
          <div className="onboardingPage__card">
            <OnboardingQuestions onComplete={onComplete} />
        </div>

          {/* Trust Note */}
          <p className="onboardingPage__trust">
            Takes about 30 seconds • You can change these later
          </p>
        </div>
      </main>
    </div>
  );
}
