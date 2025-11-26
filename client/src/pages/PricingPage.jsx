import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { Check, ChevronDown } from 'lucide-react';
import PricingCard from '../components/pricing/PricingCard';
import './PricingPage.css';



const faqs = [
  {
    question: 'What happens after I upload a video?',
    answer: [
      'AI breaks down your presence, voice, and storytelling within minutes.',
      'You receive a structured report plus a personalized action plan.',
      'A micro-practice is suggested to reinforce what to do next.'
    ]
  },
  {
    question: 'Can I switch or cancel plans anytime?',
    answer:
      'Yes. Upgrade, downgrade, or cancel whenever you like. Your account retains all historical analyses so you can come back later without starting over.'
  },
  {
    question: 'Can I open multiple journeys (focus areas)?',
    answer:
      'Every plan supports unlimited journeys. Spin up interview prep, leadership, or social confidence tracks and keep independent progress for each.'
  },
  {
    question: 'Do you support teams and companies?',
    answer:
      'Executive Mastery unlocks unlimited uploads and we offer tailored onboarding for teams. Reach out via chat to set up a workspace.'
  }
];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const sharedFeatures = [
    'AI body language coach powered by Gemini',
    'Historical trendlines & progress dashboard',
    'Personalized action plans (instant tip + micro-practice)',
    'Goal-aware modules & baseline tracking',
    'Exportable insights & PDF summaries',
    'Priority support + practice reminders',
    'Launch unlimited focus journeys (interview, leadership, social, etc.) and keep historical progress for each'
  ];

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      priceYearly: 0,
      period: 'forever',
      analysesText: '1 analysis',
      theme: 'slate',
      cta: 'Get Started Free',
      ctaVariant: 'secondary',
      recommended: false
    },
    {
      id: 'starter',
      name: 'Starter Reps',
      price: 8,
      priceYearly: 80,
      period: 'per month',
      analysesText: '6 analyses per month',
      theme: 'teal',
      cta: 'Lock In My Reps',
      ctaVariant: 'primary',
      recommended: false,
      valueText: 'Perfect for monthly check-ins',
      badgeText: 'Best for monthly'
    },
    {
      id: 'momentum',
      name: 'Momentum',
      price: 15,
      priceYearly: 150,
      period: 'per month',
      analysesText: '16 analyses per month',
      theme: 'indigo',
      cta: 'Start Momentum',
      ctaVariant: 'primary',
      recommended: true,
      valueText: 'Weekly practice for under $1 per analysis',
      badgeText: 'Most popular'
    },
    {
      id: 'executive',
      name: 'Executive Mastery',
      price: 39,
      priceYearly: 390,
      period: 'per month',
      analysesText: 'Unlimited analyses',
      theme: 'graphite',
      cta: 'Train Without Limits',
      ctaVariant: 'primary',
      recommended: false,
      valueText: 'Coaches & daily practitioners',
      badgeText: 'Teams & power users'
    }
  ];

  const handleSelectPlan = (planId) => {
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
          <p className="pricingPage__eyebrow">Pricing</p>
          <h1 className="pricingPage__title">World-class coaching feedback without the executive price tag</h1>
          <p className="pricingPage__subtitle">
            Every plan includes the same AI engine, personalized action plans, and progress dashboards.
            Choose how often you want to practice.
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
            <p className="included__eyebrow">Included in every plan</p>
            <h2>All the coaching power. One toolkit.</h2>
            <p>Every plan unlocks the full AI analysis pipeline, personalized drills, and progress intelligence.</p>
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

        <section className="pricingPage__payAsYouGo">
          <div className="payAsYouGo__card">
            <div className="payAsYouGo__content">
              <p className="payAsYouGo__eyebrow">Need flexibility?</p>
              <h3 className="payAsYouGo__title">Pay as you go</h3>
              <p className="payAsYouGo__description">
                Ideal if you only upload a few times per year. Purchase a single AI analysis whenever you want—no subscription.
              </p>
              <div className="payAsYouGo__price">
                <span className="payAsYouGo__amount">$1.50</span>
                <span className="payAsYouGo__period">per analysis</span>
              </div>
              <p className="payAsYouGo__hint">After five sessions a month, Starter Reps is more cost effective.</p>
            </div>
            {isSignedIn ? (
              <button className="payAsYouGo__button" onClick={() => navigate('/new-analysis')}>
                Purchase a single analysis
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="payAsYouGo__button">Purchase a single analysis</button>
              </SignInButton>
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

