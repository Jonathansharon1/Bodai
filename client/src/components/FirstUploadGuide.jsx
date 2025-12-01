import React, { useState } from 'react';
import { X, Video, Sun, Timer, Eye, Lightbulb, CheckCircle } from 'lucide-react';
import { getPromptsForGoal } from '../config/recordingPrompts';
import './FirstUploadGuide.css';

const RECORDING_TIPS = [
  {
    icon: Video,
    title: 'Framing',
    description: 'Frame yourself from mid-torso up so posture and hand movement stay in view.'
  },
  {
    icon: Sun,
    title: 'Lighting',
    description: 'Face soft, even light and avoid backlighting so your expressions stay clear.'
  },
  {
    icon: Timer,
    title: 'Duration',
    description: 'Aim for 30 seconds to 2 minutes to spotlight one story or message with full energy.'
  },
  {
    icon: Eye,
    title: 'Eye Level',
    description: 'Place the camera at eye level to instantly boost presence and connection.'
  }
];

export default function FirstUploadGuide({ isOpen, onClose, userGoal = null }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('bodai_first_upload_guide_seen', 'true');
    }
    onClose();
  };

  const prompts = userGoal ? getPromptsForGoal(userGoal) : [];
  const samplePrompts = prompts.slice(0, 2);

  return (
    <div className="firstUploadGuide__overlay" onClick={handleClose}>
      <div className="firstUploadGuide__modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="firstUploadGuide__close"
          onClick={handleClose}
          aria-label="Close guide"
        >
          <X size={20} />
        </button>

        <div className="firstUploadGuide__header">
          <Lightbulb size={32} className="firstUploadGuide__icon" />
          <h2 className="firstUploadGuide__title">First Time Recording?</h2>
          <p className="firstUploadGuide__subtitle">Here's everything you need to know</p>
        </div>

        <div className="firstUploadGuide__content">
          {/* What Should I Record? */}
          <section className="firstUploadGuide__section">
            <h3 className="firstUploadGuide__sectionTitle">What should I record?</h3>
            <p className="firstUploadGuide__sectionText">
              Record yourself speaking naturally about anything. You can talk about:
            </p>
            <ul className="firstUploadGuide__list">
              <li>A topic you're passionate about</li>
              <li>A recent experience or story</li>
              <li>Something you want to explain</li>
              <li>Or use one of our practice prompts below</li>
            </ul>
            {samplePrompts.length > 0 && (
              <div className="firstUploadGuide__prompts">
                <p className="firstUploadGuide__promptsTitle">Sample prompts for your goal:</p>
                {samplePrompts.map((prompt) => (
                  <div key={prompt.id} className="firstUploadGuide__prompt">
                    <CheckCircle size={16} className="firstUploadGuide__promptIcon" />
                    <div>
                      <strong>{prompt.title}</strong>
                      <p>{prompt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* How Long? */}
          <section className="firstUploadGuide__section">
            <h3 className="firstUploadGuide__sectionTitle">How long should it be?</h3>
            <p className="firstUploadGuide__sectionText">
              Aim for <strong>30 seconds to 2 minutes</strong>. This gives our AI enough content 
              to analyze while keeping it manageable for you.
            </p>
          </section>

          {/* Tips for Best Results */}
          <section className="firstUploadGuide__section">
            <h3 className="firstUploadGuide__sectionTitle">Tips for best results</h3>
            <div className="firstUploadGuide__tips">
              {RECORDING_TIPS.map((tip, idx) => {
                const Icon = tip.icon;
                return (
                  <div key={idx} className="firstUploadGuide__tip">
                    <div className="firstUploadGuide__tipIcon">
                      <Icon size={20} />
                    </div>
                    <div className="firstUploadGuide__tipContent">
                      <strong>{tip.title}</strong>
                      <p>{tip.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="firstUploadGuide__footer">
          <label className="firstUploadGuide__checkbox">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>Don't show this again</span>
          </label>
          <button className="btn btn--primary firstUploadGuide__cta" onClick={handleClose}>
            Got it, let me record
          </button>
        </div>
      </div>
    </div>
  );
}

