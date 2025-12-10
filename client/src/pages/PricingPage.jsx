import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';
import PricingCard from '../components/pricing/PricingCard';
import './PricingPage.css';



// Helper function to get FAQs with translations
const getFAQs = (t) => [
  {
    question: t('pricing.faqs.q1'),
    answer: t('pricing.faqs.a1', { returnObjects: true })
  },
  {
    question: t('pricing.faqs.q2'),
    answer: t('pricing.faqs.a2')
  },
  {
    question: t('pricing.faqs.q3'),
    answer: t('pricing.faqs.a3')
  },
  {
    question: t('pricing.faqs.q4'),
    answer: t('pricing.faqs.a4')
  },
  {
    question: t('pricing.faqs.q5'),
    answer: t('pricing.faqs.a5')
  },
  {
    question: t('pricing.faqs.q6'),
    answer: t('pricing.faqs.a6')
  },
  {
    question: t('pricing.faqs.q7'),
    answer: t('pricing.faqs.a7')
  },
  {
    question: t('pricing.faqs.q8'),
    answer: t('pricing.faqs.a8')
  },
  {
    question: t('pricing.faqs.q9'),
    answer: t('pricing.faqs.a9')
  }
];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const faqs = useMemo(() => getFAQs(t), [t]);

  // Lightweight analytics hook – replace with real tracking later
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.log('[PricingPage] Viewed', { billingPeriod: 'monthly' });
    } catch {
      // ignore
    }
  }, []);

  const sharedFeatures = useMemo(() => [
    t('pricing.sharedFeatures.feature1'),
    t('pricing.sharedFeatures.feature2'),
    t('pricing.sharedFeatures.feature3'),
    t('pricing.sharedFeatures.feature4'),
    t('pricing.sharedFeatures.feature5'),
    t('pricing.sharedFeatures.feature6')
  ], [t]);

  // Self-serve plans: pricing is based on analyses per month and max video length
  // Prices differ by language: ILS for Hebrew, USD for English
  const plans = useMemo(() => {
    // Hebrew prices (ILS)
    const hebrewPrices = {
      starter: { monthly: 19.90, yearly: 199 },
      pro: { monthly: 31.90, yearly: 319 },
      proPlus: { monthly: 49.90, yearly: 499 },
      executive: { monthly: 99.90, yearly: 999 }
    };
    
    // English prices (USD)
    const englishPrices = {
      starter: { monthly: 5.99, yearly: 59.90 },
      pro: { monthly: 9.99, yearly: 99.90 },
      proPlus: { monthly: 15.50, yearly: 155.00 },
      executive: { monthly: 31.00, yearly: 310.00 }
    };
    
    const prices = isHebrew ? hebrewPrices : englishPrices;
    
    return [
      {
        id: 'free',
        name: t('pricing.plans.free.name'),
        price: 0,
        priceYearly: 0,
        period: 'forever',
        analysesText: `${t('pricing.plans.free.analysesPerMonth')} · ${t('pricing.plans.free.durationText')}`,
        analysesPerMonth: t('pricing.plans.free.analysesPerMonth'),
        durationText: t('pricing.plans.free.durationText'),
        theme: 'slate',
        cta: t('pricing.plans.free.cta'),
        ctaVariant: 'secondary',
        recommended: false,
        valueText: t('pricing.plans.free.valueText'),
        badgeText: t('pricing.plans.free.badgeText')
      },
      {
        id: 'starter',
        name: t('pricing.plans.starter.name'),
        price: prices.starter.monthly,
        priceYearly: prices.starter.yearly,
        period: 'per month',
        analysesText: `${t('pricing.plans.starter.analysesPerMonth')} · ${t('pricing.plans.starter.durationText')}`,
        analysesPerMonth: t('pricing.plans.starter.analysesPerMonth'),
        durationText: t('pricing.plans.starter.durationText'),
        theme: 'teal',
        cta: t('pricing.plans.starter.cta'),
        ctaVariant: 'primary',
        recommended: false,
        valueText: t('pricing.plans.starter.valueText'),
        badgeText: t('pricing.plans.starter.badgeText')
      },
      {
        id: 'pro',
        name: t('pricing.plans.pro.name'),
        price: prices.pro.monthly,
        priceYearly: prices.pro.yearly,
        period: 'per month',
        analysesText: `${t('pricing.plans.pro.analysesPerMonth')} · ${t('pricing.plans.pro.durationText')}`,
        analysesPerMonth: t('pricing.plans.pro.analysesPerMonth'),
        durationText: t('pricing.plans.pro.durationText'),
        theme: 'indigo',
        cta: t('pricing.plans.pro.cta'),
        ctaVariant: 'primary',
        recommended: true,
        valueText: t('pricing.plans.pro.valueText'),
        badgeText: t('pricing.plans.pro.badgeText')
      },
      {
        id: 'proPlus',
        name: t('pricing.plans.proPlus.name'),
        price: prices.proPlus.monthly,
        priceYearly: prices.proPlus.yearly,
        period: 'per month',
        analysesText: `${t('pricing.plans.proPlus.analysesPerMonth')} · ${t('pricing.plans.proPlus.durationText')}`,
        analysesPerMonth: t('pricing.plans.proPlus.analysesPerMonth'),
        durationText: t('pricing.plans.proPlus.durationText'),
        theme: 'purple',
        cta: t('pricing.plans.proPlus.cta'),
        ctaVariant: 'primary',
        recommended: false,
        valueText: t('pricing.plans.proPlus.valueText'),
        badgeText: t('pricing.plans.proPlus.badgeText')
      },
      {
        id: 'executive',
        name: t('pricing.plans.executive.name'),
        price: prices.executive.monthly,
        priceYearly: prices.executive.yearly,
        period: 'per month',
        analysesText: `${t('pricing.plans.executive.analysesPerMonth')} · ${t('pricing.plans.executive.durationText')}`,
        analysesPerMonth: t('pricing.plans.executive.analysesPerMonth'),
        durationText: t('pricing.plans.executive.durationText'),
        theme: 'graphite',
        cta: t('pricing.plans.executive.cta'),
        ctaVariant: 'primary',
        recommended: false,
        valueText: t('pricing.plans.executive.valueText'),
        badgeText: t('pricing.plans.executive.badgeText')
      }
    ];
  }, [t, isHebrew]);

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
          <h1 className="pricingPage__title">{t('pricing.title')}</h1>
          <p className="pricingPage__subtitle">
            {t('pricing.subtitle')}
          </p>
        </section>



        <section className="pricingPage__included">
          <div className="included__header">
            <p className="included__eyebrow">{t('pricing.includedEyebrow')}</p>
            <h2>{t('pricing.includedTitle')}</h2>
            <p>{t('pricing.includedSubtitle')}</p>
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

        <div className="pricingPage__billingToggle">
            <button
              className={`billingToggle__button ${billingPeriod === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              {t('pricing.billingMonthly')}
            </button>
            <button
              className={`billingToggle__button ${billingPeriod === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              {t('pricing.billingYearly')}
              <span className="billingToggle__badge">{t('pricing.billingSave')}</span>
            </button>
          </div>
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
              <h3 className="teamsCard__title">{t('pricing.teamsTitle')}</h3>
              <p className="teamsCard__subtitle">{t('pricing.teamsSubtitle')}</p>
              <ul className="teamsCard__list">
                <li>{t('pricing.teamsFeature1')}</li>
                <li>{t('pricing.teamsFeature2')}</li>
                <li>{t('pricing.teamsFeature3')}</li>
              </ul>
            </div>
            <button
              className="teamsCard__button"
              type="button"
              onClick={() => navigate('/contact-teams')}
            >
              {t('pricing.teamsCta')}
            </button>
          </div>
        </section>

        <section className="pricingPage__payAsYouGo">
          <div className="payAsYouGo__card">
            <div className="payAsYouGo__content">
              <p className="payAsYouGo__eyebrow">{t('pricing.payAsYouGoEyebrow')}</p>
              <h3 className="payAsYouGo__title">{t('pricing.payAsYouGoTitle')}</h3>
              <p className="payAsYouGo__description">
                {t('pricing.payAsYouGoDescription')}
              </p>
              <div className="payAsYouGo__price">
                <span className="payAsYouGo__amount">{t('pricing.payAsYouGoPrice')}</span>
                <span className="payAsYouGo__period">{t('pricing.payAsYouGoPeriod')}</span>
              </div>

            </div>
            {isSignedIn ? (
              <button className="payAsYouGo__button" onClick={() => navigate('/new-analysis')}>
                {t('pricing.payAsYouGoCta')}
              </button>
            ) : (
              <Link to="/sign-up" className="payAsYouGo__button">
                {t('pricing.payAsYouGoCta')}
              </Link>
            )}
          </div>
        </section>

        <section className="pricingPage__faq">
          <div className="faq__header">
            <p className="faq__eyebrow">{t('pricing.faqEyebrow')}</p>
            <h2 className="faq__title">{t('pricing.faqTitle')}</h2>
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

