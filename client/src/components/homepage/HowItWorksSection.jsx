import React, { useEffect, useRef, useState } from 'react';
import { Upload, Brain, TrendingUp, ArrowRight } from 'lucide-react';
import './HowItWorksSection.css';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Your Video',
    description: 'Record or upload a short video of yourself speaking. Our AI works with videos from 20 seconds to 5 minutes.',
    color: '#004E64'
  },
  {
    number: '02',
    icon: Brain,
    title: 'AI Analysis',
    description: 'Our advanced AI analyzes your body language, gestures, eye contact, posture, and vocal delivery in real-time.',
    color: '#46B5D1'
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Get Feedback & Improve',
    description: 'Receive detailed insights, personalized action items, and track your progress over time to see your improvement.',
    color: '#FF8C64'
  }
];

export default function HowItWorksSection() {
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
    <section ref={sectionRef} className={`howItWorksSection ${isVisible ? 'howItWorksSection--visible' : ''}`}>
      <div className="howItWorksSection__container">
        <div className="howItWorksSection__header">
          <h2 className="howItWorksSection__title">How It Works</h2>
          <p className="howItWorksSection__subtitle">
            Get professional body language analysis in three simple steps
          </p>
        </div>
        <div className="howItWorksSection__steps">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;
            return (
              <React.Fragment key={index}>
                <div
                  className={`howItWorksSection__step ${isVisible ? 'howItWorksSection__step--visible' : ''}`}
                  style={{ '--delay': `${index * 0.15}s` }}
                >
                  <div className="howItWorksSection__stepNumber">{step.number}</div>
                  <div className="howItWorksSection__stepIcon" style={{ '--icon-color': step.color }}>
                    <Icon size={40} />
                  </div>
                  <h3 className="howItWorksSection__stepTitle">{step.title}</h3>
                  <p className="howItWorksSection__stepDescription">{step.description}</p>
                </div>
                {!isLast && (
                  <div className={`howItWorksSection__arrow ${isVisible ? 'howItWorksSection__arrow--visible' : ''}`}>
                    <ArrowRight size={32} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

