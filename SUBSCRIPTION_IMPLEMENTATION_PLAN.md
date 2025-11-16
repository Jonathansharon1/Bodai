# תוכנית יישום מערכת מנויים - BodAI
## מבנה טכני ושלבי עבודה

---

## 📋 סקירה כללית

### מה צריך לעדכן:

1. **Database Schema** - הוספת שדות נדרשים
2. **Backend Services** - עדכון לוגיקת מנויים
3. **API Endpoints** - endpoints חדשים
4. **Frontend Components** - דף מנויים, modals, banners
5. **Payment Integration** - Stripe/תשלומים
6. **Email System** - automated emails
7. **Analytics** - מעקב המרות

---

## 🗄️ Database Schema

### טבלת `users` - עדכונים נדרשים:

**שדות קיימים:**
- `subscription_type` (free, premium, pro)
- `subscription_status` (active, cancelled, expired)
- `subscription_expires_at`
- `free_analysis_used`

**שדות להוספה:**
- `subscription_started_at` - מתי התחיל המנוי
- `trial_ends_at` - מתי נגמר הטריאל (אם יש)
- `analyses_count_monthly` - כמה ניתוחים החודש
- `last_analysis_date` - תאריך הניתוח האחרון
- `subscription_renewal_date` - תאריך חידוש המנוי

### טבלת `subscription_limits` (חדשה):

**שדות:**
- `subscription_type` (free, premium, pro)
- `max_analyses_per_month` (-1 = unlimited)
- `max_courses` (-1 = unlimited)
- `features` (JSONB) - רשימת features

### טבלת `subscription_usage` (חדשה):

**שדות:**
- `user_id`
- `month` (YYYY-MM)
- `analyses_count`
- `courses_count`

---

## 🔧 Backend Services

### `subscriptionService.js` (חדש):

**Functions:**
1. `getSubscriptionLimits(type)` - החזרת הגבלות למנוי
2. `checkUserLimits(userId)` - בדיקה אם משתמש יכול לבצע פעולה
3. `incrementUsage(userId, type)` - עדכון שימוש (ניתוחים, קורסים)
4. `resetMonthlyUsage()` - איפוס שימוש חודשי (cron job)
5. `getSubscriptionValue(type)` - החזרת ערך כספי של מנוי
6. `calculateSavings(type, period)` - חישוב חיסכון

### `supabaseService.js` - עדכונים:

**Functions להוספה/עדכון:**
1. `getUserSubscriptionInfo(clerkUserId)` - מידע מנוי מלא
2. `getUserUsageStats(clerkUserId)` - סטטיסטיקות שימוש
3. `canUserAccessFeature(clerkUserId, feature)` - בדיקת גישה ל-feature
4. `updateSubscriptionUsage(clerkUserId, type, amount)` - עדכון שימוש

### `canUserUploadAnalysis` - עדכון:

**לוגיקה חדשה:**
- בדיקת `subscription_type`
- בדיקת `analyses_count_monthly` vs `max_analyses_per_month`
- בדיקת `subscription_expires_at`
- בדיקת `trial_ends_at` (אם יש טריאל)

---

## 🌐 API Endpoints

### Endpoints חדשים:

1. **`GET /api/subscription/plans`**
   - החזרת כל המנויים עם מחירים, features, ערך כספי
   - Response: `{ plans: [...] }`

2. **`GET /api/user/subscription`**
   - מידע מנוי של המשתמש הנוכחי
   - Response: `{ subscription: {...}, usage: {...}, limits: {...} }`

3. **`GET /api/user/usage`**
   - סטטיסטיקות שימוש (ניתוחים, קורסים)
   - Response: `{ analyses: {...}, courses: {...} }`

4. **`POST /api/subscription/upgrade`**
   - שדרוג מנוי
   - Body: `{ plan: 'premium' | 'pro', period: 'monthly' | 'yearly' }`
   - Response: `{ success: true, subscription: {...} }`

5. **`POST /api/subscription/cancel`**
   - ביטול מנוי
   - Response: `{ success: true }`

6. **`GET /api/subscription/check-limits`**
   - בדיקת הגבלות לפני פעולה
   - Query: `?action=upload_analysis` | `?action=access_course`
   - Response: `{ allowed: true/false, reason: '...', requiresUpgrade: true/false }`

### Endpoints קיימים - עדכונים:

1. **`POST /api/analyze-video`**
   - עדכון: בדיקת הגבלות לפני ניתוח
   - עדכון: עדכון `analyses_count_monthly` אחרי ניתוח

2. **`GET /api/user/profile`**
   - עדכון: הוספת מידע מנוי ל-response

---

## 🎨 Frontend Components

### Components חדשים:

1. **`PricingPage.jsx`**
   - דף המנויים הראשי
   - 3 cards: Free, Premium, Pro
   - Premium בולט יותר
   - Social proof, Scarcity messages

2. **`PricingCard.jsx`**
   - Card בודד למנוי
   - Props: `plan`, `recommended`, `features`, `price`
   - Badge אם מומלץ
   - CTA button

3. **`UpgradeModal.jsx`**
   - Modal לשדרוג
   - מופיע כש-Free user מנסה להעלות סרטון
   - הצגת יתרונות Premium
   - CTA לשדרוג

4. **`SubscriptionBanner.jsx`**
   - Banner ב-Dashboard
   - שונה לפי סוג מנוי
   - CTA לשדרוג

