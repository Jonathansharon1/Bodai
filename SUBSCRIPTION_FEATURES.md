# Subscription System - Features & Improvements

## ✅ מה כבר מיושם:

### 1. **מערכת מנויים בסיסית**
- `subscription_type`: 'free', 'premium', 'pro'
- `subscription_status`: 'active', 'cancelled', 'expired'
- `subscription_expires_at`: תאריך תפוגה
- `free_analysis_used`: האם השתמש בניתוח החינמי

### 2. **הגבלות למנוי FREE**
- ניתוח אחד חינם בלבד
- אחרי הניתוח הראשון - לא יכול להעלות עוד סרטונים
- הודעת שגיאה ברורה עם אפשרות לשדרוג

### 3. **מעקב קורסים** (Schema מוכן)
- טבלת `courses` - כל הקורסים
- טבלת `course_enrollments` - רישומים של משתמשים לקורסים
- מעקב התקדמות (`progress_percentage`)

## 💡 שיפורים נוספים מומלצים:

### 1. **Frontend - Upgrade Prompt**
- הוספת Banner/Modal כש-Free user מגיע לגבול
- כפתור "Upgrade to Premium" בולט
- הצגת יתרונות המנוי

### 2. **Dashboard - Subscription Status**
- הצגת סוג המנוי הנוכחי
- כמה ניתוחים נותרו (למנוי Free)
- Progress bar לניתוחים

### 3. **API Endpoint - Subscription Info**
- `GET /api/user/subscription` - מידע על המנוי
- `GET /api/user/analyses-count` - כמה ניתוחים יש למשתמש

### 4. **Limits per Subscription Type**
```javascript
const SUBSCRIPTION_LIMITS = {
  free: { analyses: 1, courses: 0 },
  premium: { analyses: -1, courses: 5 }, // -1 = unlimited
  pro: { analyses: -1, courses: -1 }
};
```

### 5. **Usage Tracking**
- כמה ניתוחים בוצעו החודש
- כמה ניתוחים נותרו
- תאריך חידוש המנוי

### 6. **Trial Period**
- אפשרות למנוי trial (7-14 ימים)
- אוטומטית הופך ל-Free אחרי הטריאל

### 7. **Course Access Control**
- בדיקה אם משתמש יכול לגשת לקורס
- הצגת קורסים זמינים לפי מנוי

### 8. **Payment Integration (Stripe)**
- Webhook מ-Stripe לעדכון מנוי
- שמירת payment history
- Auto-renewal

## 📋 מה לעשות עכשיו:

1. **עדכן את ה-Schema ב-Supabase:**
   - הרץ את `supabase/schema.sql` המעודכן
   - (אם כבר יש טבלת users, תצטרך ALTER TABLE)

2. **Frontend - הוסף Upgrade UI:**
   - Component להצגת הודעת שדרוג
   - כפתור "Upgrade" ב-Dashboard

3. **Backend - הוסף Endpoint:**
   - `GET /api/user/subscription` - מידע מנוי

רוצה שאתחיל ליישם את השיפורים האלה?

