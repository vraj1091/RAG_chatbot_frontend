import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

// Lazy load pages and components
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase.jsx'));
const Chat = lazy(() => import('./pages/Chat.jsx'));
const Layout = lazy(() => import('./components/Layout.jsx'));
const LoadingSpinner = lazy(() => import('./components/LoadingSpinner.jsx'));

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Suspense fallback={<div>Loading...</div>}>
          <LoadingSpinner size="large" />
        </Suspense>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Suspense fallback={<div>Loading...</div>}>
          <LoadingSpinner size="large" />
        </Suspense>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [modelStatus, setModelStatus] = useState({
    loaded: false,
    loading: false,
    status: 'not_loaded',
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const checkModelStatus = async () => {
      try {
        const response = await fetch('/api/model/status');
        const status = await response.json();
        setModelStatus(status);
      } catch (err) {
        console.error('Failed to fetch model status', err);
      }
    };
    checkModelStatus();
  }, []);

  const preloadModel = async () => {
    if (modelStatus.loaded || modelStatus.loading) return;
    try {
      setModelStatus((prev) => ({ ...prev, loading: true }));
      const response = await fetch('/api/model/preload', { method: 'POST' });
      const result = await response.json();
      if (result.status === 'loading_started') {
        const poll = setInterval(async () => {
          const statusResp = await fetch('/api/model/status');
          const status = await statusResp.json();
          setModelStatus(status);
          if (status.loaded) {
            clearInterval(poll);
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to preload model', err);
      setModelStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  const DarkModeToggle = () => (
    <button
      className="ml-4 px-3 py-1 rounded border border-gray-600 dark:border-gray-300 text-sm"
      onClick={() => setDarkMode(!darkMode)}
      aria-label="Toggle dark mode"
      type="button"
    >
      {darkMode ? '🌙 Dark' : '☀️ Light'}
    </button>
  );

  return (
    <div className={`App min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><LoadingSpinner size="large" /></div>}>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout extraHeaderRight={<DarkModeToggle />}>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/knowledge-base"
                element={
                  <ProtectedRoute>
                    <Layout extraHeaderRight={<DarkModeToggle />}>
                      <KnowledgeBase />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Layout extraHeaderRight={<DarkModeToggle />} modelStatus={modelStatus} preloadModel={preloadModel}>
                      <Chat />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </Router>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#363636', color: '#fff' },
            success: { duration: 3000, iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </div>
  );
}

export default App;
