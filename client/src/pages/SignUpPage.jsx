import React, { useMemo } from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import './AuthPages.css';

const BENEFITS = [
  'AI-powered video analysis',
  'Personalized improvement tips',
  'Track your progress over time',
  'First analysis is free'
];

export default function SignUpPage() {
  // Memoize Clerk component to prevent re-mounting and duplicate verification codes
  // Stable key ensures Clerk doesn't re-initialize when parent re-renders
  const clerkSignUp = useMemo(() => (
    <SignUp 
      key="clerk-sign-up-stable" // Stable key prevents re-mounting
      routing="path" 
      path="/sign-up"
      signInUrl="/sign-in"
      afterSignUpUrl="/onboarding"
      appearance={{
        elements: {
          rootBox: 'authPage__clerkRoot',
          card: 'authPage__clerkCard',
        }
      }}
    />
  ), []); // Empty deps - component should only mount once

  return (
    <div className="authPage">
      {/* Background Elements */}
      <div className="authPage__bg">
        <div className="authPage__bgGradient" />
        <div className="authPage__bgOrb authPage__bgOrb--1" />
        <div className="authPage__bgOrb authPage__bgOrb--2" />
      </div>

      {/* Header */}
      <header className="authPage__header">
        <Link to="/" className="authPage__logo">
          <span className="authPage__logoText">BodAI</span>
        </Link>
        <div className="authPage__headerRight">
          <span className="authPage__headerText">Already have an account?</span>
          <Link to="/sign-in" className="authPage__headerLink">
            Sign in
          </Link>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <main className="authPage__main authPage__main--split">
        {/* Left Side - Form (Light Background) */}
        <div className="authPage__leftPanel authPage__leftPanel--split">
          <div className="authPage__leftContent">
            {/* Headline */}
            <div className="authPage__headline">
              <h1 className="authPage__title">
                Become<br />
                <span className="authPage__titleAccent">Unforgettable</span>
              </h1>
              <p className="authPage__subtitle">
                Master your communication skills
              </p>
            </div>


            {/* Clerk Sign Up Component */}
            <div className="authPage__formWrapper">
              {clerkSignUp}
            </div>
          </div>
        </div>

        {/* Right Side - Visual (Clean with Simple Animation) */}
        <div className="authPage__rightPanel authPage__rightPanel--split">
          <div className="authPage__visualContent">
            <div className="authPage__figureWrapper">
              <div className="authPage__progressRing" />
              <div className="authPage__progressRing authPage__progressRing--2" />
              <img
                src="/images/character2.png"
                alt="AI Analysis Visualization"
                className="authPage__figure"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="authPage__footer">
        <p>© {new Date().getFullYear()} BodAI. All rights reserved.</p>
      </footer>
    </div>
  );
}

