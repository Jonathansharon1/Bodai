# Comprehensive Translation Audit Plan

## Goal
Ensure **zero hardcoded English strings** remain in the entire web app. Every user-facing text must be translatable.

---

## Phase 1: Complete Component Inventory

### A. Pages (Route-level components)
- [x] `pages/AnalysisPage.jsx` - Partially done
- [x] `pages/Dashboard.jsx` - Done
- [x] `pages/MyAnalysesPage.jsx` - Done
- [x] `pages/MyProgressPage.jsx` - Done
- [ ] `pages/PracticePage.jsx`
- [ ] `pages/CoursesPage.jsx`
- [ ] `pages/OnboardingPage.jsx`
- [ ] `pages/SettingsPage.jsx` - Partially done (language switcher added)
- [ ] `pages/SubscriptionPage.jsx`
- [ ] `pages/PricingPage.jsx`
- [ ] `pages/SignInPage.jsx`
- [ ] `pages/SignUpPage.jsx`
- [ ] `pages/TeamsContactPage.jsx`

### B. Layout Components
- [x] `components/layout/Header.jsx` - Done
- [x] `components/layout/Sidebar.jsx` - Done
- [ ] `components/layout/DashboardHeader.jsx`

### C. Homepage/Marketing Components
- [ ] `components/hero/Hero.jsx`
- [ ] `components/homepage/FeaturesSection.jsx`
- [ ] `components/homepage/HowItWorksSection.jsx`
- [ ] `components/homepage/SocialProofSection.jsx`
- [ ] `components/homepage/CTASection.jsx`
- [ ] `components/WelcomeScreen.jsx`

### D. Core Feature Components
- [x] `components/UploadVideo.jsx` - Done
- [x] `components/AnalysisResult.jsx` - Partially done
- [ ] `components/ReflectionPrompt.jsx`
- [ ] `components/analysis/NextStepsPreview.jsx`
- [ ] `components/analysis/QuickSummary.jsx`
- [ ] `components/analysis/TopOpportunityCard.jsx`
- [ ] `components/analysis/TopStrengthCard.jsx`
- [ ] `components/analysis/CategoryOverview.jsx`
- [ ] `components/analysis/ScoreCardHero.jsx`
- [ ] `components/BeforeAfterComparison.jsx`
- [ ] `components/FirstUploadGuide.jsx`

### E. Practice & Journey Components
- [ ] `components/PracticeCommitmentAlert.jsx`
- [ ] `components/OnboardingQuestions.jsx`
- [ ] `components/onboarding/JourneyPreviewCard.jsx`
- [ ] `components/JourneySwitcher.jsx`

### F. Shared/Utility Components
- [ ] `components/EmptyState.jsx`
- [ ] `components/LoadingSpinner.jsx`
- [ ] `components/LoadingView.jsx`
- [ ] `components/SkeletonLoader.jsx`
- [ ] `components/UpgradeModal.jsx`
- [ ] `components/CelebrationModal.jsx`
- [ ] `components/VideoPlayer.jsx`
- [ ] `components/Logo.jsx`
- [ ] `components/LanguageSwitcher.jsx` - Done (but verify all strings)

### G. Pricing Components
- [ ] `components/pricing/PricingCard.jsx`

### H. Router & Config
- [ ] `AppRouter.jsx` - Check for any hardcoded strings in route handling
- [ ] `config/recordingPrompts.js` - Check if prompts need translation

---

## Phase 2: Systematic Audit Process

### Step 1: Automated String Detection

For each component file, search for:
1. **String literals in JSX**:
   - Pattern: `"text"` or `'text'` inside JSX
   - Pattern: `{ "text" }` or `{ 'text' }`
   - Pattern: Template literals: `` `text ${var}` ``

2. **String literals in JavaScript**:
   - `alert('...')`, `console.log('...')` (usually OK to skip)
   - `throw new Error('...')` (may need translation for user-facing errors)
   - `title: '...'`, `label: '...'` in objects

3. **Common patterns to find**:
   ```javascript
   // BAD - hardcoded
   <h1>Welcome</h1>
   <button>Click me</button>
   <p>Error: {error}</p>
   
   // GOOD - translatable
   <h1>{t('welcome.title')}</h1>
   <button>{t('button.click')}</button>
   <p>{t('error.message', { error })}</p>
   ```

### Step 2: Manual Review Checklist

For each component, verify:
- [ ] All `<h1>`, `<h2>`, `<h3>`, etc. use `t()`
- [ ] All `<p>`, `<span>`, `<div>` with visible text use `t()`
- [ ] All `<button>`, `<a>` labels use `t()`
- [ ] All `placeholder` attributes use `t()`
- [ ] All `aria-label` attributes use `t()`
- [ ] All `title` attributes (tooltips) use `t()`
- [ ] All `alt` text for images use `t()`
- [ ] All error messages shown to users use `t()`
- [ ] All empty state messages use `t()`
- [ ] All loading messages use `t()`
- [ ] All form labels use `t()`
- [ ] All validation messages use `t()`
- [ ] All date/time formatting uses locale-aware functions
- [ ] All number formatting uses locale-aware functions

