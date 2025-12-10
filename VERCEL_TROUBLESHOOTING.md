# פתרון בעיות נפוצות ב-Vercel

## שגיאות Build נפוצות

### 1. "Module not found" או "Cannot find module"
**סיבה:** Dependencies לא מותקנים נכון

**פתרון:**
- ודא ש-`vercel.json` מכיל את ה-buildCommand הנכון
- בדוק שה-`package.json` מכיל את כל ה-dependencies
- נסה למחוק `node_modules` ולהתקין מחדש

### 2. "Build failed" - Client build
**סיבה:** שגיאת build ב-React/Vite

**פתרון:**
```bash
# בדוק מקומית
cd client
npm install
npm run build
```

אם זה עובד מקומית אבל נכשל ב-Vercel:
- ודא שכל ה-environment variables מוגדרים (VITE_*)
- בדוק שה-Node.js version תואם (Vercel משתמש ב-20.x)

### 3. "Function not found" או "404 on /api/*"
**סיבה:** ה-API handler לא מוגדר נכון

**פתרון:**
- ודא שקובץ `api/index.js` קיים
- ודא ש-`vercel.json` מכיל את ה-rewrite הנכון:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index"
    }
  ]
}
```

### 4. "Cannot import server.js"
**סיבה:** בעיה ב-ES modules

**פתרון:**
- ודא ש-`package.json` מכיל `"type": "module"`
- ודא ש-`server.js` מייצא את ה-app: `export default app;`

### 5. "Environment variable not found"
**סיבה:** משתני סביבה לא מוגדרים ב-Vercel

**פתרון:**
1. לך ל-Vercel Dashboard → Settings → Environment Variables
2. הוסף את כל המשתנים הנדרשים
3. ודא שהם מוגדרים ל-Production, Preview, ו-Development
4. רענן את ה-deployment

### 6. "CORS error" או "Access-Control-Allow-Origin"
**סיבה:** CORS לא מוגדר נכון

**פתרון:**
- ודא ש-`CLIENT_ORIGIN` מוגדר ב-Vercel
- בדוק את ה-CORS headers ב-`vercel.json`
- ודא שה-`server.js` מכיל את ה-CORS middleware

### 7. "Static files not found" או "404 on root"
**סיבה:** ה-output directory לא מוגדר נכון

**פתרון:**
- ודא ש-`vercel.json` מכיל:
```json
{
  "outputDirectory": "client/build"
}
```
- ודא שה-build יוצר את התיקייה `client/build`

### 8. "Function timeout" או "Execution timeout"
**סיבה:** הפונקציה לוקחת יותר מדי זמן

**פתרון:**
- Vercel Hobby plan: 10 שניות timeout
- Vercel Pro plan: 60 שניות timeout
- שקול להעביר פעולות ארוכות ל-background jobs

### 9. "Memory limit exceeded"
**סיבה:** הפונקציה משתמשת יותר מדי זיכרון

**פתרון:**
- Vercel Hobby: 1024 MB
- Vercel Pro: 3008 MB
- אופטימיזציה של הקוד או שדרוג התוכנית

## בדיקות מהירות

### בדוק שהכל עובד מקומית:
```bash
# Root
npm install

# Client
cd client
npm install
npm run build
cd ..

# Server (אם לא ב-Vercel)
npm start
```

### בדוק את ה-API handler:
```bash
# ודא שהקובץ קיים
ls api/index.js

# בדוק שהוא מייצא את ה-app
cat api/index.js
```

### בדוק את vercel.json:
```bash
# ודא שהקובץ תקין JSON
cat vercel.json | python -m json.tool
```

## איך לראות Logs ב-Vercel

1. לך ל-Vercel Dashboard
2. בחר את ה-Project
3. לך ל-Deployments
4. לחץ על ה-Deployment האחרון
5. לחץ על "Functions" כדי לראות את ה-logs של ה-API
6. לחץ על "Build Logs" כדי לראות את ה-build logs

## איך לראות Environment Variables

1. לך ל-Vercel Dashboard
2. בחר את ה-Project
3. לך ל-Settings → Environment Variables
4. בדוק שכל המשתנים מוגדרים

## איך לעשות Rollback

1. לך ל-Vercel Dashboard
2. לך ל-Deployments
3. מצא deployment שעובד
4. לחץ על "..." → "Promote to Production"

## קישורים שימושיים

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Build Configuration](https://vercel.com/docs/build-step)

