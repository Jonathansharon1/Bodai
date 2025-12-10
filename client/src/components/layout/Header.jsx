import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import Logo from '../Logo';
import LanguageSwitcher from '../LanguageSwitcher';

export default function Header() {
  const location = useLocation();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={headerClass} role="banner">
      <div className="siteHeader__inner">
        <div className="siteHeader__left">
        <Link className="brand" to="/" aria-label="BodAI home">
          <Logo size={32} className="brand__logo" />
          <div className="brand__text">
            <span className="brand__name">BodAI</span>
            <span className="brand__tagline">{t('header.brand.tagline')}</span>
          </div>
        </Link>
        </div>

        <button 
          className="siteHeader__mobileToggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

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

        <div className="siteHeader__right">
          <div className="siteHeader__languageSection">
            <LanguageSwitcher />
          </div>

          <div className="siteHeader__divider" />

          <div className="siteHeader__authSection">
            <SignedOut>
              <Link to="/sign-up" className="btn btn--primary btn--sm">
                  {t('header.nav.getStarted')}
              </Link>
              <Link to="/sign-in" className="nav__login">
                  {t('header.nav.login')}
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Rendered via Portal to avoid header constraints */}
      {isMobileMenuOpen && createPortal(
        <>
          <div 
            className="siteHeader__mobileOverlay" 
            onClick={toggleMobileMenu}
            aria-hidden="true"
          />
          <div className="siteHeader__mobileMenu">
            <nav className="siteHeader__mobileNav" aria-label="Mobile navigation">
              <SignedIn>
                <Link
                  className={`siteHeader__mobileLink ${isActiveLink('/dashboard') ? 'siteHeader__mobileLink--active' : ''}`}
                  to="/dashboard"
                  onClick={handleLinkClick}
                >
                  {t('header.nav.dashboard')}
                </Link>
              </SignedIn>
              {marketingLinks.map((link) => (
                <Link
                  key={link.to}
                  className={`siteHeader__mobileLink ${isActiveLink(link.to) ? 'siteHeader__mobileLink--active' : ''}`}
                  to={link.to}
                  onClick={handleLinkClick}
                  aria-current={isActiveLink(link.to) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            
            <div className="siteHeader__mobileAuth">
              <div className="siteHeader__mobileLanguage">
                <LanguageSwitcher />
              </div>
              <SignedOut>
                <Link to="/sign-up" className="btn btn--primary" onClick={handleLinkClick}>
                  {t('header.nav.getStarted')}
                </Link>
                <Link to="/sign-in" className="btn btn--ghost" onClick={handleLinkClick}>
                  {t('header.nav.login')}
                </Link>
              </SignedOut>
              <SignedIn>
                <div className="siteHeader__mobileUserButton">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
}

