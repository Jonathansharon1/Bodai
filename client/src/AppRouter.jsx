import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import OnboardingPage from './pages/OnboardingPage';
import AnalysisPage from './pages/AnalysisPage';
import Dashboard from './components/Dashboard';
import MyAnalysesPage from './pages/MyAnalysesPage';
import MyProgressPage from './pages/MyProgressPage';
import PracticePage from './pages/PracticePage';
import PricingPage from './pages/PricingPage';
import SubscriptionPage from './pages/SubscriptionPage';
import CoursesPage from './pages/CoursesPage';
import SettingsPage from './pages/SettingsPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Hero from './components/hero/Hero';
import UpgradeModal from './components/UpgradeModal';
import FeaturesSection from './components/homepage/FeaturesSection';
import HowItWorksSection from './components/homepage/HowItWorksSection';
import SocialProofSection from './components/homepage/SocialProofSection';
import CTASection from './components/homepage/CTASection';
import WelcomeScreen from './components/WelcomeScreen';
import { SignedOut } from '@clerk/clerk-react';
import TeamsContactPage from './pages/TeamsContactPage';

// Protected Route Component
function ProtectedRoute({ children, requireOnboarding = false }) {
  const { user, isLoaded: userLoaded } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userContext, setUserContext] = useState(null);

  // Clear Clerk redirect URLs IMMEDIATELY on mount, before any other logic runs
  // This must run first to prevent Clerk from applying stored redirect URLs
  useEffect(() => {
    // Only clear if we're on a protected route (not sign-in/sign-up)
    const isAuthPage = location.pathname === '/sign-in' || 
                       location.pathname === '/sign-up' || 
                       location.pathname.startsWith('/sign-in/') || 
                       location.pathname.startsWith('/sign-up/');
    
    if (!isAuthPage) {
      try {
        // Clear ALL Clerk-related redirect URLs from sessionStorage
        const keysToRemove = [];
        Object.keys(sessionStorage).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('clerk') && 
              (lowerKey.includes('redirect') || 
               lowerKey.includes('aftersign') ||
               lowerKey.includes('signin') ||
               lowerKey.includes('signup'))) {
            keysToRemove.push(key);
          }
        });
        keysToRemove.forEach(key => {
          console.log('[ProtectedRoute] Clearing Clerk redirect key:', key);
          sessionStorage.removeItem(key);
        });
        
        // Also clear from localStorage (Clerk might store there too)
        Object.keys(localStorage).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('clerk') && 
              (lowerKey.includes('redirect') || lowerKey.includes('aftersign'))) {
            console.log('[ProtectedRoute] Clearing Clerk redirect key from localStorage:', key);
            localStorage.removeItem(key);
          }
        });
        
        // Clear redirect URLs from URL params
        const urlParams = new URLSearchParams(window.location.search);
        let urlChanged = false;
        if (urlParams.has('__clerk_redirect_url')) {
          urlParams.delete('__clerk_redirect_url');
          urlChanged = true;
        }
        if (urlParams.has('redirect_url')) {
          urlParams.delete('redirect_url');
          urlChanged = true;
        }
        if (urlChanged) {
          const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          window.history.replaceState({}, '', newUrl);
        }
      } catch (e) {
        console.error('[ProtectedRoute] Error clearing redirect URLs:', e);
      }
    }
  }, [location.pathname]); // Run whenever pathname changes

  useEffect(() => {
    if (!userLoaded) return;

    if (!user) {
      // User not signed in - redirect to home
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
      return;
    }

    // Check onboarding status
    const checkOnboarding = async () => {
      setCheckingOnboarding(true);
      try {
        // Send user profile data from Clerk to sync with database
        const headers = {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json'
        };
        
        // Add user profile data to headers for syncing
        if (user.emailAddresses?.[0]?.emailAddress) {
          headers['X-User-Email'] = user.emailAddresses[0].emailAddress;
        }
        if (user.firstName) {
          headers['X-User-First-Name'] = user.firstName;
        }
        if (user.lastName) {
          headers['X-User-Last-Name'] = user.lastName;
        }
        if (user.phoneNumbers?.[0]?.phoneNumber) {
          headers['X-User-Phone'] = user.phoneNumbers[0].phoneNumber;
        }
        if (user.imageUrl) {
          headers['X-User-Image-Url'] = user.imageUrl;
        }
        
        const res = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:5000/api/user/profile', {
          headers
        });

        if (res.ok) {
          const data = await res.json();
          const userProfile = data.user;
          const completed = userProfile?.onboarding_completed_at != null;
          setHasCompletedOnboarding(completed);

          if (completed && userProfile.primary_goal) {
            const context = {
              primaryGoal: userProfile.primary_goal,
              confidenceLevel: userProfile.confidence_level || 'medium'
            };
            if (userProfile.goal_specific_context) {
              context.goalSpecificContext = userProfile.goal_specific_context;
            }
            setUserContext(context);
            localStorage.setItem('bodai_questions_completed', 'true');
            localStorage.setItem('bodai_user_context', JSON.stringify(context));
          }
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('bodai_questions_completed');
          const savedContext = localStorage.getItem('bodai_user_context');
          setHasCompletedOnboarding(saved === 'true');
          if (savedContext) {
            setUserContext(JSON.parse(savedContext));
          }
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        const saved = localStorage.getItem('bodai_questions_completed');
        const savedContext = localStorage.getItem('bodai_user_context');
        setHasCompletedOnboarding(saved === 'true');
        if (savedContext) {
          setUserContext(JSON.parse(savedContext));
        }
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [user, userLoaded, navigate, location.pathname]);

  // Handle redirects in useEffect to avoid setState during render
  // This must be before any early returns to satisfy React Hook rules
  useEffect(() => {
    if (!userLoaded || checkingOnboarding || !user) return;

    // Only redirect if we're actually on the onboarding page and have completed it
    // OR if we need onboarding but haven't completed it (and we're not already on onboarding)
    const isOnOnboardingPage = location.pathname === '/onboarding';
    const currentPath = location.pathname;
    
    // Add detailed logging to understand what's happening
    console.log('[ProtectedRoute] Redirect check:', {
      requireOnboarding,
      hasCompletedOnboarding,
      isOnOnboardingPage,
      currentPath,
      userLoaded,
      checkingOnboarding
    });
    
    if (requireOnboarding && !hasCompletedOnboarding) {
      // Redirect to onboarding if required but not completed
      if (!isOnOnboardingPage) {
        console.log('[ProtectedRoute] Redirecting to onboarding - requireOnboarding=true, hasCompletedOnboarding=false, current path:', currentPath);
        navigate('/onboarding', { replace: true });
      }
    } else if (!requireOnboarding && hasCompletedOnboarding) {
      // Only handle onboarding redirect if we're actually on the onboarding page
      // This prevents redirects when on other pages like /practice, /grades, etc.
      // CRITICAL: Only redirect if we're actually on /onboarding route
      // This ProtectedRoute instance is for /onboarding route (requireOnboarding=false)
      if (isOnOnboardingPage) {
        // Already completed onboarding, redirect to dashboard
        // BUT ONLY if we're actually on the onboarding page
        console.log('[ProtectedRoute] Redirecting from onboarding to dashboard - already completed, current path:', currentPath, 'requireOnboarding:', requireOnboarding);
        navigate('/dashboard', { replace: true });
      } else {
        // We're not on onboarding page, so don't redirect
        // This allows users to stay on /practice, /grades, etc. when refreshing
        // This should never happen for /onboarding route's ProtectedRoute, but log it anyway
        console.log('[ProtectedRoute] NOT redirecting - staying on:', currentPath, '(not on onboarding page, requireOnboarding=false, hasCompletedOnboarding=true)');
      }
    } else {
      // Log when we're NOT redirecting to help debug
      if (requireOnboarding && hasCompletedOnboarding && !isOnOnboardingPage) {
        console.log('[ProtectedRoute] NOT redirecting - staying on:', currentPath, '(requireOnboarding=true, hasCompletedOnboarding=true, not on onboarding page)');
      }
    }
    // IMPORTANT: If we're on other pages (like /practice, /grades, /analyses), do NOT redirect
    // This allows users to stay on those pages when refreshing
  }, [userLoaded, checkingOnboarding, user, requireOnboarding, hasCompletedOnboarding, location.pathname, navigate]);

  if (!userLoaded || checkingOnboarding) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#666', fontSize: '14px' }}>Loading...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (requireOnboarding && !hasCompletedOnboarding) {
    // Show loading while redirecting
    if (location.pathname !== '/onboarding') {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#666', fontSize: '14px' }}>Redirecting...</p>
        </div>
      );
    }
  }

  // Only show redirecting message if we're actually on the onboarding page
  if (!requireOnboarding && hasCompletedOnboarding && location.pathname === '/onboarding') {
    // Show loading while redirecting
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#666', fontSize: '14px' }}>Redirecting...</p>
      </div>
    );
  }
  
  // IMPORTANT: Do NOT redirect if we're on other pages - just render the children
  // This allows users to stay on /practice, /grades, /analyses, etc. when refreshing

  return children;
}

