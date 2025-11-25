import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import OnboardingPage from './pages/OnboardingPage';
import AnalysisPage from './pages/AnalysisPage';
import Dashboard from './components/Dashboard';
import MyAnalysesPage from './pages/MyAnalysesPage';
import MyProgressPage from './pages/MyProgressPage';
import PricingPage from './pages/PricingPage';
import SubscriptionPage from './pages/SubscriptionPage';
import CoursesPage from './pages/CoursesPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Hero from './components/hero/Hero';
import UpgradeModal from './components/UpgradeModal';
import FeaturesSection from './components/homepage/FeaturesSection';
import HowItWorksSection from './components/homepage/HowItWorksSection';
import SocialProofSection from './components/homepage/SocialProofSection';
import CTASection from './components/homepage/CTASection';
import { SignInButton, SignedOut } from '@clerk/clerk-react';

// Protected Route Component
function ProtectedRoute({ children, requireOnboarding = false }) {
  const { user, isLoaded: userLoaded } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userContext, setUserContext] = useState(null);

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

    if (requireOnboarding && !hasCompletedOnboarding) {
      // Redirect to onboarding if required but not completed
      if (location.pathname !== '/onboarding') {
        navigate('/onboarding', { replace: true });
      }
    } else if (!requireOnboarding && hasCompletedOnboarding && location.pathname === '/onboarding') {
      // Already completed onboarding, redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
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

  return children;
}

// Homepage Route Component - handles redirects and conditional rendering
function HomepageRoute({ user, isLoaded, navigate, onNewAnalysis }) {
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      // Check if this is a fresh sign-in
      const justSignedIn = sessionStorage.getItem('bodai_just_signed_in');
      if (justSignedIn === 'true') {
        sessionStorage.removeItem('bodai_just_signed_in');
        setShouldRedirect(true);
        navigate('/dashboard', { replace: true });
        return;
      }
    }
  }, [user, isLoaded, navigate]);

  if (shouldRedirect) {
    return null;
  }

  const isSignedIn = !!user;

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
  const [previousUserState, setPreviousUserState] = useState(null);
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Detect fresh sign-in
  useEffect(() => {
    if (!userLoaded) return;
    
    // If user just signed in (was null, now has user)
    if (!previousUserState && user) {
      if (location.pathname === '/') {
        sessionStorage.setItem('bodai_just_signed_in', 'true');
      } else {
        sessionStorage.removeItem('bodai_just_signed_in');
      }
    }
    
    setPreviousUserState(user);
  }, [user, userLoaded, previousUserState, location.pathname]);

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
    if (!journeysLoading && user?.id && journeys.length === 0 && location.pathname !== '/onboarding') {
      navigate('/onboarding');
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
        await fetch(process.env.REACT_APP_API_URL || 'http://localhost:5000/api/user/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': user.id
          },
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

      {/* Protected Routes */}
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <OnboardingPage onComplete={handleQuestionsComplete} />
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

