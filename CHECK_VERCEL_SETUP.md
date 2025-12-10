# איך לבדוק ולהגדיר Vercel Auto-Deploy

## הבעיה הנוכחית

ה-repository המקומי שלך:
- **Remote**: `https://github.com/Jonathansharon1/Bodai.git`
- **Branch**: `master`

אבל ב-Vercel מופיע:
- **Repository**: `jonsol-bodai`

## פתרונות

### פתרון 1: בדוק מה ה-repository ב-Vercel

1. לך ל-[Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט שלך
3. לך ל-**Settings** → **Git**
4. בדוק מה כתוב תחת **"Connected Git Repository"**

### פתרון 2: אם Vercel מחובר ל-`jonsol-bodai` אבל אתה רוצה `Bodai`

**אפשרות א': שנה את ה-remote המקומי:**
```bash
# שנה את ה-remote ל-repository של Vercel
git remote set-url origin https://github.com/Jonathansharon1/jonsol-bodai.git

# ודא שזה השתנה
git remote -v
```

**אפשרות ב': חבר את Vercel ל-repository הנכון:**
1. ב-Vercel Dashboard → Settings → Git
2. לחץ על **"Disconnect"**
3. לחץ על **"Connect Git Repository"**
4. בחר את `Bodai` במקום `jonsol-bodai`

### פתרון 3: בדוק איזה branch מוגדר ל-Production

1. ב-Vercel Dashboard → Settings → Git
2. בדוק מה כתוב תחת **"Production Branch"**
   - אם זה `main` - תצטרך לדחוף ל-`main`
   - אם זה `master` - תצטרך לדחוף ל-`master`

## איך לדחוף כדי ש-Vercel יתעדכן אוטומטית

### אם Production Branch הוא `master`:
```bash
# ודא שאתה על master
git checkout master

# הוסף את השינויים
git add .

# Commit
git commit -m "Your commit message"

# דחוף ל-master
git push origin master
```

### אם Production Branch הוא `main`:
```bash
# שנה את שם ה-branch ל-main (אם צריך)
git branch -M main

# או צור branch חדש בשם main
git checkout -b main

# הוסף את השינויים
git add .

# Commit
git commit -m "Your commit message"

# דחוף ל-main
git push origin main
```

## איך לבדוק שהכל עובד

1. **דחוף את השינויים:**
   ```bash
   git push origin master  # או main - תלוי בהגדרות
   ```

2. **בדוק ב-Vercel:**
   - לך ל-Vercel Dashboard → Deployments
   - אתה אמור לראות deployment חדש שנוצר אוטומטית
   - אם אתה רואה "Building..." או "Ready" - זה עובד!

3. **אם לא נוצר deployment אוטומטי:**
   - בדוק ש-Vercel מחובר ל-repository הנכון
   - בדוק ש-Webhook מוגדר ב-GitHub
   - נסה לעשות manual deploy: Vercel Dashboard → Deployments → "Redeploy"

## טיפים

- **Preview Deployments**: כל push ל-branch שאינו production יוצר preview deployment
- **Production Deployments**: רק push ל-production branch יוצר production deployment
- **Pull Requests**: Vercel יוצר preview deployment אוטומטית לכל PR

