import React, { useEffect, useRef, useState } from 'react';
import { Brain, Target, TrendingUp } from 'lucide-react';
import './FeaturesSection.css';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'BodAI doesn’t just watch your videos.\n It reads your body language. From posture and gestures to eye contact, energy, and delivery, you get a clear picture of how you truly come across in interviews, presentations, sales calls, and everyday meetings.',
    color: '#004E64'
  },
  {
    icon: Target,
    title: 'Personalized Coaching for Your Scenario',
    description: 'Whether you’re a founder, team lead, content creator, student, or just want to feel more confident, BodAI adapts to you with personalized guidance on what to change in your body language and delivery.',
    color: '#46B5D1'
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description: 'Track clear scores and trends over time so you can see your communication improving from session to session.Not just hope it is improving.',
    color: '#FF8C64'
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section
      id="product"
      ref={sectionRef}
      className={`featuresSection ${isVisible ? 'featuresSection--visible' : ''}`}
    >
      <div className="featuresSection__container">
        <div className="featuresSection__header">
          <h2 className="featuresSection__title">Why People Practice with BodAI?</h2>
          <p className="featuresSection__subtitle">
          Advanced AI analysis, personalized coaching by goal, and progress you can actually see - so you show up more confident in real‑world moments.
          </p>
        </div>
        <div className="featuresSection__grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`featuresSection__card ${isVisible ? 'featuresSection__card--visible' : ''}`}
                style={{ '--delay': `${index * 0.1}s` }}
              >
                <div className="featuresSection__icon" style={{ '--icon-color': feature.color }}>
                  <Icon size={32} />
                </div>
                <h3 className="featuresSection__cardTitle">{feature.title}</h3>
                <p className="featuresSection__cardDescription">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

