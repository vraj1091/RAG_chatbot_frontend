import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import KnowledgeBase from './pages/KnowledgeBase.jsx';
import Chat from './pages/Chat.jsx';
import Layout from './components/Layout.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="large" />
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
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  // Dark mode state, reads from localStorage or defaults to system preference
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Update HTML <html> or root div class and save preference
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Optional: dark mode toggle button inside layout, you can move this to your Layout component if preferred
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
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            
            {/* Inject dark mode toggle as a prop to Layout */}
            <Route path="/dashboard" element={<ProtectedRoute><Layout extraHeaderRight={<DarkModeToggle />}><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/knowledge-base" element={<ProtectedRoute><Layout extraHeaderRight={<DarkModeToggle />}><KnowledgeBase /></Layout></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Layout extraHeaderRight={<DarkModeToggle />}><Chat /></Layout></ProtectedRoute>} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
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
