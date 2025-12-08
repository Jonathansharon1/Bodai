import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Rocket } from 'lucide-react';
import './CTASection.css';

export default function CTASection({ isSignedIn = false }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
            {isSignedIn ? t('marketing.cta.titleSignedIn') : t('marketing.cta.titleNotSignedIn')}
          </h2>
          <p className="ctaSection__subtitle">
            {isSignedIn 
              ? t('marketing.cta.subtitleSignedIn')
              : t('marketing.cta.subtitleNotSignedIn')
            }
          </p>
          {!isSignedIn && (
            <p className="ctaSection__personalCoach" style={{ 
              marginTop: '16px', 
              fontSize: '18px', 
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.95)',
              lineHeight: '1.6',
              maxWidth: '700px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              {t('marketing.cta.personalCoachNote')}
            </p>
          )}
          <div className="ctaSection__actions">
            {isSignedIn ? (
              <>
                <button 
                  className="btn btn--primary ctaSection__button"
                  onClick={() => navigate('/new-analysis')}
                >
                  {t('marketing.cta.ctaSignedIn')}
                  <ArrowRight size={20} />
                </button>
                <button 
                  className="btn btn--ghost ctaSection__button"
                  onClick={() => navigate('/dashboard')}
                >
                  {t('marketing.cta.secondarySignedIn')}
                </button>
              </>
            ) : (
              <>
                <Link to="/sign-up" className="btn btn--primary ctaSection__button">
                  {t('marketing.cta.ctaNotSignedIn')}
                  <ArrowRight size={20} />
                </Link>
                <Link to="/pricing" className="btn btn--ghost ctaSection__button">
                  {t('marketing.cta.secondaryNotSignedIn')}
                </Link>
              </>
            )}
          </div>
          {!isSignedIn && (
            <p className="ctaSection__micro">{t('marketing.cta.micro')}</p>
          )}
        </div>
      </div>
    </section>
  );
}

