import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton } from '@clerk/clerk-react';
import { ArrowRight, Sparkles } from 'lucide-react';
import './CTASection.css';

export default function CTASection() {
  const navigate = useNavigate();
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
    <section ref={sectionRef} className={`ctaSection ${isVisible ? 'ctaSection--visible' : ''}`}>
      <div className="ctaSection__container">
        <div className="ctaSection__content">
          <div className="ctaSection__icon">
            <Sparkles size={48} />
          </div>
          <h2 className="ctaSection__title">Ready to Transform Your Communication?</h2>
          <p className="ctaSection__subtitle">
            Join thousands of users who are already improving their body language and communication skills with BodAI.
          </p>
          <div className="ctaSection__actions">
            <SignInButton mode="modal">
              <button className="btn btn--primary ctaSection__button">
                Get Started Free
                <ArrowRight size={20} />
              </button>
            </SignInButton>
            <button 
              className="btn btn--ghost ctaSection__button"
              onClick={() => navigate('/pricing')}
            >
              View Pricing
            </button>
          </div>
          <p className="ctaSection__micro">No credit card required • Cancel anytime</p>
        </div>
      </div>
    </section>
  );
}

