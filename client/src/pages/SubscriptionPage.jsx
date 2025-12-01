import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Check, Calendar, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import './SubscriptionPage.css';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SubscriptionPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [usageStats, setUsageStats] = useState(null);

  useEffect(() => {
    if (user) {
      fetchSubscriptionInfo();
    }
  }, [user]);

  const fetchSubscriptionInfo = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // TODO: Replace with actual API endpoint when ready
      const res = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:5000/api/user/profile', {
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const userData = data.user;
        
        // Calculate usage stats
        const analysesRes = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/analyses`,
          {
            headers: {
              'X-Clerk-User-Id': user.id,
              'Content-Type': 'application/json'
            }
          }
        );

        let analysesCount = 0;
        if (analysesRes.ok) {
          const analysesData = await analysesRes.json();
          // Count analyses from current month
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          analysesCount = analysesData.analyses?.filter(analysis => {
            const analysisDate = new Date(analysis.created_at);
            return analysisDate.getMonth() === currentMonth && 
                   analysisDate.getFullYear() === currentYear;
          }).length || 0;
        }

        // Get subscription limits
        const subscriptionType = userData.subscription_type || 'free';
        const limits = getSubscriptionLimits(subscriptionType);

        setSubscriptionInfo({
          type: subscriptionType,
          status: userData.subscription_status || 'active',
          expiresAt: userData.subscription_expires_at,
          startedAt: userData.subscription_started_at
        });

        setUsageStats({
          analysesUsed: analysesCount,
          analysesLimit: limits.analyses,
          remaining: limits.analyses === -1 ? -1 : Math.max(0, limits.analyses - analysesCount)
        });
      }
    } catch (err) {
      console.error('Failed to fetch subscription info:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionLimits = (type) => {
    const limits = {
      free: { analyses: 1 },
      basic: { analyses: 8 },
      premium: { analyses: 20 },
      pro: { analyses: -1 } // unlimited
    };
    return limits[type] || limits.free;
  };

  const getSubscriptionDisplayName = (type) => {
    const names = {
      free: 'Free',
      basic: 'Basic',
      premium: 'Premium',
      pro: 'Pro'
    };
    return names[type] || 'Free';
  };

  const getSubscriptionIcon = (type) => {
    const icons = {
      free: '🆓',
      basic: '📦',
      premium: '⭐',
      pro: '💎'
    };
    return icons[type] || '🆓';
  };

  if (loading) {
    return (
      <div className="subscriptionPage">
        <LoadingSpinner message="Loading your subscription..." size="large" />
      </div>
    );
  }

  const subscriptionType = subscriptionInfo?.type || 'free';
  const limits = getSubscriptionLimits(subscriptionType);
  const isUnlimited = limits.analyses === -1;
  const usagePercentage = isUnlimited ? 0 : 
    (usageStats?.analysesUsed || 0) / limits.analyses * 100;

  return (
    <div className="subscriptionPage">
      <div className="subscriptionPage__container">
        <div className="subscriptionPage__header">
          <h1 className="subscriptionPage__title">My Subscription</h1>
          <p className="subscriptionPage__subtitle">
            Manage your subscription, track your usage, and upgrade when you're ready
          </p>
        </div>

        {/* Current Subscription Card */}
        <div className={`subscriptionCard subscriptionCard--${subscriptionType}`}>
          <div className="subscriptionCard__header">
            <div className="subscriptionCard__icon">{getSubscriptionIcon(subscriptionType)}</div>
            <div>
              <h2 className="subscriptionCard__name">{getSubscriptionDisplayName(subscriptionType)}</h2>
              <p className="subscriptionCard__status">
                {subscriptionInfo?.status === 'active' ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          {subscriptionInfo?.expiresAt && (
            <div className="subscriptionCard__expiry">
              <Calendar size={18} />
              <span>
                Active until: {new Date(subscriptionInfo.expiresAt).toLocaleDateString('en-US')}
              </span>
            </div>
          )}

          {/* Usage Stats */}
          <div className="subscriptionCard__usage">
            <div className="usage__header">
              <h3 className="usage__title">Analyses This Month</h3>
              <div className="usage__count">
                {isUnlimited ? (
                  <span className="usage__unlimited">∞</span>
                ) : (
                  <span>
                    {usageStats?.analysesUsed || 0} / {limits.analyses}
                  </span>
                )}
              </div>
            </div>
            
            {!isUnlimited && (
              <>
                <div className="usage__progress">
                  <div 
                    className="usage__progressBar" 
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="usage__remaining">
                  {usageStats?.remaining === 0 ? (
                    <span className="usage__warning">
                      <AlertCircle size={16} />
                      You've used all your analyses this month
                    </span>
                  ) : (
                    <span>
                      {usageStats?.remaining || 0} analyses remaining
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Upgrade CTA */}
          {subscriptionType !== 'pro' && (
            <div className="subscriptionCard__upgrade">
              <button
                className="subscriptionCard__upgradeButton"
                onClick={() => navigate('/pricing')}
              >
                Upgrade to a Better Plan
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Subscription Features */}
        <div className="subscriptionFeatures">
          <h2 className="subscriptionFeatures__title">What's Included in Your Plan</h2>
          <div className="subscriptionFeatures__list">
            {getFeaturesForPlan(subscriptionType).map((feature, index) => (
              <div key={index} className="featureItem">
                <Check className="featureItem__icon" size={20} />
                <span className="featureItem__text">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Billing History (Future) */}
        <div className="subscriptionBilling">
          <h2 className="subscriptionBilling__title">Billing History</h2>
          <p className="subscriptionBilling__comingSoon">
            Coming soon - you'll be able to see all your payments and invoices here
          </p>
        </div>
      </div>
    </div>
  );
}

function getFeaturesForPlan(type) {
  const features = {
    free: [
      '1 full analysis',
      'Personalized feedback',
      'Professional insights'
    ],
    basic: [
      '12 analyses per month',
      'Full progress tracking with charts',
      'Personalized Action Items',
      'Advanced Insights',
      'Achievements & Gamification',
      'Comparisons with your baseline'
    ],
    premium: [
      '20 analyses per month',
      'Full progress tracking with charts',
      'Personalized Action Items',
      'Advanced Insights',
      'Achievements & Gamification',
      'Comparisons with your baseline',
      'Option to purchase additional analyses'
    ],
    pro: [
      'Unlimited analyses',
      'Everything in Premium, plus:',
      'Advanced personalized analyses',
      'Access to advanced global statistics',
      'Comparisons with other users',
      'Priority Support',
      'Export data to PDF/Excel',
      'Custom Goals & Metrics',
      'Longer analyses (up to 10 minutes)'
    ]
  };
  return features[type] || features.free;
}

