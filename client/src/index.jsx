import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary';

// Initialize Sentry for frontend
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Clear Clerk redirect URLs BEFORE anything else runs
// This must happen before ClerkProvider initializes
(function clearClerkRedirectsImmediately() {
  try {
    const pathname = window.location.pathname;
    const isAuthPage = pathname === '/sign-in' || 
                       pathname === '/sign-up' || 
                       pathname.startsWith('/sign-in/') || 
                       pathname.startsWith('/sign-up/');
    
    if (!isAuthPage) {
      console.log('[index.js] Clearing Clerk redirect URLs for pathname:', pathname);
      
      // Clear from sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('clerk') && 
            (lowerKey.includes('redirect') || 
             lowerKey.includes('aftersign') ||
             lowerKey.includes('signin') ||
             lowerKey.includes('signup'))) {
          console.log('[index.js] Removing Clerk redirect key from sessionStorage:', key);
          sessionStorage.removeItem(key);
        }
      });
      
      // Clear from localStorage
      Object.keys(localStorage).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('clerk') && 
            (lowerKey.includes('redirect') || lowerKey.includes('aftersign'))) {
          console.log('[index.js] Removing Clerk redirect key from localStorage:', key);
          localStorage.removeItem(key);
        }
      });
      
      // Clear from URL params
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('__clerk_redirect_url') || urlParams.has('redirect_url')) {
        console.log('[index.js] Found redirect URL in params, clearing it');
        urlParams.delete('__clerk_redirect_url');
        urlParams.delete('redirect_url');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }
    }
  } catch (e) {
    console.error('[index.js] Error clearing Clerk redirects:', e);
  }
})();

// For Vite, use VITE_ prefix for environment variables
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file');
}

// Custom Clerk appearance to match BodAI design system
const clerkAppearance = {
  variables: {
    // Colors
    colorPrimary: '#2563EB',
    colorTextOnPrimaryBackground: '#FFFFFF',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#F8FAFC',
    colorInputText: '#0F172A',
    colorText: '#0F172A',
    colorTextSecondary: '#64748B',
    colorDanger: '#EF4444',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    
    // Typography
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyButtons: "'Inter', system-ui, sans-serif",
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    
    // Sizing & Spacing
    borderRadius: '12px',
    spacingUnit: '16px',
    
    // Shadows
    shadowShimmer: '0 0 20px rgba(37, 99, 235, 0.1)',
  },
  elements: {
    // Root & Card
    rootBox: {
      fontFamily: "'Inter', system-ui, sans-serif",
    },
    card: {
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)',
      borderRadius: '20px',
      border: '1px solid #E2E8F0',
    },
    
    // Header
    headerTitle: {
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      fontWeight: 700,
      fontSize: '24px',
      color: '#0F172A',
    },
    headerSubtitle: {
      color: '#64748B',
      fontSize: '15px',
    },
    
    // Social Buttons
    socialButtonsBlockButton: {
      borderRadius: '10px',
      border: '1px solid #E2E8F0',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: '#F8FAFC',
        borderColor: '#CBD5E1',
      },
    },
    socialButtonsBlockButtonText: {
      fontWeight: 500,
      color: '#0F172A',
    },
    
    // Divider
    dividerLine: {
      backgroundColor: '#E2E8F0',
    },
    dividerText: {
      color: '#94A3B8',
      fontSize: '13px',
    },
    
    // Form Fields
    formFieldLabel: {
      fontWeight: 500,
      color: '#334155',
      fontSize: '14px',
      marginBottom: '6px',
    },
    formFieldInput: {
      borderRadius: '10px',
      border: '1px solid #E2E8F0',
      padding: '12px 14px',
      fontSize: '15px',
      transition: 'all 0.2s ease',
      '&:focus': {
        borderColor: '#2563EB',
        boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
      },
    },
    
    // Primary Button
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      borderRadius: '10px',
      padding: '12px 20px',
      fontWeight: 600,
      fontSize: '15px',
      textTransform: 'none',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
      transition: 'all 0.2s ease',
      '&:hover': {
        background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
        boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)',
        transform: 'translateY(-1px)',
      },
    },
    
    // Footer Links
    footerActionLink: {
      color: '#2563EB',
      fontWeight: 500,
      '&:hover': {
        color: '#1D4ED8',
      },
    },
    footerActionText: {
      color: '#64748B',
    },
    
    // Identity Preview
    identityPreviewText: {
      color: '#0F172A',
    },
    identityPreviewEditButton: {
      color: '#2563EB',
    },
    
    // Alerts
    alert: {
      borderRadius: '10px',
    },
    alertText: {
      color: '#0F172A',
    },
    
    // User Button
    userButtonBox: {
      borderRadius: '10px',
    },
    userButtonTrigger: {
      borderRadius: '10px',
    },
    userButtonPopoverCard: {
      borderRadius: '14px',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
    },
    userButtonPopoverActionButton: {
      borderRadius: '8px',
    },
    
    // Modal Backdrop
    modalBackdrop: {
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
    },
  },
  layout: {
    socialButtonsPlacement: 'top',
    socialButtonsVariant: 'blockButton',
    showOptionalFields: false,
    helpPageUrl: 'mailto:support@bodai.com',
    privacyPageUrl: '/privacy',
    termsPageUrl: '/terms',
  },
};

// Clear Clerk redirect URLs IMMEDIATELY on page load, before React renders
// This prevents Clerk from redirecting when refreshing pages
(function clearClerkRedirects() {
  try {
    // Only clear if we're NOT on sign-in/sign-up pages
    const pathname = window.location.pathname;
    const isAuthPage = pathname === '/sign-in' || 
                       pathname === '/sign-up' || 
                       pathname.startsWith('/sign-in/') || 
                       pathname.startsWith('/sign-up/');
    
    if (!isAuthPage) {
      // Clear from sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('clerk') && 
            (lowerKey.includes('redirect') || 
             lowerKey.includes('aftersign') ||
             lowerKey.includes('signin') ||
             lowerKey.includes('signup'))) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Clear from localStorage
      Object.keys(localStorage).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('clerk') && 
            (lowerKey.includes('redirect') || 
             lowerKey.includes('aftersign'))) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear from URL params
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('__clerk_redirect_url') || urlParams.has('redirect_url')) {
        urlParams.delete('__clerk_redirect_url');
        urlParams.delete('redirect_url');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }
    }
  } catch (e) {
    // Ignore errors
  }
})();

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <ErrorBoundary>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      afterSignInUrl="/"
      appearance={clerkAppearance}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </ErrorBoundary>
);

