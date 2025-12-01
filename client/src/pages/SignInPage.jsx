import React, { useMemo } from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import './AuthPages.css';

const TESTIMONIAL = {
  text: "BodAI completely changed how I approach presentations. After just a few sessions, I went from dreading meetings to actually looking forward to them.",
  author: "Sarah M.",
  role: "Marketing Manager",
  rating: 5
};

export default function SignInPage() {
  // Memoize Clerk component to prevent re-mounting and duplicate verification codes
  // Stable key ensures Clerk doesn't re-initialize when parent re-renders
  const clerkSignIn = useMemo(() => {
    // Use current pathname or dashboard as redirect, but don't store it persistently
    // This prevents Clerk from storing redirect URLs that get applied on refresh
    const redirectUrl = window.location.pathname !== '/sign-in' && 
                        !window.location.pathname.startsWith('/sign-in/') 
                        ? window.location.pathname 
                        : '/dashboard';
    
    return (
      <SignIn 
        key="clerk-sign-in-stable" // Stable key prevents re-mounting
        routing="path" 
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl={redirectUrl}
        redirectUrl={redirectUrl}
        appearance={{
          elements: {
            rootBox: 'authPage__clerkRoot',
            card: 'authPage__clerkCard',
          }
        }}
      />
    );
  }, []); // Empty deps - component should only mount once

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
          <span className="authPage__headerText">Don't have an account?</span>
          <Link to="/sign-up" className="authPage__headerLink">
            Sign up
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="authPage__main">
        <div className="authPage__content">
          {/* Headline */}
          <div className="authPage__headline">
            <h1 className="authPage__title">
              Welcome back
            </h1>
            <p className="authPage__subtitle">
              Continue your journey to confident communication
            </p>
          </div>

          {/* Clerk Sign In Component */}
          <div className="authPage__formWrapper">
            {clerkSignIn}
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

