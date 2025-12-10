import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { getClerkLocalization } from '../utils/clerkLocalization';
import './AuthPages.css';

export default function SignInPage() {
  const { t, i18n } = useTranslation();

  // Memoize Clerk component but allow re-mounting when language changes
  // Key includes language to force re-mount when language changes
  const clerkSignIn = useMemo(() => {
    // Use current pathname or dashboard as redirect, but don't store it persistently
    // This prevents Clerk from storing redirect URLs that get applied on refresh
    const redirectUrl = window.location.pathname !== '/sign-in' && 
                        !window.location.pathname.startsWith('/sign-in/') 
                        ? window.location.pathname 
                        : '/dashboard';
    
    return (
      <SignIn 
        key={`clerk-sign-in-${i18n.language}`} // Include language in key to force re-mount on language change
        routing="path" 
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl={redirectUrl}
        redirectUrl={redirectUrl}
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
    );
  }, [i18n.language]); // Re-mount when language changes

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
          <span className="authPage__headerText">
            {t('auth.signIn.headerNoAccount')}
          </span>
          <Link to="/sign-up" className="authPage__headerLink">
            {t('auth.signIn.headerCta')}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="authPage__main">
        <div className="authPage__content">
          {/* Headline */}
          <div className="authPage__headline">
            <h1 className="authPage__title">
              {t('auth.signIn.title')}
            </h1>
            <p className="authPage__subtitle">
              {t('auth.signIn.subtitle')}
            </p>
          </div>

          {/* Clerk Sign In Component */}
          <div className="authPage__formWrapper">
            {clerkSignIn}
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

