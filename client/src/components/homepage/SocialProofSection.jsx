import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Zap, Shield, Rocket, Star, Quote, Users, TrendingUp, Award } from 'lucide-react';
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

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Sarah M.',
    role: 'Marketing Manager',
    text: 'I was nervous about my first big presentation. After just 3 sessions with BodAI, I felt so much more confident. My team noticed the difference immediately!',
    improvement: '+2.3 score',
    rating: 5
  },
  {
    id: 2,
    name: 'David L.',
    role: 'Software Engineer',
    text: 'The instant feedback on my body language was eye-opening. I had no idea I was crossing my arms so much. Small changes, big impact.',
    improvement: '+40% confidence',
    rating: 5
  },
  {
    id: 3,
    name: 'Emily R.',
    role: 'Sales Executive',
    text: 'I use BodAI before every important client call. The practice prompts are perfect for quick warm-ups.',
    improvement: '+3.1 presence',
    rating: 5
  }
];

const STATS = [
  { label: 'Active Users', value: '2,500+', icon: Users },
  { label: 'Videos Analyzed', value: '15,000+', icon: TrendingUp },
  { label: 'Avg. Improvement', value: '+28%', icon: Award }
];

export default function SocialProofSection() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

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
  }, []);

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
          <h2 className="socialProofSection__testimonialsTitle">Real Results from Real People</h2>
          
          <div className="socialProofSection__carousel">
            <div 
              className="socialProofSection__track"
              style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
            >
              {TESTIMONIALS.map((testimonial) => (
                <div key={testimonial.id} className="socialProofSection__testimonialCard">
                  <Quote size={28} className="socialProofSection__quoteIcon" />
                  
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
