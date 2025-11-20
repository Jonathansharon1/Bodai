import React, { useEffect, useRef, useState } from 'react';
import { Users, TrendingUp, Star, Quote } from 'lucide-react';
import './SocialProofSection.css';

const stats = [
  {
    icon: Users,
    value: 10000,
    suffix: '+',
    label: 'Users improved their communication',
    color: '#004E64'
  },
  {
    icon: TrendingUp,
    value: 85,
    suffix: '%',
    label: 'Report improvement within a week',
    color: '#46B5D1'
  },
  {
    icon: Star,
    value: 4.8,
    suffix: '/5',
    label: 'Average rating',
    color: '#FF8C64'
  }
];

const testimonials = [
  {
    quote: 'BodAI helped me land my dream job. The feedback on my interview practice was incredibly detailed and actionable.',
    author: 'Sarah M.',
    role: 'Software Engineer'
  },
  {
    quote: 'I\'ve seen a huge improvement in my presentation skills. The progress tracking feature keeps me motivated.',
    author: 'Michael R.',
    role: 'Marketing Director'
  },
  {
    quote: 'The personalized courses are exactly what I needed. My confidence has grown significantly in just a few weeks.',
    author: 'Emily T.',
    role: 'Business Consultant'
  }
];

function AnimatedCounter({ end, suffix, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && countRef.current) {
          const startTime = Date.now();
          const startValue = 0;
          const endValue = typeof end === 'number' ? end : parseFloat(end);

          const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (endValue - startValue) * easeOutQuart;
            
            setCount(currentValue);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(endValue);
            }
          };

          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => {
      if (countRef.current) {
        observer.disconnect();
      }
    };
  }, [end, duration]);

  const formatNumber = (num) => {
    if (typeof num === 'number') {
      if (num >= 1000) {
        return Math.floor(num).toLocaleString();
      }
      return num.toFixed(num % 1 !== 0 ? 1 : 0);
    }
    return num;
  };

  return (
    <span ref={countRef}>
      {formatNumber(count)}{suffix}
    </span>
  );
}

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
        <div className="socialProofSection__stats">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`socialProofSection__stat ${isVisible ? 'socialProofSection__stat--visible' : ''}`}
                style={{ '--delay': `${index * 0.1}s` }}
              >
                <div className="socialProofSection__statIcon" style={{ '--icon-color': stat.color }}>
                  <Icon size={32} />
                </div>
                <div className="socialProofSection__statValue">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="socialProofSection__statLabel">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="socialProofSection__testimonials">
          <div className="socialProofSection__testimonialsHeader">
            <Quote size={48} className="socialProofSection__quoteIcon" />
            <h2 className="socialProofSection__testimonialsTitle">What Our Users Say</h2>
          </div>
          <div className="socialProofSection__testimonialsGrid">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`socialProofSection__testimonial ${isVisible ? 'socialProofSection__testimonial--visible' : ''}`}
                style={{ '--delay': `${0.3 + index * 0.1}s` }}
              >
                <Quote size={24} className="socialProofSection__testimonialQuote" />
                <p className="socialProofSection__testimonialText">{testimonial.quote}</p>
                <div className="socialProofSection__testimonialAuthor">
                  <strong>{testimonial.author}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

