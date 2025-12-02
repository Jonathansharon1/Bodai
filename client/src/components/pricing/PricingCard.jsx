import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import './PricingCard.css';

export default function PricingCard({ plan, billingPeriod, onSelect, isSignedIn }) {
  const displayPrice =
    plan.price === 0 ? 0 : billingPeriod === 'yearly' ? plan.priceYearly : plan.price;
  const billingText =
    plan.price === 0
      ? 'No credit card required'
      : billingPeriod === 'yearly'
        ? `${plan.period.replace('per month', '')} billed yearly`
        : 'Billed monthly';

  const handleClick = () => {
    if (isSignedIn) {
      onSelect(plan.id);
    }
  };

  const cardClassNames = [
    'pricingCard',
    plan.recommended ? 'pricingCard--recommended' : '',
    plan.theme ? `pricingCard--${plan.theme}` : ''
  ]
    .filter(Boolean)
    .join(' ');

  const ButtonContent = () => (
    <>
      {plan.cta}
      <ArrowRight className="button__icon" size={18} aria-hidden="true" />
    </>
  );

  return (
    <div className={cardClassNames}>
      {plan.recommended && (
        <div className="pricingCard__badge">
          <Sparkles size={14} />
          <span>Recommended</span>
        </div>
      )}
      <div className="pricingCard__shell">
        <div className="pricingCard__header">
          <h3 className="pricingCard__name">{plan.name}</h3>
          {plan.valueText && <p className="pricingCard__summary">{plan.valueText}</p>}
        </div>

        <div className="pricingCard__pricePanel">
          <div className="price__amount">
            <span className="price__number">
              {`$${displayPrice}`}
            </span>
            <span className="price__period">/mo</span>
          </div>
          <p className="price__note">{billingText}</p>
          <div className="pricingCard__stats">
            <ul>
              {plan.analysesPerMonth && <li>{plan.analysesPerMonth}</li>}
              {plan.durationText && <li>{plan.durationText}</li>}
            </ul>
          </div>
        </div>

        <div className="pricingCard__cta">
          {isSignedIn ? (
            <button
              className={`pricingCard__button pricingCard__button--${plan.ctaVariant}`}
              onClick={handleClick}
            >
              <ButtonContent />
            </button>
          ) : (
            <Link 
              to="/sign-up" 
              className={`pricingCard__button pricingCard__button--${plan.ctaVariant}`}
            >
              <ButtonContent />
            </Link>
          )}
          {plan.price > 0 && (
            <p className="pricingCard__note">Cancel anytime—your progress stays saved.</p>
          )}
        </div>
      </div>
    </div>
  );
}

