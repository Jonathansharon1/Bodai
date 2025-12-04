# Step-by-Step Translation Implementation Guide

## Overview
This document provides a **systematic, foolproof process** to ensure no translation strings are missed across the entire app.

---

## Step 1: Run the Audit Script

```bash
cd client
node ../scripts/find-hardcoded-strings.js
```

This will:
- Scan all `.jsx` and `.js` files in `client/src`
- Find potential hardcoded user-facing strings
- List files that have text but don't import `useTranslation`
- Give you a starting point for what needs work

**Action**: Review the output and update `COMPREHENSIVE_TRANSLATION_AUDIT.md` with findings.

---

## Step 2: Pick One Component/Page

Start with the **highest priority** unfinished component from the audit plan.

**Recommended order**:
1. Finish `AnalysisResult.jsx` (partially done)
2. Finish `AnalysisPage.jsx` (partially done)
3. Then `PracticePage.jsx`
4. Then `OnboardingPage.jsx`
5. Continue down the list...

---

## Step 3: Deep Audit of Selected Component

### A. Open the Component File

Read through the entire file and identify **every user-facing string**:

1. **Create a checklist** in a temporary file or notes:
   ```
   Component: AnalysisResult.jsx
   
   Strings found:
   - Line 45: "Your Video Analysis" (h1)
   - Line 67: "Overall Score" (label)
   - Line 89: "Key Strengths" (section title)
   - Line 102: "Show more" (button)
   - ... etc
   ```

2. **Check for edge cases**:
   - Conditional text: `{condition ? 'Yes' : 'No'}`
   - Dynamic strings: `"Hello " + name`
   - Error messages: `throw new Error('...')`
   - Toast notifications
   - Tooltips/aria-labels
   - Empty states
   - Loading messages

### B. Check Child Components

If the component imports other components, check those too:
- `AnalysisResult` might use `TopStrengthCard` → check that component
- `Dashboard` uses `EmptyState` → check that component

**Action**: Add child components to your audit list if they have hardcoded strings.

---

## Step 4: Create/Update Translation Keys

### A. Open Translation Files

Open both:
- `client/src/locales/en/translation.json`
- `client/src/locales/he/translation.json`

### B. Add Keys Following the Structure

Use the existing namespace pattern:
- `analysisResult.*` for AnalysisResult component
- `practicePage.*` for PracticePage
- `onboarding.*` for OnboardingPage
- etc.

**Key naming convention**:
- Use descriptive names: `analysisResult.overallScore` not `analysisResult.text1`
- Group related keys: `analysisResult.strengths.title`, `analysisResult.strengths.empty`
- Use camelCase: `showMore` not `show-more`

### C. Add Both English and Hebrew

For each key:
1. Add to `en/translation.json` with the English text
2. Add to `he/translation.json` with natural Hebrew translation
3. **Don't do literal word-for-word** - translate meaning and tone

**Example**:
```json
// en/translation.json
"analysisResult": {
  "overallScore": "Overall Score",
  "showMore": "Show more"
}

// he/translation.json
"analysisResult": {
  "overallScore": "ציון כולל",
  "showMore": "הצג עוד"
}
```

---

## Step 5: Update the Component Code

### A. Import useTranslation

At the top of the component:
```javascript
import { useTranslation } from 'react-i18next';
```

### B. Get the `t` function

Inside the component:
```javascript
const { t } = useTranslation();
```

### C. Replace All Hardcoded Strings

For each string you found in Step 3:

**Before**:
```jsx
<h1>Your Video Analysis</h1>
```

**After**:
```jsx
<h1>{t('analysisResult.title')}</h1>
```

**For strings with variables**:
```jsx
// Before
<p>Score: {score}/10</p>

// After
<p>{t('analysisResult.score', { score })}</p>
```

**For conditional text**:
```jsx
// Before
{isExpanded ? 'Show less' : 'Show more'}

// After
{isExpanded ? t('common.showLess') : t('common.showMore')}
```

### D. Handle Pluralization (if needed)

```jsx
// Before
{count} {count === 1 ? 'item' : 'items'}

// After
{t('items.count', { count })}
```

