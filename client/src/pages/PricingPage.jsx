import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { Check, Star, Sparkles, Zap, ArrowRight } from 'lucide-react';
import PricingCard from '../components/pricing/PricingCard';
import './PricingPage.css';

export default function PricingPage() {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' or 'yearly'

  const sharedFeatures = [
    'AI body language coach powered by Gemini',
    'Historical trendlines & progress dashboard',
    'Personalized action plans (instant tip + micro-practice)',
    'Goal-aware modules & baseline tracking',
    'Exportable insights & PDF summaries',
    'Priority support + practice reminders'
  ];

  const plans = [
    {
      id: 'free',
      name: 'Free',
      icon: '🆓',
      price: 0,
      priceYearly: 0,
      period: 'forever',
      analyses: 1,
      analysesText: '1 analysis',
      features: [
        '1 full analysis',
        'Personalized feedback',
        'Professional insights',
        'No cost - no commitment'
      ],
      cta: 'Get Started - Free',
      ctaVariant: 'secondary',
      recommended: false,
      badge: null,
      valueText: null
    },
    {
      id: 'starter',
      name: 'Starter Reps',
      icon: '📦',
      price: 9,
      priceYearly: 90,
      period: 'per month',
      analyses: 6,
      analysesText: '6 analyses per month',
      features: sharedFeatures,
      cta: 'Lock In My Reps',
      ctaVariant: 'primary',
      recommended: false,
      badge: null,
      valueText: 'Perfect for monthly check-ins',
      savings: null
    },
    {
      id: 'momentum',
      name: 'Momentum',
      icon: '⭐',
      price: 15,
      priceYearly: 150,
      period: 'per month',
      analyses: 20,
      analysesText: '20 analyses per month',
      features: sharedFeatures,
      cta: 'Start My Momentum',
      ctaVariant: 'primary',
      recommended: true,
      badge: 'Most Popular',
      valueText: 'Weekly practice for under $1 per analysis',
      savings: {
        payAsYouGo: 30,
        youPay: 15,
        amount: 15
      }
    },
    {
      id: 'executive',
      name: 'Executive Mastery',
      icon: '💎',
      price: 39,
      priceYearly: 390,
      period: 'per month',
      analyses: '∞',
      analysesText: 'Unlimited analyses',
      features: sharedFeatures,
      cta: 'Train Without Limits',
      ctaVariant: 'primary',
      recommended: false,
      badge: 'Premium',
      valueText: 'Coaches & daily practitioners',
      savings: null
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
        {/* Header */}
        <div className="pricingPage__header">
          <h1 className="pricingPage__title">Choose Your Plan</h1>
          <p className="pricingPage__subtitle">
            Join over 10,000 users already improving their communication
          </p>
          
          {/* Billing Toggle */}
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
        </div>

        {/* Pricing Cards */}
        <div className="pricingPage__cards">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              onSelect={handleSelectPlan}
              isSignedIn={isSignedIn}
            />
          ))}
        </div>

        {/* Pay As You Go Section */}
        <div className="pricingPage__payAsYouGo">
          <div className="payAsYouGo__card">
            <div className="payAsYouGo__icon">💳</div>
            <div className="payAsYouGo__content">
              <h3 className="payAsYouGo__title">Pay As You Go</h3>
              <p className="payAsYouGo__description">
                Perfect for those who use it only once or twice a month. No subscription - pay only when you use it.
              </p>
              <div className="payAsYouGo__price">
                <span className="payAsYouGo__amount">$1.50</span>
                <span className="payAsYouGo__period">per analysis</span>
              </div>
              <p className="payAsYouGo__hint">
                After 5 analyses it’s cheaper to move to Starter Reps.
              </p>
              {isSignedIn ? (
                <button
                  className="payAsYouGo__button"
                  onClick={() => navigate('/new-analysis')}
                >
                  Try Now
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button className="payAsYouGo__button">
                    Try Now
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="pricingPage__socialProof">
          <div className="socialProof__item">
            <Star className="socialProof__icon" fill="#FFD700" color="#FFD700" />
            <div>
              <div className="socialProof__number">4.8/5</div>
              <div className="socialProof__label">Average Rating</div>
            </div>
          </div>
          <div className="socialProof__item">
            <Sparkles className="socialProof__icon" color="#46B5D1" />
            <div>
              <div className="socialProof__number">85%</div>
              <div className="socialProof__label">Report improvement within a week</div>
            </div>
          </div>
          <div className="socialProof__item">
            <Zap className="socialProof__icon" color="#FF8C64" />
            <div>
              <div className="socialProof__number">92%</div>
              <div className="socialProof__label">Recommend to friends</div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="pricingPage__faq">
          <h2 className="faq__title">Frequently Asked Questions</h2>
          <div className="faq__list">
            <div className="faq__item">
              <h3 className="faq__question">How does it work?</h3>
              <p className="faq__answer">
                Upload a short video of yourself and get an advanced AI analysis with professional insights, 
                improvement points, and a personalized action plan.
              </p>
            </div>
            <div className="faq__item">
              <h3 className="faq__question">Can I cancel anytime?</h3>
              <p className="faq__answer">
                Yes! You can cancel your subscription at any time with no questions asked. 
                No additional charges will be made after cancellation.
              </p>
            </div>
            <div className="faq__item">
              <h3 className="faq__question">What's the difference between plans?</h3>
              <p className="faq__answer">
                The main difference is the number of analyses you get per month. 
                Premium is the recommended plan - best value with 20 analyses per month.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

