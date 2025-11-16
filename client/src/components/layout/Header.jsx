import React from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Logo from '../Logo';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on a page with light background (pricing, etc.)
  const isLightPage = location.pathname === '/pricing';
  const headerClass = isLightPage ? 'siteHeader siteHeader--light' : 'siteHeader';

  return (
    <header className={headerClass} role="banner">
      <div className="siteHeader__inner">
        <Link className="brand" to="/">
          <Logo size={28} className="brand__logo" />
        </Link>
        <nav className="nav" aria-label="Main">
          <button 
            className="nav__link" 
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
          >
            Home
          </button>
          <SignedIn>
            <button 
              className="nav__link" 
              onClick={() => navigate('/dashboard')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
            >
              Dashboard
            </button>
          </SignedIn>
          <button 
            className="nav__link" 
            onClick={() => navigate('/pricing')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
          >
            Pricing
          </button>
          <button 
            className="nav__link" 
            onClick={() => navigate('/#product')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
          >
            Product
          </button>
          <button 
            className="nav__link" 
            onClick={() => navigate('/#resources')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
          >
            Resources
          </button>
          <button 
            className="nav__link" 
            onClick={() => navigate('/#about')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
          >
            About
          </button>
        </nav>
        <div className="ctaRow">
          <SignedOut>
            <SignInButton mode="modal">
              <a className="nav__login" href="#login">Login</a>
            </SignInButton>
            <SignInButton mode="modal">
              <a className="btn btn--primary" href="#get-started">Get Started</a>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