In translation files:
```json
"items": {
  "count": "{{count}} item",
  "count_plural": "{{count}} items"
}
```

---

## Step 6: Verify in Browser

### A. Start Dev Server

```bash
cd client
npm start
```

### B. Test in English

1. Navigate to the component/page
2. Verify all text appears correctly
3. Check that no translation keys are showing (like `analysisResult.title`)

### C. Switch to Hebrew

1. Use the language switcher
2. Navigate to the same page
3. **Check every string**:
   - Does it appear in Hebrew?
   - Does it make sense?
   - Is the tone appropriate?
   - Are there any layout issues (text overflow, alignment)?

### D. Test Edge Cases

- Empty states
- Loading states
- Error states
- Different data scenarios (e.g., no analyses vs. many analyses)

---

## Step 7: Check RTL Layout

### A. Visual Inspection

In Hebrew mode, check:
- [ ] Text is right-aligned
- [ ] Icons/arrows are flipped if needed
- [ ] Buttons look good
- [ ] Forms are readable
- [ ] Cards/sections align properly
- [ ] Numbers/dates display correctly

### B. Add RTL CSS if Needed

If something looks off, add scoped CSS:
```css
[dir="rtl"] .myComponent__title {
  text-align: right;
}

[dir="rtl"] .myComponent__icon {
  transform: scaleX(-1); /* Flip icon */
}
```

**Important**: Only add RTL-specific CSS. Don't break English layout.

---

## Step 8: Update Documentation

### A. Mark Component as Complete

In `COMPREHENSIVE_TRANSLATION_AUDIT.md`:
- [x] Mark the component as done
- Add notes if there were any special considerations

### B. Update Translation Coverage

Track:
- How many strings were translated
- Any edge cases handled
- Any components that need follow-up work

---

## Step 9: Move to Next Component

Repeat Steps 2-8 for the next component in your priority list.

---

## Step 10: Final Verification

After completing all components:

### A. Run Audit Script Again

```bash
node scripts/find-hardcoded-strings.js
```

Should show minimal or no issues.

### B. Full App Walkthrough

1. Switch to Hebrew
2. Navigate through **every route**:
   - Homepage
   - Sign In
   - Sign Up
   - Onboarding
   - Dashboard
   - My Analyses
   - My Progress
   - Practice
   - Courses
   - Settings
   - Subscription
   - Pricing
   - Teams Contact
3. **Document any English text** you find
4. Fix immediately

### C. Test Language Switching

1. Start in English
2. Switch to Hebrew mid-session
3. Verify all text updates immediately
4. Switch back to English
5. Verify everything works

---

## Common Pitfalls to Avoid

### ❌ Don't Translate:
- Console.log messages (unless user-facing)
- Code comments
- Variable names
- CSS class names
- API endpoints
- Technical error codes

### ✅ Do Translate:
- All visible text in UI
- Error messages shown to users
- Toast notifications
- Tooltips
- Form validation messages
- Empty state messages
- Loading messages

### ⚠️ Be Careful With:
- **Third-party components** (Clerk, recharts): May need separate configuration
- **Dynamic content from API**: Should already be in Hebrew if language is set correctly
- **Date/number formatting**: Use locale-aware functions
- **URLs/routes**: Usually keep in English, but check if needed

---

## Quality Checklist

Before marking a component as complete, verify:

- [ ] All user-facing strings use `t()`
- [ ] Translation keys exist in both `en` and `he` files
- [ ] Hebrew translations sound natural
- [ ] RTL layout looks correct
- [ ] No console errors
- [ ] Works in both English and Hebrew
- [ ] Edge cases handled (empty, loading, error states)
- [ ] Child components are also translated (if applicable)

---

## Getting Help

If you're stuck:
1. Check existing translated components for patterns
2. Review `docs/i18n-ux-my-progress.md` for UX brief example
3. Look at `i18n.js` to understand the setup
4. Test in browser to see what's missing

---

## Next Steps After Completion

1. Set up ESLint rule to warn about hardcoded strings (future)
2. Add automated tests for translation coverage (future)
3. Create style guide for Hebrew translations
4. Document any special translation patterns used

