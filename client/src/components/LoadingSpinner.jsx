import React from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'medium',
  fullPage = false 
}) {
  const sizeClass = `loadingSpinner--${size}`;
  
  if (fullPage) {
    return (
      <div className="loadingSpinner__fullPage">
        <div className="loadingSpinner__bg">
          <div className="loadingSpinner__bgGradient" />
          <div className="loadingSpinner__bgOrb loadingSpinner__bgOrb--1" />
          <div className="loadingSpinner__bgOrb loadingSpinner__bgOrb--2" />
        </div>
        <div className="loadingSpinner__content">
          <div className={`loadingSpinner ${sizeClass}`}>
            <div className="loadingSpinner__ring">
              <div className="loadingSpinner__ringInner" />
            </div>
          </div>
          {message && <p className="loadingSpinner__message">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loadingSpinner__wrapper">
      <div className={`loadingSpinner ${sizeClass}`}>
        <div className="loadingSpinner__ring">
          <div className="loadingSpinner__ringInner" />
        </div>
      </div>
      {message && <p className="loadingSpinner__message">{message}</p>}
    </div>
  );
}

