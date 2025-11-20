import React, { useEffect, useRef, useState } from 'react';
import { Brain, Target, TrendingUp, BookOpen } from 'lucide-react';
import './FeaturesSection.css';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Advanced AI analyzes your body language, gestures, and delivery to provide professional insights and actionable feedback.',
    color: '#004E64'
  },
  {
    icon: Target,
    title: 'Personalized Coaching',
    description: 'Get tailored recommendations based on your goals, whether it\'s interviews, presentations, or building confidence.',
    color: '#46B5D1'
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description: 'Track your improvement over time with detailed metrics, charts, and comparisons to see your growth.',
    color: '#FF8C64'
  },
  {
    icon: BookOpen,
    title: 'Structured Courses',
    description: 'Access comprehensive courses designed to help you master communication skills step by step.',
    color: '#004E64'
  }
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
    <section ref={sectionRef} className={`featuresSection ${isVisible ? 'featuresSection--visible' : ''}`}>
      <div className="featuresSection__container">
        <div className="featuresSection__header">
          <h2 className="featuresSection__title">Why Choose BodAI?</h2>
          <p className="featuresSection__subtitle">
            Everything you need to master your body language and communication skills
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