### Step 3: Edge Cases to Check

- [ ] **Conditional text**: `{condition ? 'Yes' : 'No'}` → use `t()` for both
- [ ] **Pluralization**: `{count} item(s)` → use i18next plural rules
- [ ] **Dynamic strings**: `"Hello " + name` → use interpolation: `t('greeting', { name })`
- [ ] **Nested components**: Check child components for hardcoded strings
- [ ] **Third-party components**: Clerk UI, recharts tooltips, etc. (may need separate config)
- [ ] **Error boundaries**: Error messages shown to users
- [ ] **Toast notifications**: Success/error messages
- [ ] **Modal dialogs**: Titles, buttons, messages
- [ ] **Tooltips**: All hover text
- [ ] **Chart labels**: Axis labels, legends, tooltips

---

## Phase 3: Verification Process

### A. Automated Checks

1. **Grep for common patterns**:
   ```bash
   # Find hardcoded strings in JSX (simple pattern)
   grep -r '>[A-Z][a-z]' client/src --include="*.jsx" | grep -v 't('
   
   # Find string literals that might be user-facing
   grep -r '"[A-Z][^"]{10,}"' client/src --include="*.jsx" | grep -v 't('
   ```

2. **Check for missing i18n imports**:
   ```bash
   # Files with user-facing text but no useTranslation
   grep -L 'useTranslation' client/src/**/*.jsx | xargs grep -l '>[A-Z]'
   ```

### B. Manual Verification

1. **Run the app in Hebrew mode**
2. **Navigate through every route/page**
3. **Check every screen for English text**
4. **Document any missed strings** in this file

### C. Translation Coverage Report

For each component, track:
- Total user-facing strings found: ___
- Strings using `t()`: ___
- Strings still hardcoded: ___
- Status: ✅ Complete / ⚠️ Partial / ❌ Not started

---

## Phase 4: Implementation Order

### Priority 1: Core User Flows (Already in progress)
1. ✅ Dashboard
2. ✅ My Analyses
3. ✅ My Progress
4. ✅ Upload Video
5. ⚠️ Analysis Result (partially done)

### Priority 2: Practice & Learning
6. Practice Page
7. Courses Page
8. Onboarding Flow
9. Practice-related components

### Priority 3: Account & Settings
10. Settings Page (finish)
11. Subscription Page
12. Auth Pages (Sign In/Up)

### Priority 4: Marketing & Public
13. Homepage (Hero, Features, How It Works, etc.)
14. Pricing Page
15. Teams Contact Page

### Priority 5: Shared Components
16. Empty States
17. Loading Components
18. Modals (Upgrade, Celebration, etc.)
19. Utility Components

---

## Phase 5: Quality Assurance

### A. Translation Quality Checks
- [ ] All Hebrew translations sound natural (not literal word-for-word)
- [ ] Tone is consistent across pages
- [ ] Technical terms are consistent (e.g., "Analysis" always = "ניתוח")
- [ ] Button labels are action-oriented in Hebrew
- [ ] Error messages are helpful in Hebrew

### B. RTL Layout Checks
- [ ] All text aligns correctly (right-aligned in Hebrew)
- [ ] Icons/arrows flip appropriately
- [ ] Numbers and dates display correctly
- [ ] Forms look good in RTL
- [ ] Charts/graphs are readable in RTL

### C. Functionality Checks
- [ ] Language switcher works on all pages
- [ ] User preference persists across sessions
- [ ] AI responses are in Hebrew when Hebrew is selected
- [ ] Date/number formatting uses Hebrew locale
- [ ] No console errors related to missing translations

---

## Phase 6: Maintenance

### Ongoing Process
1. **Before adding new features**: Add translation keys first
2. **Code review**: Check for hardcoded strings
3. **Regular audits**: Run this process quarterly
4. **User feedback**: Note any awkward Hebrew phrasing

### Tools to Use
- ESLint rule to warn about hardcoded strings (future enhancement)
- Automated tests that check for `t()` usage (future enhancement)
- Translation coverage script (future enhancement)

---

## Current Status Tracker

### Completed ✅
- Header
- Sidebar
- Dashboard (main component)
- My Analyses Page
- My Progress Page
- Upload Video Component
- Settings Page (language switcher)

### In Progress ⚠️
- Analysis Result Component
- Analysis Page

### Not Started ❌
- All other components listed above

---

## Next Steps

1. **Complete Analysis Result & Analysis Page** (finish Priority 1)
2. **Audit Practice Page** (start Priority 2)
3. **Create UX briefs** for each major page (like My Progress)
4. **Systematically work through** each component in order
5. **Verify in Hebrew mode** after each batch

