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

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY} 
    afterSignOutUrl="/"
    afterSignInUrl="/"
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ClerkProvider>
);

