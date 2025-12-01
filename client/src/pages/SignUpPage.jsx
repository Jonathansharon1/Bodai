import React, { useMemo } from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Star, CheckCircle } from 'lucide-react';
import './AuthPages.css';

const BENEFITS = [
  'AI-powered video analysis',
  'Personalized improvement tips',
  'Track your progress over time',
  'First analysis is free'
];

const TESTIMONIAL = {
  text: "The instant feedback on my body language was eye-opening. I had no idea I was crossing my arms so much. Small changes, big impact.",
  author: "David L.",
  role: "Software Engineer",
  rating: 5
};

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

      {/* Main Content */}
      <main className="authPage__main">
        <div className="authPage__content">
          {/* Headline */}
          <div className="authPage__headline">
            <h1 className="authPage__title">
              Make Your Communication<br />
              <span className="authPage__titleAccent">Unforgettable</span>
            </h1>
            <p className="authPage__subtitle">
              Start improving your presence with AI-powered feedback
            </p>
          </div>

          {/* Benefits List */}
          <div className="authPage__benefits">
            {BENEFITS.map((benefit, idx) => (
              <div key={idx} className="authPage__benefit">
                <CheckCircle size={18} className="authPage__benefitIcon" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* Clerk Sign Up Component */}
          <div className="authPage__formWrapper">
            {clerkSignUp}
          </div>

          {/* Testimonial */}
          <div className="authPage__testimonial">
            <div className="authPage__testimonialRating">
              {[...Array(TESTIMONIAL.rating)].map((_, i) => (
                <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />
              ))}
            </div>
            <p className="authPage__testimonialText">
              "{TESTIMONIAL.text}"
            </p>
            <div className="authPage__testimonialAuthor">
              <span className="authPage__testimonialName">{TESTIMONIAL.author}</span>
              <span className="authPage__testimonialRole">{TESTIMONIAL.role}</span>
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

