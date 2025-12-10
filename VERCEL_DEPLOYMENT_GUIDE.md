# מדריך פריסה ל-Vercel - שלב אחר שלב

## סקירה כללית

הפרויקט שלך הוא Full-Stack Application עם:
- **Backend**: Node.js/Express (server.js)
- **Frontend**: React עם Vite (תיקיית client)
- **Database**: Supabase
- **Storage**: AWS S3
- **Authentication**: Clerk

## שלב 1: הכנות לפני הפריסה

### 1.1 בדיקת הקוד
```bash
# בדוק שהכל עובד מקומית
npm install
cd client && npm install && cd ..

# הרץ את הבדיקות
npm test

# בדוק שהבנייה עובדת
npm run build
```

### 1.2 וידוא שהכל ב-Git
```bash
# בדוק סטטוס
git status

# ודא שכל הקבצים החשובים ב-Git (לא ב-.gitignore)
# ודא ש-.env לא ב-Git (אמור להיות ב-.gitignore)
```

## שלב 2: יצירת חשבון Vercel וחיבור ל-GitHub

### 2.1 יצירת חשבון
1. לך ל-[vercel.com](https://vercel.com)
2. היכנס עם חשבון GitHub שלך
3. אשר את הגישה ל-repository שלך

### 2.2 חיבור הפרויקט
1. ב-Vercel Dashboard, לחץ על "Add New Project"
2. בחר את ה-repository שלך (Bodai)
3. Vercel יזהה אוטומטית את הפרויקט

## שלב 3: הגדרת Environment Variables

### 3.1 משתני סביבה ל-Backend
ב-Vercel Dashboard, תחת Settings → Environment Variables, הוסף:

**חובה:**
```
API_KEY=your-google-gemini-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
CLIENT_ORIGIN=https://your-vercel-domain.vercel.app
NODE_ENV=production
```

**אופציונלי:**
```
PORT=5000
GEMINI_MODEL=gemini-3-pro-preview
MAX_VIDEO_SIZE_MB=500
MIN_VIDEO_DURATION_SECONDS=30
MAX_VIDEO_DURATION_SECONDS=2700
SENTRY_DSN=your-sentry-dsn (אם משתמשים ב-Sentry)
```

### 3.2 משתני סביבה ל-Frontend
**חובה:**
```
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

**אופציונלי:**
```
VITE_API_URL=https://your-vercel-domain.vercel.app
VITE_SENTRY_DSN=your-sentry-dsn (אם משתמשים ב-Sentry)
```

**הערה חשובה:** 
- ב-Vite, משתני סביבה מתחילים ב-`VITE_` (לא `REACT_APP_`)
- הקוד כבר משתמש ב-`import.meta.env.VITE_...` - זה נכון!
- משתני סביבה של Frontend חייבים להיות מוגדרים ב-Vercel כדי שיוטמעו ב-build time

## שלב 4: עדכון קובץ vercel.json

קובץ `vercel.json` כבר עודכן לפורמט המודרני של Vercel. הקובץ מכיל:
- הגדרות build עבור ה-client
- Rewrites להפניה של `/api/*` ל-serverless function
- Headers ל-CORS

## שלב 5: יצירת API Handler ל-Vercel

נוצר קובץ `api/index.js` שייצא את ה-Express app כ-serverless function. הקובץ כבר קיים ומוכן לשימוש.

## שלב 6: עדכון Build Settings

ב-Vercel Dashboard:
1. לך ל-Settings → General
2. תחת "Build & Development Settings":
   - **Framework Preset**: Other
   - **Root Directory**: ./ (או השאר ריק)
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/build`
   - **Install Command**: `npm install`

**או** השאר את ההגדרות בריק - `vercel.json` כבר מכיל את כל ההגדרות הנדרשות!

## שלב 7: עדכון CORS

**חשוב:** ודא שמשתנה הסביבה `CLIENT_ORIGIN` מכיל את ה-URL של Vercel:
```
CLIENT_ORIGIN=https://your-app.vercel.app
```

אם יש לך custom domain:
```
CLIENT_ORIGIN=https://yourdomain.com
```

הקוד ב-`server.js` כבר משתמש ב-`process.env.CLIENT_ORIGIN` - רק צריך להגדיר אותו ב-Vercel.

## שלב 8: פריסה ראשונית

### דרך 1: דרך Vercel Dashboard
1. לחץ על "Deploy" ב-Vercel Dashboard
2. Vercel יבנה ויפרס אוטומטית

### דרך 2: דרך Vercel CLI
```bash
# התקן Vercel CLI
npm i -g vercel

# התחבר
vercel login

# פרוס (preview)
vercel

# פרוס ל-production
vercel --prod
```

## שלב 9: בדיקות אחרי הפריסה

### 9.1 בדיקת Health Endpoints
```bash
# בדוק health endpoint
curl https://your-app.vercel.app/api/health

# בדוק readiness endpoint
curl https://your-app.vercel.app/api/ready
```

### 9.2 בדיקת Frontend
1. פתח את ה-URL של Vercel בדפדפן
2. בדוק שהאפליקציה נטענת
3. נסה להתחבר עם Clerk
4. נסה להעלות וידאו ולקבל ניתוח

### 9.3 בדיקת Logs
1. ב-Vercel Dashboard, לך ל-Deployments
2. בחר את ה-deployment האחרון
3. לחץ על "Functions" כדי לראות את ה-logs

## שלב 10: הגדרת Custom Domain (אופציונלי)

1. ב-Vercel Dashboard, לך ל-Settings → Domains
2. הוסף את הדומיין שלך
3. עקוב אחר ההוראות להגדרת DNS

## שלב 11: הגדרת Auto-Deploy

Vercel כבר מחובר ל-GitHub, אז כל push ל-main branch יפרס אוטומטית.

**מומלץ:**
- השתמש ב-branches שונים לסטייג'ינג ופרודקשן
- הגדר branch protection ב-GitHub

## בעיות נפוצות ופתרונות

### בעיה: Build נכשל
**פתרון:**
- בדוק את ה-logs ב-Vercel
- ודא שכל ה-dependencies מותקנים
- בדוק שה-Node.js version תואם (Vercel משתמש ב-20.x כברירת מחדל)

### בעיה: Environment Variables לא נטענים
**פתרון:**
- ודא שהשמות תואמים בדיוק (case-sensitive)
- ודא שהוגדרו ל-Production environment
- רענן את ה-deployment אחרי הוספת משתנים

### בעיה: CORS errors
**פתרון:**
- ודא ש-`CLIENT_ORIGIN` מכיל את ה-URL הנכון של Vercel
- בדוק את הגדרות CORS ב-server.js

### בעיה: API routes לא עובדים
**פתרון:**
- ודא ש-vercel.json מוגדר נכון
- בדוק שה-API handler מיוצא נכון
- בדוק את ה-logs ב-Vercel Functions

### בעיה: Frontend לא מוצא את ה-API
**פתרון:**
- ודא ש-`VITE_API_URL` מוגדר נכון
- בדוק שהקוד משתמש ב-`import.meta.env.VITE_API_URL`

## הגדרות מומלצות נוספות

### 1. הגדרת Monitoring
- הוסף Sentry לניטור שגיאות
- השתמש ב-Vercel Analytics

### 2. הגדרת Alerts
- הגדר alerts ב-Vercel ל-deployments שנכשלו
- הגדר alerts ב-Sentry לשגיאות קריטיות

### 3. הגדרת Backups
- ודא ש-Supabase עושה backups אוטומטיים
- שקול backup ל-S3

## צעדים הבאים

1. ✅ בדוק שהכל עובד בפרודקשן
2. ✅ הגדר monitoring ו-alerts
3. ✅ בדוק performance ו-optimize לפי הצורך
4. ✅ הגדר custom domain
5. ✅ בדוק security headers

## קישורים שימושיים

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)

---

**הערה:** אם נתקלת בבעיות, בדוק את ה-logs ב-Vercel Dashboard תחת Deployments → [Your Deployment] → Functions.

