import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Rocket } from 'lucide-react';
import './CTASection.css';

export default function CTASection({ isSignedIn = false }) {
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
            <Rocket size={48} />
          </div>
          <h2 className="ctaSection__title">
            {isSignedIn ? "Ready for Your Next Practice Session?" : "Ready to Transform Your Communication?"}
          </h2>
          <p className="ctaSection__subtitle">
            {isSignedIn 
              ? "Keep improving your communication skills. Upload a new video analysis or check your progress."
              : "Join hundreds of users who are already improving their body language and communication skills with BodAI."
            }
          </p>
          <div className="ctaSection__actions">
            {isSignedIn ? (
              <>
                <button 
                  className="btn btn--primary ctaSection__button"
                  onClick={() => navigate('/new-analysis')}
                >
                  Start New Analysis
                  <ArrowRight size={20} />
                </button>
                <button 
                  className="btn btn--ghost ctaSection__button"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </button>
              </>
            ) : (
              <>
                <Link to="/sign-up" className="btn btn--primary ctaSection__button">
                  Get Started Free
                  <ArrowRight size={20} />
                </Link>
                <Link to="/pricing" className="btn btn--ghost ctaSection__button">
                  View Pricing
                </Link>
              </>
            )}
          </div>
          {!isSignedIn && (
            <p className="ctaSection__micro">No credit card required • Cancel anytime</p>
          )}
        </div>
      </div>
    </section>
  );
}

