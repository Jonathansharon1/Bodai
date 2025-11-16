import React, { useState } from 'react';
import OnboardingQuestions from '../components/OnboardingQuestions';
import './OnboardingPage.css';

export default function OnboardingPage({ onComplete }) {
  return (
    <div className="onboardingPage">
      <div className="onboardingPage__container">
        <div className="onboardingPage__header">
          <div className="onboardingPage__badge">Welcome to BodAI</div>
          <h1 className="onboardingPage__title">Let's personalize your experience</h1>
          <p className="onboardingPage__subtitle">
            Answer a few quick questions to get tailored body language analysis
          </p>
        </div>

        <div className="onboardingPage__content">
          <OnboardingQuestions 
            onComplete={onComplete}
          />
        </div>

        <div className="onboardingPage__footer">
          <p className="onboardingPage__footerText">
            Your answers help us provide the most relevant feedback for your goals
          </p>
        </div>
      </div>
    </div>
  );
}