5. **`SubscriptionStatus.jsx`**
   - Card ב-Dashboard עם סטטוס מנוי
   - Progress bars (ניתוחים, קורסים)
   - כפתור "נהל מנוי"

6. **`UsageStats.jsx`**
   - הצגת סטטיסטיקות שימוש
   - כמה ניתוחים החודש
   - כמה קורסים פעילים

### Components קיימים - עדכונים:

1. **`Dashboard.jsx`**
   - הוספת `SubscriptionStatus`
   - הוספת `SubscriptionBanner`
   - הוספת `UsageStats`

2. **`UploadVideo.jsx`**
   - עדכון: בדיקת הגבלות לפני העלאה
   - עדכון: הצגת `UpgradeModal` אם צריך

3. **`Header.jsx`**
   - הוספת קישור ל-Pricing Page
   - הוספת Badge עם סוג מנוי

---

## 💳 Payment Integration

### Stripe Setup:

1. **Stripe Account**
   - יצירת account
   - קבלת API keys (test + production)

2. **Products & Prices**
   - יצירת Products ב-Stripe:
     - Premium Monthly (79₪)
     - Premium Yearly (790₪)
     - Pro Monthly (149₪)
     - Pro Yearly (1,490₪)

3. **Checkout Session**
   - יצירת Checkout Session
   - Redirect ל-Stripe Checkout
   - Webhook לעדכון מנוי אחרי תשלום

4. **Webhooks**
   - `checkout.session.completed` - מנוי חדש
   - `customer.subscription.updated` - עדכון מנוי
   - `customer.subscription.deleted` - ביטול מנוי
   - `invoice.payment_succeeded` - תשלום הצליח
   - `invoice.payment_failed` - תשלום נכשל

### Payment Service:

**`paymentService.js` (חדש):**
- `createCheckoutSession(userId, plan, period)`
- `handleWebhook(event)`
- `updateSubscriptionFromStripe(customerId, subscriptionId)`

---

## 📧 Email System

### Email Templates:

1. **Welcome Email** (אחרי הרשמה)
2. **First Analysis Complete** (אחרי ניתוח ראשון)
3. **Upgrade Prompt** (אחרי 3 ימים)
4. **Trial Ending** (3 ימים לפני סיום טריאל)
5. **Subscription Renewal** (7 ימים לפני חידוש)
6. **Payment Failed** (אחרי תשלום נכשל)
7. **Subscription Cancelled** (אחרי ביטול)

### Email Service:

**`emailService.js` (חדש):**
- `sendWelcomeEmail(userId)`
- `sendUpgradePrompt(userId)`
- `sendTrialEndingEmail(userId)`
- `scheduleEmails()` - cron job

### Email Provider:

- **Resend** / **SendGrid** / **Mailgun**
- Setup: API key, templates
- Automated sending

---

## 📊 Analytics

### Metrics למעקב:

1. **Conversion Rates:**
   - Free → Premium
   - Premium → Pro
   - Trial → Paid

2. **Usage Metrics:**
   - ניתוחים ממוצעים למנוי
   - קורסים ממוצעים למנוי
   - Churn rate

3. **Revenue Metrics:**
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)
   - Average Revenue Per User (ARPU)

4. **Engagement:**
   - Active users
   - Retention rate
   - Feature usage

### Analytics Service:

**`analyticsService.js` (חדש):**
- `trackConversion(userId, fromPlan, toPlan)`
- `trackUsage(userId, action)`
- `getConversionRates(period)`
- `getRevenueMetrics(period)`

---

## 🔄 Cron Jobs

### Jobs נדרשים:

1. **Reset Monthly Usage** (יום 1 בכל חודש)
   - איפוס `analyses_count_monthly`
   - איפוס `courses_count_monthly`

2. **Check Expired Subscriptions** (יומי)
   - בדיקת מנויים שפגו
   - עדכון `subscription_status` ל-'expired'
   - שליחת email למשתמש

3. **Check Trial Ending** (יומי)
   - בדיקת טריאלים שסיימו בקרוב (3 ימים)
   - שליחת email

4. **Send Scheduled Emails** (יומי)
   - שליחת emails מתוזמנים

---

## 🧪 Testing

### Unit Tests:

- `subscriptionService.test.js`
- `paymentService.test.js`
- `emailService.test.js`

### Integration Tests:

- API endpoints
- Payment flow
- Webhook handling

### E2E Tests:

- Sign up → Free analysis → Upgrade flow
- Payment flow
- Subscription management

---

## 📝 Environment Variables

### להוספה ל-`.env`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_...
EMAIL_FROM=noreply@bodai.com

# Subscription
TRIAL_DAYS=7
DEFAULT_CURRENCY=ILS
```

---

## 🚀 Deployment Checklist

### לפני Production:

- [ ] Stripe account setup (production)
- [ ] Email provider setup
- [ ] Database migrations
- [ ] Environment variables
- [ ] Webhook endpoints
- [ ] Cron jobs setup
- [ ] Analytics setup
- [ ] Testing (unit, integration, E2E)
- [ ] Monitoring & Logging
- [ ] Backup strategy

---

## 📚 מסמכים קשורים

- `SUBSCRIPTION_STRATEGY.md` - אסטרטגיה מפורטת
- `SUBSCRIPTION_COPYWRITING.md` - טקסטים שיווקיים
- `SUBSCRIPTION_UI_DESIGN.md` - עיצוב UI
- `SUBSCRIPTION_SUMMARY.md` - סיכום

---

**הערה:** זהו מסמך תכנון. הקוד עצמו ייכתב בשלב הבא.

