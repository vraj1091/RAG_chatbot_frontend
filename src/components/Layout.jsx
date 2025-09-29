import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: '📚' },
  { name: 'Chat', href: '/chat', icon: '💬' },
];

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <div className="flex items-center">
                
                <div>
                  <h1 className="text-lg font-bold text-gray-900">AI RAG Chat</h1>
               
                </div>
              </div>
            </div>

            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name} to={item.href}
                    className={`group flex items-center px-2.5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive 
                        ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span>👤</span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout}
  className="ml-2 px-3 py-1 bg-red-500 text-white flex items-center gap-2 rounded hover:bg-red-600 transition"
  title="Logout"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className="inline-block"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 001 1.73m-2.002-1.73A2 2 0 017 17v-1m6 1.73A2 2 0 0113 17v-1m0 1.73V17m0-11.73V7a2 2 0 00-1-1.73A2 2 0 007 7v1" />
  </svg>
  <span>Logout</span>
</button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;