// Onboarding Page with Welcome Screen Check
function OnboardingPageWithWelcome({ onComplete }) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(() => {
    // Check if user has seen welcome screen
    return !localStorage.getItem('bodai_welcome_seen');
  });

  const handleWelcomeContinue = () => {
    setShowWelcome(false);
  };

  const handleWelcomeSkip = () => {
    setShowWelcome(false);
    navigate('/dashboard');
  };

  if (showWelcome && user) {
    return (
      <WelcomeScreen 
        onContinue={handleWelcomeContinue}
        onSkip={handleWelcomeSkip}
      />
    );
  }

  return <OnboardingPage onComplete={onComplete} />;
}

// Homepage Route Component - handles conditional rendering
// Note: Authenticated users can visit the homepage - Clerk handles redirects from sign-in/sign-up pages
function HomepageRoute({ user, isLoaded, navigate, onNewAnalysis }) {
  const location = useLocation();
  const isSignedIn = !!user;

  // Prevent unwanted redirects when on homepage
  useEffect(() => {
    if (location.pathname === '/' && isLoaded) {
      console.log('[HomepageRoute] Mounted on homepage, user signed in:', !!user);
      
      // Clear any potential redirect URLs from Clerk in URL params
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('__clerk_redirect_url') || urlParams.has('redirect_url')) {
        console.log('[HomepageRoute] Found redirect URL in params, clearing it');
        urlParams.delete('__clerk_redirect_url');
        urlParams.delete('redirect_url');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }
      
      // Clear any Clerk redirect state from sessionStorage
      try {
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('redirect') || key.includes('clerk_redirect')) {
            console.log('[HomepageRoute] Found redirect key in sessionStorage:', key, '- clearing it');
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        // Ignore errors
      }
      
      // Monitor for any navigation away from homepage
      const currentPath = window.location.pathname;
      if (currentPath !== '/') {
        console.warn('[HomepageRoute] WARNING: Current path is not "/" but', currentPath, '- this should not happen!');
      }
    }
  }, [location.pathname, isLoaded, user]);

  return (
    <>
      <Header />
      <Hero isSignedIn={isSignedIn} onNewAnalysis={onNewAnalysis} />
      <div id="try">
        <FeaturesSection />
        <HowItWorksSection />
        <SocialProofSection />
        <CTASection isSignedIn={isSignedIn} />
      </div>
    </>
  );
}

