## Code quality and dead code policy

### Typography system

- Primary body font: `--font-sans` (Inter-based stack).
- Display/brand font: `--font-display` (Space Grotesk) for brand + top-level headings.
- Semantic type scale (from `index.css`):
  - `.text-display` → hero/marketing headlines.
  - `.text-h1` → page titles (dashboard, practice, progress, pricing, subscription).
  - `.text-h2` → section or card titles.
  - `.text-h3` → smaller headings and strong labels.
  - `.text-body` → main copy, labels, most text.
  - `.text-caption` → helper text, hints, chips/badges (uppercase, tracking).

When adding new UI:
- Reuse these sizes/weights instead of hardcoding new `font-size` values where possible.
- Prefer `var(--text-dark)` / `var(--text-muted)` for text colors.

### Linting and static checks

- Run `npm run lint` inside the `client` folder before opening a PR that touches the frontend.
- Fix all reported unused variables/imports instead of disabling the rule, unless there is a strong reason (e.g., intentional future API).

### Deprecation and removal process

1. **Deprecate first**
   - When you suspect a component/page/helper is no longer needed, add a clear comment at the top of the file:
     - `// DEPRECATED: no references as of YYYY-MM-DD`
     - or `// CANDIDATE FOR REMOVAL: verify no dynamic usage`
   - Prefer deprecating whole features (page + components) rather than leaving small islands of code behind.

2. **Verify usage**
   - Confirm there are no imports/usages by:
     - Searching across the repo for the symbol name.
     - Verifying it is not used via dynamic `import()` or string-based registries.

3. **Remove safely**
   - Remove dead code in **small, reviewable PRs** (for example, 3–5 components/pages at a time).
   - After each removal, manually test the main user flows:
     - Authentication (sign-in / sign-up)
     - Onboarding
     - Dashboard, analyses, practice, pricing/subscription

4. **Database changes**
   - Treat schema changes as a separate step:
     - First, stop writing to a table/column from the app.
     - After a period of stability in production, add a migration that drops the unused table/column.
   - Clearly document destructive migrations with comments explaining why the object is safe to drop.


