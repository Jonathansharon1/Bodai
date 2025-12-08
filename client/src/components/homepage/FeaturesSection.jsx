import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Target, TrendingUp } from 'lucide-react';
import './FeaturesSection.css';

export default function FeaturesSection() {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const features = useMemo(() => [
    {
      icon: Brain,
      title: t('marketing.features.personalCoach.title'),
      description: t('marketing.features.personalCoach.description'),
      color: '#004E64'
    },
    {
      icon: Target,
      title: t('marketing.features.aiAnalysis.title'),
      description: t('marketing.features.aiAnalysis.description'),
      color: '#46B5D1'
    },
    {
      icon: TrendingUp,
      title: t('marketing.features.personalized.title'),
      description: t('marketing.features.personalized.description'),
      color: '#FF8C64'
    },
    {
      icon: TrendingUp,
      title: t('marketing.features.progress.title'),
      description: t('marketing.features.progress.description'),
      color: '#8B5CF6'
    },
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
      id="product"
      ref={sectionRef}
      className={`featuresSection ${isVisible ? 'featuresSection--visible' : ''}`}
    >
      <div className="featuresSection__container">
        <div className="featuresSection__header">
          <h2 className="featuresSection__title">{t('marketing.features.title')}</h2>
          <p className="featuresSection__subtitle">
            {t('marketing.features.subtitle')}
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

