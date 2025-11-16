import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { SignInButton } from '@clerk/clerk-react';
import './PricingCard.css';

export default function PricingCard({ plan, billingPeriod, onSelect, isSignedIn }) {
  const displayPrice = billingPeriod === 'yearly' ? plan.priceYearly : plan.price;
  const yearlySavings = billingPeriod === 'yearly' 
    ? Math.round((plan.price * 12 - plan.priceYearly) / 12)
    : 0;

  const handleClick = () => {
    if (isSignedIn) {
      onSelect(plan.id);
    }
  };

  return (
    <div className={`pricingCard ${plan.recommended ? 'pricingCard--recommended' : ''} ${plan.id === 'free' ? 'pricingCard--free' : ''} ${plan.id === 'pro' ? 'pricingCard--pro' : ''}`}>
      {plan.badge && (
        <div className="pricingCard__badge">
          {plan.badge === 'Most Popular' && <span className="badge__star">⭐</span>}
          {plan.badge}
        </div>
      )}
      
      <div className="pricingCard__header">
        <div className="pricingCard__icon">{plan.icon}</div>
        <h3 className="pricingCard__name">{plan.name}</h3>
      </div>

      <div className="pricingCard__price">
        <div className="price__amount">
          {plan.price === 0 ? (
            <span className="price__number">0</span>
          ) : (
            <>
              <span className="price__number">{displayPrice}</span>
              <span className="price__currency">$</span>
            </>
          )}
        </div>
        <div className="price__period">{plan.period}</div>
        {yearlySavings > 0 && (
          <div className="price__savings">
            Save ${yearlySavings} per month!
          </div>
        )}
      </div>

      <div className="pricingCard__analyses">
        <div className="analyses__number">{plan.analyses}</div>
        <div className="analyses__text">{plan.analysesText}</div>
      </div>

      {plan.valueText && (
        <div className="pricingCard__value">
          {plan.valueText}
        </div>
      )}

      {plan.savings && (
        <div className="pricingCard__savings">
          <div className="savings__line">
            <span className="savings__label">Total Value:</span>
            <span className="savings__value">${plan.savings.payAsYouGo}</span>
          </div>
          <div className="savings__line">
            <span className="savings__label">You Pay:</span>
            <span className="savings__value savings__value--highlight">${plan.savings.youPay}</span>
          </div>
          <div className="savings__total">
            💰 Save ${plan.savings.amount}!
          </div>
        </div>
      )}

      <ul className="pricingCard__features">
        {plan.features.map((feature, index) => (
          <li key={index} className="feature__item">
            <Check className="feature__icon" size={18} />
            <span className="feature__text">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="pricingCard__cta">
        {isSignedIn ? (
          <button
            className={`pricingCard__button pricingCard__button--${plan.ctaVariant}`}
            onClick={handleClick}
          >
            {plan.cta}
            <ArrowRight className="button__icon" size={18} />
          </button>
        ) : (
          <SignInButton mode="modal">
            <button className={`pricingCard__button pricingCard__button--${plan.ctaVariant}`}>
              {plan.cta}
              <ArrowRight className="button__icon" size={18} />
            </button>
          </SignInButton>
        )}
        {plan.price > 0 && (
          <p className="pricingCard__note">Cancel anytime - no questions asked</p>
        )}
      </div>
    </div>
  );
}

