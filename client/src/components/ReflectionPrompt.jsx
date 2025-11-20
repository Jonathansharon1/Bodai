import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Sparkles, Smile, Meh, Frown } from 'lucide-react';

const MOOD_OPTIONS = [
  { id: 'energized', label: 'Energized', icon: Sparkles },
  { id: 'calm', label: 'Calm', icon: Smile },
  { id: 'neutral', label: 'Neutral', icon: Meh },
  { id: 'tense', label: 'Tense', icon: Frown }
];

export default function ReflectionPrompt({
  analysisId,
  journeyId,
  onComplete
}) {
  const { user } = useUser();
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingReflection, setExistingReflection] = useState(null);
  const [error, setError] = useState(null);
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const loadExisting = async () => {
      if (!analysisId || !user?.id) return;
      try {
        const res = await fetch(`${apiBase}/api/reflections?analysisId=${analysisId}`, {
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.reflection) {
            setExistingReflection(data.reflection);
            setRating(data.reflection.confidence_rating || 0);
            setMood(data.reflection.mood_label || null);
            setNotes(data.reflection.notes || '');
          }
        }
      } catch (err) {
        console.warn('Failed to load reflection:', err);
      }
    };
    loadExisting();
  }, [analysisId, user?.id, apiBase]);

  const handleSubmit = async () => {
    if (!user?.id || !rating || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/reflections`, {
        method: 'POST',
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confidenceRating: rating,
          mood,
          notes,
          analysisId,
          journeyId
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save reflection');
      }
      const data = await res.json();
      setExistingReflection(data.reflection);
      if (onComplete) {
        onComplete(data.reflection);
      }
    } catch (err) {
      setError(err.message || 'Failed to save reflection');
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || Boolean(existingReflection);

  return (
    <div className="reflectionPrompt">
      <div className="reflectionPrompt__header">
        <Sparkles size={20} />
        <div>
          <h3>How confident did you feel?</h3>
          <p>Track your self-perception against the AI score.</p>
        </div>
      </div>

      <div className="reflectionPrompt__ratings">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`reflectionPrompt__rating ${rating >= value ? 'active' : ''}`}
            onClick={() => !existingReflection && setRating(value)}
            disabled={disabled}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="reflectionPrompt__moods">
        {MOOD_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              className={`reflectionPrompt__mood ${mood === option.id ? 'active' : ''}`}
              onClick={() => !existingReflection && setMood(option.id)}
              disabled={disabled}
            >
              <Icon size={18} />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      <textarea
        className="reflectionPrompt__notes"
        placeholder="Any quick notes about this session?"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={disabled}
      />

      {error && <div className="reflectionPrompt__error">{error}</div>}

      <button
        type="button"
        className="btn btn--primary reflectionPrompt__submit"
        onClick={handleSubmit}
        disabled={disabled || !rating}
      >
        {existingReflection ? 'Reflection saved' : submitting ? 'Saving…' : 'Save reflection'}
      </button>
    </div>
  );
}


