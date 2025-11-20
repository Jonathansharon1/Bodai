import React, { useEffect, useRef, useState } from 'react';
import { Shield, Lock, CheckCircle, Award } from 'lucide-react';
import './TrustSection.css';

const trustItems = [
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your videos are encrypted and stored securely. We never share your data with third parties.',
    color: '#004E64'
  },
  {
    icon: Lock,
    title: 'GDPR Compliant',
    description: 'We follow strict data protection regulations to ensure your privacy and security.',
    color: '#46B5D1'
  },
  {
    icon: CheckCircle,
    title: 'Money-Back Guarantee',
    description: 'Not satisfied? Get a full refund within 30 days, no questions asked.',
    color: '#FF8C64'
  },
  {
    icon: Award,
    title: 'Professional Grade',
    description: 'Used by professionals, coaches, and individuals serious about improving their communication.',
    color: '#004E64'
  }
];

export default function TrustSection() {
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
    <section ref={sectionRef} className={`trustSection ${isVisible ? 'trustSection--visible' : ''}`}>
      <div className="trustSection__container">
        <div className="trustSection__header">
          <h2 className="trustSection__title">Trusted & Secure</h2>
          <p className="trustSection__subtitle">
            Your privacy and security are our top priorities
          </p>
        </div>
        <div className="trustSection__grid">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`trustSection__card ${isVisible ? 'trustSection__card--visible' : ''}`}
                style={{ '--delay': `${index * 0.1}s` }}
              >
                <div className="trustSection__icon" style={{ '--icon-color': item.color }}>
                  <Icon size={28} />
                </div>
                <h3 className="trustSection__cardTitle">{item.title}</h3>
                <p className="trustSection__cardDescription">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

