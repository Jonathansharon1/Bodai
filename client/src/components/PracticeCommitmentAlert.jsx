import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Target } from 'lucide-react';
import './PracticeCommitmentAlert.css';

export default function PracticeCommitmentAlert({ journeyId = null, onDismiss }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Build base URL (use proxy in dev)
        const apiBase = import.meta.env.DEV
          ? '' // use Vite proxy in dev
          : (import.meta.env.VITE_API_URL || 'http://localhost:5000');

        const url = new URL('/api/practice-commitment/status', apiBase || window.location.origin);
        if (journeyId) {
          url.searchParams.set('journeyId', journeyId);
        }

        const res = await fetch(url.toString(), {
          headers: {
            // Backend expects Clerk user ID in header (not bearer token)
            'X-Clerk-User-Id': window.Clerk?.user?.id || window.Clerk?.session?.user?.id || ''
          }
        });

        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        console.error('Failed to fetch practice commitment status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [journeyId]);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (loading || dismissed || !status || !status.isBehind) {
    return null;
  }

  return (
    <div className="practiceCommitmentAlert">
      <div className="practiceCommitmentAlert__icon">
        <AlertCircle size={20} />
      </div>
      <div className="practiceCommitmentAlert__content">
        <div className="practiceCommitmentAlert__title">
          <Target size={16} />
          <span>Stay on Track</span>
        </div>
        <p className="practiceCommitmentAlert__message">{status.message}</p>
        <div className="practiceCommitmentAlert__progress">
          <span className="practiceCommitmentAlert__progressText">
            {status.currentCount} / {status.targetCount} sessions this week
          </span>
          <div className="practiceCommitmentAlert__progressBar">
            <div 
              className="practiceCommitmentAlert__progressFill"
              style={{ width: `${Math.min(100, (status.currentCount / status.targetCount) * 100)}%` }}
            />
          </div>
        </div>
      </div>
      <button 
        className="practiceCommitmentAlert__close"
        onClick={handleDismiss}
        aria-label="Dismiss alert"
      >
        <X size={18} />
      </button>
    </div>
  );
}

