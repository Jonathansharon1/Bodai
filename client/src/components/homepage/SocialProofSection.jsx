import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Zap, Shield, Rocket, Star, ChevronLeft, ChevronRight, Users, TrendingUp, Award } from 'lucide-react';
import './SocialProofSection.css';

export default function SocialProofSection() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const isRTL = i18n.dir() === 'rtl';

  const highlights = useMemo(() => [
    {
      icon: Sparkles,
      title: t('marketing.socialProof.aiPrecision.title'),
      description: t('marketing.socialProof.aiPrecision.description'),
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)'
    },
    {
      icon: Zap,
      title: t('marketing.socialProof.instantFeedback.title'),
      description: t('marketing.socialProof.instantFeedback.description'),
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)'
    },
    {
      icon: Shield,
      title: t('marketing.socialProof.privacy.title'),
      description: t('marketing.socialProof.privacy.description'),
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    },
    {
      icon: Rocket,
      title: t('marketing.socialProof.improvement.title'),
      description: t('marketing.socialProof.improvement.description'),
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
    }
  ], [t]);

  const TESTIMONIALS = useMemo(() => [
    {
      id: 1,
      name: 'Sarah M.',
      role: t('marketing.socialProof.testimonials.sarah.role'),
      text: t('marketing.socialProof.testimonials.sarah.text'),
      improvement: t('marketing.socialProof.testimonials.sarah.improvement'),
      rating: 5
    },
    {
      id: 2,
      name: 'David L.',
      role: t('marketing.socialProof.testimonials.david.role'),
      text: t('marketing.socialProof.testimonials.david.text'),
      improvement: t('marketing.socialProof.testimonials.david.improvement'),
      rating: 5
    },
    {
      id: 3,
      name: 'Emily R.',
      role: t('marketing.socialProof.testimonials.emily.role'),
      text: t('marketing.socialProof.testimonials.emily.text'),
      improvement: t('marketing.socialProof.testimonials.emily.improvement'),
      rating: 5
    },
    {
      id: 4,
      name: t('marketing.socialProof.testimonials.jonathan.name', { defaultValue: 'Yonatan Sharon' }),
      role: t('marketing.socialProof.testimonials.jonathan.role'),
      text: t('marketing.socialProof.testimonials.jonathan.text'),
      improvement: t('marketing.socialProof.testimonials.jonathan.improvement'),
      rating: 5
    }
  ], [t]);

  const STATS = useMemo(() => [
    { label: t('marketing.socialProof.stats.activeUsers'), value: '500+', icon: Users },
    { label: t('marketing.socialProof.stats.videosAnalyzed'), value: '2000+', icon: TrendingUp },
    { label: t('marketing.socialProof.stats.avgImprovement'), value: '+58%', icon: Award }
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

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [TESTIMONIALS.length]);

  const goToPrevious = () => {
    setActiveTestimonial((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const goToNext = () => {
    setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  return (
    <section ref={sectionRef} className={`socialProofSection ${isVisible ? 'socialProofSection--visible' : ''}`}>
      <div className="socialProofSection__container">
        {/* Stats Banner */}
        <div className={`socialProofSection__stats ${isVisible ? 'socialProofSection__stats--visible' : ''}`}>
          {STATS.map((stat, idx) => (
            <div key={idx} className="socialProofSection__stat">
              <stat.icon size={24} className="socialProofSection__statIcon" />
              <div className="socialProofSection__statContent">
                <span className="socialProofSection__statValue">{stat.value}</span>
                <span className="socialProofSection__statLabel">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className={`socialProofSection__testimonials ${isVisible ? 'socialProofSection__testimonials--visible' : ''}`}>
          <h2 className="socialProofSection__testimonialsTitle">{t('marketing.socialProof.testimonialsTitle')}</h2>
          
          <div className="socialProofSection__carouselContainer">
            <button 
              className="socialProofSection__arrow socialProofSection__arrow--prev"
              onClick={goToPrevious}
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={24} />
            </button>
          
          <div className="socialProofSection__carousel">
            <div 
              className="socialProofSection__track"
              style={{ transform: `translateX(${(isRTL ? 1 : -1) * activeTestimonial * 100}%)` }}
            >
              {TESTIMONIALS.map((testimonial) => (
                <div key={testimonial.id} className="socialProofSection__testimonialCard">
                  <p className="socialProofSection__testimonialText">
                    "{testimonial.text}"
                  </p>
                  
                  <div className="socialProofSection__testimonialMeta">
                    <div className="socialProofSection__testimonialAuthor">
                      <div className="socialProofSection__avatar">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div className="socialProofSection__authorInfo">
                        <span className="socialProofSection__authorName">{testimonial.name}</span>
                        <span className="socialProofSection__authorRole">{testimonial.role}</span>
                      </div>
                    </div>
                    
                    <div className="socialProofSection__testimonialResult">
                      <div className="socialProofSection__rating">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
                        ))}
                      </div>
                      <span className="socialProofSection__improvement">
                        {testimonial.improvement}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
            
            <button 
              className="socialProofSection__arrow socialProofSection__arrow--next"
              onClick={goToNext}
              aria-label="Next testimonial"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          
          {/* Dots Navigation */}
          <div className="socialProofSection__dots">
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                className={`socialProofSection__dot ${idx === activeTestimonial ? 'active' : ''}`}
                onClick={() => setActiveTestimonial(idx)}
                aria-label={`View testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="socialProofSection__header">
          <h2 className="socialProofSection__title">
            {t('marketing.socialProof.highlightsTitle')}
          </h2>
          <p className="socialProofSection__subtitle">
            {t('marketing.socialProof.highlightsSubtitle')}
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