export default function AppRouter() {
  const { user, isLoaded: userLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [userContext, setUserContext] = useState(null);
  const [viewingAnalysis, setViewingAnalysis] = useState(null);
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [journeys, setJourneys] = useState([]);
  const [journeysLoading, setJourneysLoading] = useState(true);
  const [activeJourneyId, setActiveJourneyId] = useState(null);
  const [practiceCompletionNotices, setPracticeCompletionNotices] = useState([]);
  const [hasCompletedAnalysis, setHasCompletedAnalysis] = useState(() => localStorage.getItem('bodai_has_completed_analysis') === 'true');
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Note: Clerk handles redirects via afterSignInUrl and afterSignUpUrl
  // We don't need custom redirect logic here - authenticated users can visit the homepage

  // Load user context from localStorage on mount
  useEffect(() => {
    const savedContext = localStorage.getItem('bodai_user_context');
    if (savedContext) {
      try {
        setUserContext(JSON.parse(savedContext));
      } catch (e) {
        console.warn('Failed to parse saved context:', e);
      }
    }
  }, []);

  const syncUserContextFromJourney = useCallback((journey) => {
    if (!journey) return;
    const context = {
      primaryGoal: journey.focus_slug || 'general',
      confidenceLevel: journey.confidence_level || 'medium'
    };
    if (journey.goal_context) {
      context.goalSpecificContext = journey.goal_context;
    }
    setUserContext(context);
    localStorage.setItem('bodai_user_context', JSON.stringify(context));
  }, []);

  const fetchJourneys = useCallback(async () => {
    if (!user?.id) {
      setJourneys([]);
      setActiveJourneyId(null);
      setJourneysLoading(false);
      return;
    }

    setJourneysLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/journeys`, {
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const journeyList = Array.isArray(data.journeys) ? data.journeys : [];
        setJourneys(journeyList);
        
        // Check URL first, then localStorage, then default
        const searchParams = new URLSearchParams(location.search);
        const urlJourneyId = searchParams.get('journey');
        let nextActive = null;
        
        if (urlJourneyId && journeyList.some(j => j.id === urlJourneyId)) {
          // URL has a valid journey ID
          nextActive = urlJourneyId;
        } else {
          // Fall back to localStorage or default
          const storedActive = localStorage.getItem('bodai_active_journey');
          nextActive = storedActive && journeyList.some(j => j.id === storedActive) ? storedActive : null;
          if (!nextActive && journeyList.length > 0) {
            nextActive = (journeyList.find(j => j.is_default) || journeyList[0]).id;
          }
          
          // Update URL if we're on a journey page and have a journey selected
          const journeyPages = ['/dashboard', '/my-progress', '/grades', '/analyses'];
          if (nextActive && journeyPages.includes(location.pathname)) {
            const newSearchParams = new URLSearchParams(location.search);
            newSearchParams.set('journey', nextActive);
            navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
          }
        }
        
        if (nextActive) {
          localStorage.setItem('bodai_active_journey', nextActive);
          const activeJourney = journeyList.find(j => j.id === nextActive);
          if (activeJourney) {
            syncUserContextFromJourney(activeJourney);
          }
        }
        setActiveJourneyId(nextActive);
      }
    } catch (err) {
      console.error('Failed to fetch journeys:', err);
    } finally {
      setJourneysLoading(false);
    }
  }, [apiBase, user?.id, syncUserContextFromJourney, location.search, location.pathname, navigate]);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  useEffect(() => {
    // Only redirect to onboarding if:
    // 1. Journeys are fully loaded (not loading) - `journeysLoading` is false
    // 2. User is signed in
    // 3. There are no journeys
    // 4. We're NOT already on onboarding
    // 5. We're NOT on the homepage (/) - allow users to stay on homepage
    // 6. We're NOT on other protected routes (like /practice, /grades, etc.) - allow users to stay on those pages
    // IMPORTANT: This prevents redirecting when refreshing any page
    const protectedRoutes = ['/dashboard', '/practice', '/grades', '/analyses', '/my-progress', '/settings', '/subscription', '/new-analysis'];
    const isOnProtectedRoute = protectedRoutes.some(route => location.pathname.startsWith(route));
    const isAnalysisRoute = location.pathname.startsWith('/analysis/');
    const isHomepage = location.pathname === '/';
    const isAuthPage = location.pathname === '/sign-in' || location.pathname === '/sign-up' || 
                       location.pathname.startsWith('/sign-in/') || location.pathname.startsWith('/sign-up/');
    
    // Only redirect to onboarding if we're on a route that should redirect (not homepage, not protected routes, not auth pages)
    if (!journeysLoading && user?.id && journeys.length === 0 && 
        location.pathname !== '/onboarding' && 
        !isOnProtectedRoute && 
        !isAnalysisRoute &&
        !isHomepage &&
        !isAuthPage) {
      console.log('[AppRouter] Redirecting to onboarding - no journeys found, current path:', location.pathname);
      navigate('/onboarding');
    } else if ((isOnProtectedRoute || isHomepage) && journeys.length === 0 && !journeysLoading) {
      // If we're on a protected route or homepage but have no journeys, don't redirect - just let the page handle it
      console.log('[AppRouter] On protected route or homepage with no journeys, staying on:', location.pathname);
    }
  }, [journeysLoading, journeys.length, user?.id, navigate, location.pathname]);

  useEffect(() => {
    if (!user?.id || hasCompletedAnalysis) return;

    const controller = new AbortController();
    const detectExistingAnalysis = async () => {
      try {
        const res = await fetch(`${apiBase}/api/analyses`, {
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        if (!res.ok) return;
        const data = await res.json();
        const analyses = Array.isArray(data.analyses) ? data.analyses : [];
        if (analyses.length > 0) {
          setHasCompletedAnalysis(true);
          localStorage.setItem('bodai_has_completed_analysis', 'true');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Failed to detect existing analyses:', err.message || err);
        }
      }
    };

    detectExistingAnalysis();
    return () => controller.abort();
  }, [user?.id, hasCompletedAnalysis, apiBase]);

  // Sync journeyId with URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlJourneyId = searchParams.get('journey');
    
    // If URL has a journey param and it's different from state, update state
    if (urlJourneyId && urlJourneyId !== activeJourneyId) {
      // Verify the journey exists in the journeys list
      const journeyExists = journeys.some(j => j.id === urlJourneyId);
      if (journeyExists) {
        setActiveJourneyId(urlJourneyId);
        localStorage.setItem('bodai_active_journey', urlJourneyId);
        const journey = journeys.find(j => j.id === urlJourneyId);
        if (journey) {
          syncUserContextFromJourney(journey);
        }
      }
    } else if (!urlJourneyId && activeJourneyId) {
      // If URL doesn't have journey param but state does, update URL
      // Only update URL if we're on a page that should show journey (dashboard, my-progress, analyses)
      const journeyPages = ['/dashboard', '/my-progress', '/grades', '/analyses'];
      if (journeyPages.includes(location.pathname)) {
        const newSearchParams = new URLSearchParams(location.search);
        newSearchParams.set('journey', activeJourneyId);
        navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
      }
    }
  }, [location.search, location.pathname, journeys, activeJourneyId, syncUserContextFromJourney, navigate]);

  const handleJourneySelect = useCallback((journeyId) => {
    setActiveJourneyId(journeyId);
    if (journeyId) {
      localStorage.setItem('bodai_active_journey', journeyId);
      const journey = journeys.find(j => j.id === journeyId);
      if (journey) {
        syncUserContextFromJourney(journey);
      }
      
      // Update URL with journey query parameter
      const journeyPages = ['/dashboard', '/my-progress', '/grades', '/analyses'];
      if (journeyPages.includes(location.pathname)) {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('journey', journeyId);
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
      }
    } else {
      localStorage.removeItem('bodai_active_journey');
      
      // Remove journey from URL
      const journeyPages = ['/dashboard', '/my-progress', '/grades', '/analyses'];
      if (journeyPages.includes(location.pathname)) {
        const searchParams = new URLSearchParams(location.search);
        searchParams.delete('journey');
        const newSearch = searchParams.toString();
        navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
      }
    }
  }, [journeys, syncUserContextFromJourney, location.pathname, location.search, navigate]);

  const handleJourneyCreate = useCallback(async (answers) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const payload = {
      primaryGoal: answers?.primaryGoal || 'general',
      confidenceLevel: answers?.confidenceLevel || 'medium',
      goalSpecificContext: answers?.goalSpecificContext || {},
      templateId: answers?.journeyTemplateId || answers?.templateId,
      difficultyBaseline: answers?.difficultyBaseline || null,
      commitmentLevel: answers?.commitmentLevel || answers?.practiceCommitment || null,
      practiceCommitment: answers?.practiceCommitment || answers?.commitmentLevel || null,
      consentVersion: answers?.consent?.version || null,
      consentAcceptedAt: answers?.consent?.acceptedAt || null,
      setDefault: true
    };

    const res = await fetch(`${apiBase}/api/journeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Clerk-User-Id': user.id
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create journey');
    }

    const data = await res.json();
    await fetchJourneys();
    
    // Update URL with the new journey ID if we're on a journey page
    if (data.journey?.id) {
      const journeyPages = ['/dashboard', '/my-progress', '/grades', '/analyses'];
      if (journeyPages.includes(location.pathname)) {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('journey', data.journey.id);
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
      }
    }
    
    return data.journey;
  }, [apiBase, user?.id, fetchJourneys, location.pathname, location.search, navigate]);

  const handleQuestionsComplete = async (answers) => {
    setUserContext(answers);
    localStorage.setItem('bodai_questions_completed', 'true');
    localStorage.setItem('bodai_user_context', JSON.stringify(answers));
    
    if (user?.id) {
      try {
        // Build headers with Clerk profile data for syncing
        const headers = {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id
        };
        
        // Add user profile data to headers for syncing with Supabase
        if (user.emailAddresses?.[0]?.emailAddress) {
          headers['X-User-Email'] = user.emailAddresses[0].emailAddress;
        }
        if (user.firstName) {
          headers['X-User-First-Name'] = user.firstName;
        }
        if (user.lastName) {
          headers['X-User-Last-Name'] = user.lastName;
        }
        if (user.phoneNumbers?.[0]?.phoneNumber) {
          headers['X-User-Phone'] = user.phoneNumbers[0].phoneNumber;
        }
        if (user.imageUrl) {
          headers['X-User-Image-Url'] = user.imageUrl;
        }
        
        await fetch(process.env.REACT_APP_API_URL || 'http://localhost:5000/api/user/onboarding', {
          method: 'POST',
          headers,
          body: JSON.stringify(answers)
        });
      } catch (err) {
        console.error('Failed to save onboarding to database:', err);
      }
    }
    
    navigate('/dashboard');
    fetchJourneys();
  };

  const onSelect = (f) => {
    setFile(f);
    setResult('');
  };

  const onRemove = () => {
    setFile(null);
    setResult('');
  };

  const onAnalyze = async (options = {}) => {
    if (!file) return;
    
    setIsLoading(true);
    setResult('');
    try {
      const form = new FormData();
      form.append('video', file);
      if (file?.bodaiMeta?.durationSeconds) {
        form.append('video_duration_seconds', file.bodaiMeta.durationSeconds);
      }
      if (file?.bodaiMeta?.width) {
        form.append('video_width', file.bodaiMeta.width);
      }
      if (file?.bodaiMeta?.height) {
        form.append('video_height', file.bodaiMeta.height);
      }
      if (options.recordingPrompt) {
        const prompt = options.recordingPrompt;
        if (prompt.id) form.append('recording_prompt_id', prompt.id);
        if (prompt.title) form.append('recording_prompt_title', prompt.title);
        if (prompt.description) form.append('recording_prompt_description', prompt.description);
        if (prompt.actionItemId) form.append('recording_prompt_action_item_id', prompt.actionItemId);
        if (prompt.targetMetric) form.append('recording_prompt_target_metric', prompt.targetMetric);
        if (prompt.source) form.append('recording_prompt_source', prompt.source);
        if (prompt.setup) form.append('recording_prompt_setup', prompt.setup);
        if (prompt.whatToNotice) form.append('recording_prompt_notice', prompt.whatToNotice);
        if (prompt.recordingTip) form.append('recording_prompt_tip', prompt.recordingTip);
        if (prompt.difficulty) form.append('recording_prompt_difficulty', prompt.difficulty);
        if (prompt.estimatedTime) form.append('recording_prompt_time', prompt.estimatedTime);
        if (prompt.version) form.append('recording_prompt_version', prompt.version);
      }

      const headers = {};
      if (userContext) {
        headers['X-User-Context'] = JSON.stringify(userContext);
      }
      if (user?.id) {
        headers['X-Clerk-User-Id'] = user.id;
      }
      if (activeJourneyId) {
        form.append('journey_id', activeJourneyId);
      }

      const res = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:5000/api/analyze-video', {
        method: 'POST',
        headers,
        body: form,
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.requiresUpgrade) {
          setUpgradeMessage(errorData.error || 'You have reached your analysis limit. Upgrade to continue.');
          setShowUpgradeModal(true);
          setResult('');
          return;
        }
        throw new Error(errorData.error || 'Request failed');
      }
      
      const data = await res.json();
      setResult(data.result || '');
      setPracticeCompletionNotices(data.completedPracticePrompts || []);
      if (data.analysisId) {
        if (!hasCompletedAnalysis) {
          setHasCompletedAnalysis(true);
          localStorage.setItem('bodai_has_completed_analysis', 'true');
        }
        // Store in state or pass to AnalysisResult
        setCurrentAnalysisId(data.analysisId);
      }
      setDashboardRefreshTrigger(prev => prev + 1);
    } catch (err) {
      // Show error message (upgrade modal is handled above)
      setResult(`An error occurred while processing the video: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissPracticeNotices = useCallback(() => setPracticeCompletionNotices([]), []);

  const handleNewAnalysis = () => {
    setFile(null);
    setResult('');
    setViewingAnalysis(null);
    setCurrentAnalysisId(null);
    navigate('/new-analysis');
  };

  const handleViewAnalysis = (analysis) => {
    if (!analysis) return;
    dismissPracticeNotices();
    setFile(null);
    setResult('');
    setViewingAnalysis(analysis);
    setCurrentAnalysisId(analysis.id);
    navigate(`/analysis/${analysis.id}`);
  };

  const handleNavigate = (page) => {
    navigate(`/${page}`);
    if (page !== 'new-analysis' && !page.startsWith('analysis/')) {
      setFile(null);
      setResult('');
      setViewingAnalysis(null);
    }
  };

  return (
    <>
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
      />
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <HomepageRoute 
          user={user} 
          isLoaded={userLoaded}
          navigate={navigate}
          onNewAnalysis={handleNewAnalysis}
        />
      } />

      {/* Auth Routes - Redirect to dashboard if already signed in */}
      {/* Use key prop to prevent re-mounting when user state changes */}
      <Route path="/sign-in/*" element={
        user ? <Navigate to="/dashboard" replace /> : <SignInPage key="sign-in-page" />
      } />
      <Route path="/sign-up/*" element={
        user ? <Navigate to="/dashboard" replace /> : <SignUpPage key="sign-up-page" />
      } />

      {/* Teams & Enterprise contact (public) */}
      <Route path="/contact-teams" element={<TeamsContactPage />} />

      {/* Protected Routes */}
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <OnboardingPageWithWelcome onComplete={handleQuestionsComplete} />
        </ProtectedRoute>
      } />

      {/* New Analysis Route */}
      <Route path="/new-analysis" element={
        <ProtectedRoute requireOnboarding>
          <AnalysisPage
            file={file}
            onSelect={onSelect}
            onRemove={onRemove}
            onAnalyze={onAnalyze}
            isLoading={isLoading}
            result={result}
            viewingAnalysis={null}
            currentAnalysisId={currentAnalysisId}
            userContext={userContext}
            activeJourneyId={activeJourneyId}
            practiceCompletionNotices={practiceCompletionNotices}
            onDismissPracticeNotices={dismissPracticeNotices}
            hasCompletedAnalysis={hasCompletedAnalysis}
            refreshTrigger={dashboardRefreshTrigger}
            onBackToDashboard={() => {
              setViewingAnalysis(null);
              setResult('');
              setFile(null);
              setCurrentAnalysisId(null);
              navigate('/dashboard');
              setDashboardRefreshTrigger(prev => prev + 1);
            }}
          />
        </ProtectedRoute>
      } />

      {/* View Existing Analysis Route */}
      <Route path="/analysis/:id" element={
        <ProtectedRoute requireOnboarding>
          <AnalysisPage
            file={file}
            onSelect={onSelect}
            onRemove={onRemove}
            onAnalyze={onAnalyze}
            isLoading={isLoading}
            result={result}
            viewingAnalysis={viewingAnalysis}
            currentAnalysisId={viewingAnalysis?.id}
            userContext={userContext}
            activeJourneyId={activeJourneyId}
            practiceCompletionNotices={practiceCompletionNotices}
            onDismissPracticeNotices={dismissPracticeNotices}
            hasCompletedAnalysis={hasCompletedAnalysis}
            refreshTrigger={dashboardRefreshTrigger}
            onBackToDashboard={() => {
              setViewingAnalysis(null);
              setResult('');
              setFile(null);
              setCurrentAnalysisId(null);
              navigate('/dashboard');
              setDashboardRefreshTrigger(prev => prev + 1);
            }}
          />
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute requireOnboarding>
          <>
            <Sidebar />
            <div className="dashboardLayout">
              <Dashboard 
                onNewAnalysis={handleNewAnalysis}
                onViewAnalysis={handleViewAnalysis}
                refreshTrigger={dashboardRefreshTrigger}
                journeys={journeys}
                journeysLoading={journeysLoading}
                activeJourneyId={activeJourneyId}
                onSelectJourney={handleJourneySelect}
                onStartJourney={handleJourneyCreate}
              />
            </div>
          </>
        </ProtectedRoute>
      } />

      <Route path="/analyses" element={
        <ProtectedRoute requireOnboarding>
          <>
            <Sidebar />
            <div className="dashboardLayout">
              <MyAnalysesPage 
                onViewAnalysis={handleViewAnalysis}
                journeys={journeys}
                journeysLoading={journeysLoading}
                activeJourneyId={activeJourneyId}
                onSelectJourney={handleJourneySelect}
              />
            </div>
          </>
        </ProtectedRoute>
      } />

      <Route path="/grades" element={
        <ProtectedRoute requireOnboarding>
          <>
            <Sidebar />
            <div className="dashboardLayout">
              <MyProgressPage 
                journeys={journeys}
                journeysLoading={journeysLoading}
                activeJourneyId={activeJourneyId}
                onSelectJourney={handleJourneySelect}
                refreshTrigger={dashboardRefreshTrigger}
              />
            </div>
          </>
        </ProtectedRoute>
      } />

      <Route path="/practice" element={
        <ProtectedRoute requireOnboarding>
          <>
            <Sidebar />
            <div className="dashboardLayout">
              <PracticePage 
                journeys={journeys}
                journeysLoading={journeysLoading}
                activeJourneyId={activeJourneyId}
                onSelectJourney={handleJourneySelect}
              />
            </div>
          </>
        </ProtectedRoute>
      } />

      <Route path="/pricing" element={
        <>
          <Header />
          <PricingPage />
        </>
      } />

      <Route path="/subscription" element={
        <ProtectedRoute requireOnboarding>
          <>
            <Sidebar />
            <div className="dashboardLayout">
              <SubscriptionPage />
            </div>
          </>
        </ProtectedRoute>
      } />

      <Route path="/courses" element={
        <ProtectedRoute requireOnboarding>
          <>
            <Sidebar />
            <div className="dashboardLayout">
              <CoursesPage />
            </div>
          </>
        </ProtectedRoute>
      } />
      <Route path="/courses/*" element={<Navigate to="/courses" replace />} />

      <Route path="/settings" element={
        <ProtectedRoute requireOnboarding>
          <>
            <Sidebar />
            <div className="dashboardLayout">
              <SettingsPage />
            </div>
          </>
        </ProtectedRoute>
      } />

      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

