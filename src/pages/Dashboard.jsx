import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiService } from '../services/apiService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    documents: 0, conversations: 0, processed_documents: 0, total_chunks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [documentStats, chatStats] = await Promise.all([
        apiService.getDocumentStats().catch(() => ({ total_documents: 0, processed_documents: 0, vector_stats: { total_chunks: 0 } })),
        apiService.getChatStats().catch(() => ({ total_conversations: 0 }))
      ]);

      setStats({
        documents: documentStats.total_documents || 0,
        processed_documents: documentStats.processed_documents || 0,
        total_chunks: documentStats.vector_stats?.total_chunks || 0,
        conversations: chatStats.total_conversations || 0
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
               Welcome back, {user?.username}!
              <span className="ml-3 text-2xl">✨</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Your AI-powered knowledge base is ready to help you find answers from your documents.
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-3">
            <Link to="/knowledge-base" className="btn-secondary flex items-center">
              📤 Upload Files
            </Link>
            <Link to="/chat" className="btn-primary flex items-center">
              ➕ New Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/knowledge-base" className="card-hover group">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-primary-50 group-hover:scale-110 transition-transform duration-200">
              <span className="text-2xl">📚</span>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Knowledge Base</p>
              <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
              <p className="text-xs text-gray-500">{stats.processed_documents} processed</p>
            </div>
          </div>
        </Link>

        <Link to="/knowledge-base" className="card-hover group">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-purple-50 group-hover:scale-110 transition-transform duration-200">
              <span className="text-2xl">🧩</span>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Text Chunks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_chunks}</p>
              <p className="text-xs text-gray-500">Ready for search</p>
            </div>
          </div>
        </Link>

        <Link to="/chat" className="card-hover group">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-green-50 group-hover:scale-110 transition-transform duration-200">
              <span className="text-2xl">💬</span>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.conversations}</p>
              <p className="text-xs text-gray-500">Chat history</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/knowledge-base" className="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors duration-200 group">
            <span className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">📚</span>
            <div>
              <span className="text-primary-700 font-medium block">Manage Knowledge Base</span>
              <span className="text-primary-600 text-sm">Upload, view, and organize your documents</span>
            </div>
          </Link>
          <Link to="/chat" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200 group">
            <span className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-200">💬</span>
            <div>
              <span className="text-green-700 font-medium block">Start RAG Chat</span>
              <span className="text-green-600 text-sm">Ask questions about your documents</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-6">
        <div className="flex items-start">
          <span className="text-2xl mr-3 mt-1">✨</span>
          <div>
            <h3 className="text-lg font-semibold text-primary-900">How to get started</h3>
            <div className="mt-3 space-y-2 text-sm text-primary-800">
              <div className="flex items-center">
                <span className="bg-primary-200 text-primary-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3">1</span>
                <span>Upload documents (PDF, DOCX, TXT, or images) to your Knowledge Base</span>
              </div>
              <div className="flex items-center">
                <span className="bg-primary-200 text-primary-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3">2</span>
                <span>Wait for documents to be processed and indexed</span>
              </div>
              <div className="flex items-center">
                <span className="bg-primary-200 text-primary-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3">3</span>
                <span>Start a chat and ask questions about your documents</span>
              </div>
              <div className="flex items-center">
                <span className="bg-primary-200 text-primary-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3">4</span>
                <span>Get AI-powered answers with source references</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;