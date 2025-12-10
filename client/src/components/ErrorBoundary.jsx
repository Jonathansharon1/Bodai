import React from 'react';
import * as Sentry from '@sentry/react';

// Custom fallback UI for Sentry ErrorBoundary
const FallbackComponent = ({ error, resetError }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    textAlign: 'center'
  }}>
    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>
      Something went wrong
    </h1>
    <p style={{ fontSize: '1.125rem', color: '#64748b', marginBottom: '2rem' }}>
      We're sorry for the inconvenience. The error has been logged and we'll look into it.
    </p>
    <button
      onClick={() => {
        resetError();
        window.location.href = '/';
      }}
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 500
      }}
    >
      Go to Homepage
    </button>
    {import.meta.env.DEV && error && (
      <details style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '600px' }}>
        <summary style={{ cursor: 'pointer', color: '#64748b' }}>Error Details (Development)</summary>
        <pre style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f1f5f9',
          borderRadius: '0.5rem',
          overflow: 'auto',
          fontSize: '0.875rem'
        }}>
          {error.toString()}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      </details>
    )}
  </div>
);

// Use Sentry's ErrorBoundary component
const ErrorBoundary = ({ children }) => {
  return (
    <Sentry.ErrorBoundary fallback={FallbackComponent} showDialog={false}>
      {children}
    </Sentry.ErrorBoundary>
  );
};

export default ErrorBoundary;

