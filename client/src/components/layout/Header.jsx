import React from 'react';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../Logo';
import LanguageSwitcher from '../LanguageSwitcher';

export default function Header() {
  const location = useLocation();
  const { t } = useTranslation();

  // Check if we're on a page with light background (pricing, etc.)
  const lightPaths = ['/', '/pricing'];
  const isLightPage = lightPaths.includes(location.pathname);
  const headerClass = isLightPage ? 'siteHeader siteHeader--light' : 'siteHeader';

  const marketingLinks = [
    { label: t('header.nav.product'), to: '/#product' },
    { label: t('header.nav.howItWorks'), to: '/#how-it-works' },
    { label: t('header.nav.pricing'), to: '/pricing' },
    { label: t('header.nav.forTeams'), to: '/contact-teams' }
  ];

  const isActiveLink = (to) => {
    if (to === '/pricing') {
      return location.pathname === '/pricing';
    }

    if (to.startsWith('/#')) {
      const targetHash = to.replace('/', '');
      return location.pathname === '/' && location.hash === targetHash;
    }

    return location.pathname === to;
  };

  return (
    <header className={headerClass} role="banner">
      <div className="siteHeader__inner">
        <Link className="brand" to="/" aria-label="BodAI home">
          <Logo size={32} className="brand__logo" />
          <div className="brand__text">
            <span className="brand__name">BodAI</span>
            <span className="brand__tagline">{t('header.brand.tagline')}</span>
          </div>
        </Link>

        <div className="siteHeader__right">
          <nav className="nav" aria-label="Main">
            <SignedIn>
              <Link
                className={`nav__link nav__link--dashboard ${isActiveLink('/dashboard') ? 'nav__link--active' : ''}`}
                to="/dashboard"
              >
                {t('header.nav.dashboard')}
              </Link>
            </SignedIn>
            {marketingLinks.map((link) => (
              <Link
                key={link.to}
                className={`nav__link ${isActiveLink(link.to) ? 'nav__link--active' : ''}`}
                to={link.to}
                aria-current={isActiveLink(link.to) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ctaRow">
            <SignedOut>
              <Link to="/sign-in" className="nav__login">
                  {t('header.nav.login')}
              </Link>
              <Link to="/sign-up" className="btn btn--primary btn--sm">
                  {t('header.nav.getStarted')}
              </Link>
            </SignedOut>
            <SignedIn>
              <LanguageSwitcher />
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}

