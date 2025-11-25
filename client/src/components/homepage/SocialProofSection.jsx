import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Zap, Shield, Rocket } from 'lucide-react';
import './SocialProofSection.css';

const highlights = [
  {
    icon: Sparkles,
    title: 'AI-Powered Precision',
    description: 'Cutting-edge AI analyzes 25+ communication parameters in real-time, giving you insights that would take hours with a human coach.',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)'
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    description: 'Get detailed analysis within seconds. No waiting, no scheduling—just upload and improve immediately.',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)'
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your videos are analyzed securely. We use enterprise-grade encryption and never share your data.',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
  },
  {
    icon: Rocket,
    title: 'Continuous Improvement',
    description: 'Track your progress across every session. See exactly how you\'re improving with detailed metrics and trends.',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
  }
];

export default function SocialProofSection() {
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
    <section ref={sectionRef} className={`socialProofSection ${isVisible ? 'socialProofSection--visible' : ''}`}>
      <div className="socialProofSection__container">
        <div className="socialProofSection__header">
          <h2 className="socialProofSection__title">
            Built for Professionals Who Demand Excellence
          </h2>
          <p className="socialProofSection__subtitle">
            Experience the future of communication coaching—powered by advanced AI, designed for real results.
          </p>
        </div>

        <div className="socialProofSection__grid">
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <div
                key={index}
                className={`socialProofSection__card ${isVisible ? 'socialProofSection__card--visible' : ''}`}
                style={{ 
                  '--delay': `${index * 0.1}s`,
                  '--gradient': highlight.gradient
                }}
              >
                <div className="socialProofSection__cardGlow" />
                <div className="socialProofSection__iconWrapper">
                  <div className="socialProofSection__iconBg" />
                  <Icon size={28} className="socialProofSection__icon" />
                </div>
                <h3 className="socialProofSection__cardTitle">{highlight.title}</h3>
                <p className="socialProofSection__cardDescription">{highlight.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
