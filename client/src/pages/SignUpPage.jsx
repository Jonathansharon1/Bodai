import React, { useMemo } from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';
import { getClerkLocalization } from '../utils/clerkLocalization';
import './AuthPages.css';

export default function SignUpPage() {
  const { t, i18n } = useTranslation();
  // Memoize Clerk component but allow re-mounting when language changes
  // Key includes language to force re-mount when language changes
  const clerkSignUp = useMemo(() => (
    <SignUp 
      key={`clerk-sign-up-${i18n.language}`} // Include language in key to force re-mount on language change
      routing="path" 
      path="/sign-up"
      signInUrl="/sign-in"
      afterSignUpUrl="/onboarding"
      localization={getClerkLocalization(i18n.language)}
      appearance={{
        elements: {
          rootBox: 'authPage__clerkRoot',
          card: 'authPage__clerkCard',
          footer: { display: 'none' },
          footerAction: { display: 'none' },
          footerActionText: { display: 'none' },
          footerActionLink: { display: 'none' },
          headerSubtitle: { display: 'none' },
        }
      }}
    />
  ), [i18n.language]); // Re-mount when language changes

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
          <span className="authPage__headerText">{t('auth.signUp.headerHaveAccount')}</span>
          <Link to="/sign-in" className="authPage__headerLink">
            {t('auth.signUp.headerCta')}
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
                {t('auth.signUp.titleLine1')}<br />
                <span className="authPage__titleAccent">{t('auth.signUp.titleAccent')}</span>
              </h1>
              <p className="authPage__subtitle">
                {t('auth.signUp.subtitle')}
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
        <p>{t('auth.footerCopyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}

