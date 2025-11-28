import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// For React Scripts (create-react-app), use REACT_APP_ prefix
// For Vite, use VITE_ prefix instead
const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Please set REACT_APP_CLERK_PUBLISHABLE_KEY in your .env file');
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

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
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
);

