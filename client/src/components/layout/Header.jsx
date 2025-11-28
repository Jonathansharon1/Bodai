import React from 'react';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../Logo';

const marketingLinks = [
  { label: 'Pricing', to: '/pricing' },
  { label: 'Product', to: '/#product' },
  { label: 'Resources', to: '/#resources' },
  { label: 'About', to: '/#about' }
];

export default function Header() {
  const location = useLocation();

  // Check if we're on a page with light background (pricing, etc.)
  const lightPaths = ['/', '/pricing'];
  const isLightPage = lightPaths.includes(location.pathname);
  const headerClass = isLightPage ? 'siteHeader siteHeader--light' : 'siteHeader';

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
        <Link className="brand" to="/" aria-label="Bodai home">
          <Logo size={32} className="brand__logo" />
          <div className="brand__text">
            <span className="brand__name">Bodai</span>
            <span className="brand__tagline">AI communication coach</span>
          </div>
        </Link>

        <div className="siteHeader__right">
          <nav className="nav" aria-label="Main">
            <SignedIn>
              <Link
                className={`nav__link nav__link--dashboard ${isActiveLink('/dashboard') ? 'nav__link--active' : ''}`}
                to="/dashboard"
              >
                Dashboard
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
                  Login
              </Link>
              <Link to="/sign-up" className="btn btn--primary btn--sm">
                  Get Started
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}

