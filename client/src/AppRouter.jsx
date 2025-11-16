import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import OnboardingPage from './pages/OnboardingPage';
import AnalysisPage from './pages/AnalysisPage';
import Dashboard from './components/Dashboard';
import MyAnalysesPage from './pages/MyAnalysesPage';
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
  };

  const onSelect = (f) => {
    setFile(f);
    setResult('');
  };

  const onRemove = () => {
    setFile(null);
    setResult('');
  };

  const onAnalyze = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setResult('');
    try {
      const form = new FormData();
      form.append('video', file);

      const headers = {};
      if (userContext) {
        headers['X-User-Context'] = JSON.stringify(userContext);
      }
      if (user?.id) {
        headers['X-Clerk-User-Id'] = user.id;
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
      // Store analysisId for metrics fetching
      if (data.analysisId) {
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

  const handleNewAnalysis = () => {
    setFile(null);
    setResult('');
    setViewingAnalysis(null);
    setCurrentAnalysisId(null);
    navigate('/new-analysis');
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
                refreshTrigger={dashboardRefreshTrigger}
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
              <MyAnalysesPage />
            </div>
          </>
        </ProtectedRoute>
      } />

      <Route path="/grades" element={
        <ProtectedRoute requireOnboarding>
          <>
            <Sidebar />
            <div className="dashboardLayout">
              <div className="pageContent">
                <h2>My Progress</h2>
                <p>Track your improvement over time</p>
              </div>
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

