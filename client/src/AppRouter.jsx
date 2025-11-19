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
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Hero from './components/hero/Hero';
import UpgradeModal from './components/UpgradeModal';
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
        const res = await fetch(process.env.REACT_APP_API_URL || 'http://localhost:5000/api/user/profile', {
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json'
          }
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
  }, [user, userLoaded, navigate]);

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
    // Redirect to onboarding if required but not completed
    if (location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
      return null;
    }
  }

  if (!requireOnboarding && hasCompletedOnboarding && location.pathname === '/onboarding') {
    // Already completed onboarding, redirect to dashboard
    navigate('/dashboard', { replace: true });
    return null;
  }

  return children;
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
        const storedActive = localStorage.getItem('bodai_active_journey');
        let nextActive = storedActive && journeyList.some(j => j.id === storedActive) ? storedActive : null;
        if (!nextActive && journeyList.length > 0) {
          nextActive = (journeyList.find(j => j.is_default) || journeyList[0]).id;
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
  }, [apiBase, user?.id, syncUserContextFromJourney]);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

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

  const handleJourneySelect = useCallback((journeyId) => {
    setActiveJourneyId(journeyId);
    if (journeyId) {
      localStorage.setItem('bodai_active_journey', journeyId);
      const journey = journeys.find(j => j.id === journeyId);
      if (journey) {
        syncUserContextFromJourney(journey);
      }
    } else {
      localStorage.removeItem('bodai_active_journey');
    }
  }, [journeys, syncUserContextFromJourney]);

  const handleJourneyCreate = useCallback(async (answers) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const payload = {
      primaryGoal: answers?.primaryGoal || 'general',
      confidenceLevel: answers?.confidenceLevel || 'medium',
      goalSpecificContext: answers?.goalSpecificContext || {},
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
    return data.journey;
  }, [apiBase, user?.id, fetchJourneys]);

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
        <>
          <Header />
          <Hero />
          <div className="container">
            <header className="header" id="try">
              <h1 className="title">Upload Your Video for Body Language Analysis</h1>
              <p className="subtitle">Get AI-powered analysis and practical coaching tips.</p>
            </header>
            <SignedOut>
              <div className="card">
                <div className="welcomeOptions">
                  <div className="welcomeOptions__header">
                    <h2 className="welcomeOptions__title">Welcome to BodAI</h2>
                    <p className="welcomeOptions__subtitle">
                      Choose how you'd like to get started
                    </p>
                  </div>
                  <div className="welcomeOptions__grid">
                    <div className="welcomeOption">
                      <div className="welcomeOption__icon">🎥</div>
                      <h3 className="welcomeOption__title">Free Video Analysis</h3>
                      <p className="welcomeOption__description">
                        Upload a video and get instant AI-powered body language analysis with personalized feedback
                      </p>
                      <SignInButton mode="modal">
                        <button className="btn btn--primary welcomeOption__button">
                          Start Free Analysis
                        </button>
                      </SignInButton>
                    </div>
                    <div className="welcomeOption">
                      <div className="welcomeOption__icon">📚</div>
                      <h3 className="welcomeOption__title">Personalized Courses</h3>
                      <p className="welcomeOption__description">
                        Access structured courses tailored to your goals: interviews, presentations, confidence building, and more
                      </p>
                      <SignInButton mode="modal">
                        <button className="btn btn--ghost welcomeOption__button">
                          Explore Courses
                        </button>
                      </SignInButton>
                    </div>
                  </div>
                </div>
              </div>
            </SignedOut>
          </div>
        </>
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
              <div className="pageContent">
                <h2>Courses</h2>
                <p>Browse and enroll in personalized courses</p>
              </div>
            </div>
          </>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute requireOnboarding>
          <>
            <Sidebar />
            <div className="dashboardLayout">
              <div className="pageContent">
                <h2>Settings</h2>
                <p>Manage your account settings and preferences</p>
              </div>
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

