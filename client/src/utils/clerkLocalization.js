import i18n from '../i18n';
import { heIL, enUS } from '@clerk/localizations';

/**
 * Get Clerk localization object based on current i18n language
 * 
 * This function returns a complete localization object that:
 * 1. Uses the base locale (heIL or enUS) from @clerk/localizations
 * 2. Overrides specific keys for custom text (title, labels, buttons)
 * 3. Ensures proper structure for Clerk components
 */
export const getClerkLocalization = (lang) => {
  const currentLang = lang || i18n.language || 'en';
  const isHebrew = currentLang === 'he' || currentLang.startsWith('he');
  
  // Get base localization from Clerk's official package
  const base = isHebrew ? heIL : enUS;

  // Build complete localization object with overrides
  // Spread base first to get all defaults, then override specific keys
  const localization = {
    ...base, // Spread all base translations first
    locale: isHebrew ? 'he' : 'en', // Set locale (short form)

    // Override signIn.start.title and subtitle
    signIn: {
      ...base.signIn, // Keep all signIn defaults
      start: {
        ...(base.signIn?.start || {}), // Keep all start defaults
        title: isHebrew ? 'התחבר ל-BodAI' : 'Sign in to BodAI',
        subtitle: '', // Hide subtitle completely
      },
    },

    // Override signUp.start.title and subtitle
    signUp: {
      ...base.signUp, // Keep all signUp defaults
      start: {
        ...(base.signUp?.start || {}), // Keep all start defaults
        title: isHebrew ? 'הצטרף ל-BodAI' : 'Create your BodAI account',
        subtitle: '', // Hide subtitle completely
      },
    },

    // Global form field labels (at root level, not inside signIn)
    formFieldLabel__emailAddress: isHebrew ? 'כתובת אימייל' : 'Email address',
    formFieldLabel__identifier: isHebrew ? 'כתובת אימייל' : 'Email address',
    formFieldLabel__password: isHebrew ? 'סיסמה' : 'Password',
    
    // Global form button labels
    formButtonPrimary: isHebrew ? 'המשך' : 'Continue',
    formButtonPrimary__continue: isHebrew ? 'המשך' : 'Continue',

    // Social login buttons
    socialButtonsBlockButton__google: isHebrew ? 'המשך עם Google' : 'Continue with Google',
    socialButtonsBlockButton__facebook: isHebrew ? 'המשך עם Facebook' : 'Continue with Facebook',
    socialButtonsBlockButton: isHebrew ? 'המשך עם {{provider}}' : 'Continue with {{provider}}',

    // Divider text
    dividerText: isHebrew ? 'או' : 'or',

    // Hide footer text and links
    footerActionText: '',
    footerActionLink: '',
  };

  return localization;
};

