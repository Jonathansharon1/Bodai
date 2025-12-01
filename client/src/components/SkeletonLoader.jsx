import React from 'react';
import './SkeletonLoader.css';

export default function SkeletonLoader({ lines = 3, className = '' }) {
  return (
    <div className={`skeletonLoader ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div 
          key={idx} 
          className="skeletonLoader__line"
          style={{ 
            width: idx === lines - 1 ? '60%' : '100%',
            animationDelay: `${idx * 0.1}s`
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`skeletonCard ${className}`}>
      <div className="skeletonCard__header">
        <div className="skeletonCard__icon"></div>
        <div className="skeletonCard__content">
          <div className="skeletonCard__title"></div>
          <div className="skeletonCard__subtitle"></div>
        </div>
      </div>
      <div className="skeletonCard__body">
        <div className="skeletonCard__line"></div>
        <div className="skeletonCard__line"></div>
        <div className="skeletonCard__line" style={{ width: '70%' }}></div>
      </div>
    </div>
  );
}

