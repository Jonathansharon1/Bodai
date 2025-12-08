import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles } from 'lucide-react';
import './PricingCard.css';

export default function PricingCard({ plan, billingPeriod, onSelect, isSignedIn }) {
  const { t, i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';
  const currencySymbol = isHebrew ? '₪' : '$';
  
  const displayPrice =
    plan.price === 0 ? 0 : billingPeriod === 'yearly' ? plan.priceYearly : plan.price;
  
  const getBillingText = () => {
    if (plan.price === 0) {
      return t('pricing.plans.free.billingText');
    }
    const planKey = plan.id === 'starter' ? 'starter' 
      : plan.id === 'executive' ? 'executive' 
      : plan.id === 'proPlus' ? 'proPlus'
      : 'pro';
    return billingPeriod === 'yearly' 
      ? t(`pricing.plans.${planKey}.billingYearly`)
      : t(`pricing.plans.${planKey}.billingMonthly`);
  };
  
  const billingText = getBillingText();

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
          <span>{t('pricing.recommended')}</span>
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
              {plan.price === 0 ? `${currencySymbol}0` : `${currencySymbol}${displayPrice.toFixed(2)}`}
            </span>
            {plan.price > 0 && (
              <span className="price__period">
                {billingPeriod === 'yearly' 
                  ? (isHebrew ? '/שנה' : '/year')
                  : (isHebrew ? '/חודש' : '/mo')
                }
              </span>
            )}
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
            <p className="pricingCard__note">{t('pricing.cancelNote')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

