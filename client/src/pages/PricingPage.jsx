import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Check, ChevronDown } from 'lucide-react';
import PricingCard from '../components/pricing/PricingCard';
import './PricingPage.css';



const faqs = [
  {
    question: 'What happens after I upload a video?',
    answer: [
      'Our AI analyzes your body language, voice, and delivery within a minute.',
      'You get a detailed report with your scores and personalized tips.',
      'We suggest a quick practice exercise to help you improve.'
    ]
  },
  {
    question: 'Can I change or cancel my plan?',
    answer:
      'Yes! You can upgrade, downgrade, or cancel anytime. All your past analyses stay in your account so you can always come back.'
  },
  {
    question: 'Can I track multiple goals?',
    answer:
      'Yes, all plans let you create separate practice areas—like interview prep, public speaking, or social skills—and track progress for each one.'
  },
  {
    question: 'Do you offer team plans?',
    answer:
      'Yes! The Unlimited plan works great for teams. Contact us for special team pricing and setup help.'
  }
];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Lightweight analytics hook – replace with real tracking later
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.log('[PricingPage] Viewed', { billingPeriod: 'monthly' });
    } catch {
      // ignore
    }
  }, []);

  const sharedFeatures = [
    'AI-powered video analysis',
    'Detailed feedback on body language & voice',
    'Progress tracking dashboard',
    'Personalized improvement tips',
    'Practice exercises included',
    'Email support'
  ];

  // Self-serve plans: pricing is based on analyses per month and max video length
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      priceYearly: 0,
      period: 'forever',
      analysesText: '1 analysis / month · up to 10 min per video',
      analysesPerMonth: '1 analysis / month',
      durationText: 'Up to 10 min per video',
      theme: 'slate',
      cta: 'Start Free',
      ctaVariant: 'secondary',
      recommended: false
    },
    {
      id: 'starter',
      name: 'Basic',
      price: 12,
      priceYearly: 120,
      period: 'per month',
      analysesText: '8 analyses / month · up to 10 min per video',
      analysesPerMonth: '8 analyses / month',
      durationText: 'Up to 10 min per video',
      theme: 'teal',
      cta: 'Get Basic',
      ctaVariant: 'primary',
      recommended: false,
      valueText: 'Great for 1–2 sessions per week',
      badgeText: 'Good start'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 24,
      priceYearly: 240,
      period: 'per month',
      analysesText: '20 analyses / month · up to 30 min per video',
      analysesPerMonth: '20 analyses / month',
      durationText: 'Up to 30 min per video',
      theme: 'indigo',
      cta: 'Get Pro',
      ctaVariant: 'primary',
      recommended: true,
      valueText: 'Best for weekly creators',
      badgeText: 'Most popular'
    },
    {
      id: 'executive',
      name: 'Unlimited',
      price: 49,
      priceYearly: 490,
      period: 'per month',
      analysesText: 'Unlimited analyses · up to 45 min per video',
      analysesPerMonth: 'Unlimited analyses',
      durationText: 'Up to 45 min per video',
      theme: 'graphite',
      cta: 'Get Unlimited',
      ctaVariant: 'primary',
      recommended: false,
      valueText: 'Best for daily practice and coaching',
      badgeText: 'Best value'
    }
  ];

  const handleSelectPlan = (planId) => {
    // Simple analytics hook – replace with real tracking later
    try {
      // eslint-disable-next-line no-console
      console.log('[PricingPage] Plan selected', { planId, billingPeriod });
    } catch (e) {
      // ignore
    }

    if (!isSignedIn) {
      // SignInButton will handle this
      return;
    }
    
    // Navigate to subscription management or payment
    if (planId === 'free') {
      navigate('/dashboard');
    } else {
      // TODO: Navigate to payment/checkout when Stripe is integrated
      // For now, navigate to subscription page
      navigate('/subscription?plan=' + planId);
    }
  };

  return (
    <div className="pricingPage">
      <div className="pricingPage__container">
        <section className="pricingPage__hero">
          <p className="pricingPage__eyebrow">Simple Pricing</p>
          <h1 className="pricingPage__title">Pick a plan that fits how often you practice</h1>
          <p className="pricingPage__subtitle">
            All plans include the same powerful AI analysis. The difference is how often
            you can practice and how long each video can be.
          </p>

          <div className="pricingPage__billingToggle">
            <button
              className={`billingToggle__button ${billingPeriod === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button
              className={`billingToggle__button ${billingPeriod === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              Yearly
              <span className="billingToggle__badge">Save up to 20%</span>
            </button>
          </div>
        </section>

        <section className="pricingPage__included">
          <div className="included__header">
            <p className="included__eyebrow">Every plan includes</p>
            <h2>Everything you need to improve</h2>
            <p>Get the full AI analysis experience regardless of which plan you choose.</p>
          </div>
          <ul className="included__list">
            {sharedFeatures.map((feature) => (
              <li key={feature} className="included__item">
                <Check size={18} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="pricingPage__cards">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              onSelect={handleSelectPlan}
              isSignedIn={isSignedIn}
            />
          ))}
        </section>

        {/* Teams & Enterprise Card */}
        <section className="pricingPage__teams">
          <div className="teamsCard">
            <div className="teamsCard__content">
              <p className="teamsCard__eyebrow">For teams & organizations</p>
              <h3 className="teamsCard__title">Teams & Enterprise</h3>
              <p className="teamsCard__subtitle">Custom pricing for coaches, companies, and schools.</p>
              <ul className="teamsCard__list">
                <li>Multiple seats & shared dashboards</li>
                <li>Centralized billing</li>
                <li>Training and onboarding support</li>
              </ul>
            </div>
            <button
              className="teamsCard__button"
              type="button"
              onClick={() => navigate('/contact-teams')}
            >
              Contact sales
            </button>
          </div>
        </section>

        <section className="pricingPage__payAsYouGo">
          <div className="payAsYouGo__card">
            <div className="payAsYouGo__content">
              <p className="payAsYouGo__eyebrow">Just need one?</p>
              <h3 className="payAsYouGo__title">Pay per video</h3>
              <p className="payAsYouGo__description">
                Don't need a subscription? Buy individual analyses anytime.
              </p>
              <div className="payAsYouGo__price">
                <span className="payAsYouGo__amount">$2.50</span>
                <span className="payAsYouGo__period">per video (up to 10 min)</span>
              </div>
              <p className="payAsYouGo__hint">
                Tip: If you analyze 6+ videos per month, the Basic plan is cheaper.
              </p>
            </div>
            {isSignedIn ? (
              <button className="payAsYouGo__button" onClick={() => navigate('/new-analysis')}>
                Purchase a single analysis
              </button>
            ) : (
              <Link to="/sign-up" className="payAsYouGo__button">
                Purchase a single analysis
              </Link>
            )}
          </div>
        </section>

        <section className="pricingPage__faq">
          <div className="faq__header">
            <p className="faq__eyebrow">Have a question?</p>
            <h2 className="faq__title">Pricing FAQs</h2>
          </div>
          <div className="faq__list">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={faq.question} className={`faq__item ${isOpen ? 'open' : ''}`}>
                  <button
                    className="faq__questionRow"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown size={18} />
                  </button>
                  {Array.isArray(faq.answer) ? (
                    <ul className={`faq__answerList ${isOpen ? 'open' : ''}`}>
                      {faq.answer.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={`faq__answer ${isOpen ? 'open' : ''}`}>{faq.answer}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

