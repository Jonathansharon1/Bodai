import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Brain, TrendingUp, ArrowRight } from 'lucide-react';
import './HowItWorksSection.css';

export default function HowItWorksSection() {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const steps = useMemo(() => [
    {
      number: '01',
      icon: Upload,
      title: t('marketing.howItWorks.step1.title'),
      description: t('marketing.howItWorks.step1.description'),
      color: '#004E64'
    },
    {
      number: '02',
      icon: Brain,
      title: t('marketing.howItWorks.step2.title'),
      description: t('marketing.howItWorks.step2.description'),
      color: '#46B5D1'
    },
    {
      number: '03',
      icon: TrendingUp,
      title: t('marketing.howItWorks.step3.title'),
      description: t('marketing.howItWorks.step3.description'),
      color: '#FF8C64'
    }
  ], [t]);

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
      id="how-it-works"
      ref={sectionRef}
      className={`howItWorksSection ${isVisible ? 'howItWorksSection--visible' : ''}`}
    >
      <div className="howItWorksSection__container">
        <div className="howItWorksSection__header">
          <h2 className="howItWorksSection__title">{t('marketing.howItWorks.title')}</h2>
          <p className="howItWorksSection__subtitle">
            {t('marketing.howItWorks.subtitle')}
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

