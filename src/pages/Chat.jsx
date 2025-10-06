import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import toast from 'react-hot-toast';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [chatMode, setChatMode] = useState('rag');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { scrollToBottom(); }, [messages]);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadConversations = async () => {
    try {
      setConversationsLoading(true);
      const data = await apiService.getConversations();
      setConversations(data);
      if (data.length === 0) setChatMode('general');
    } catch (err) {
      toast.error('Failed to load chat history');
    } finally {
      setConversationsLoading(false);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      setLoading(true);
      const msgs = await apiService.getConversationMessages(conversationId);
      setCurrentConversation(conversations.find(c => c.id === conversationId));
      setMessages(msgs);
      setSidebarOpen(false);
    } catch (err) {
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || loading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setLoading(true);

    const tempMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await apiService.sendMessage(userMessage, currentConversation?.id, chatMode);

      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));

      const newMessages = [
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: userMessage,
          created_at: new Date().toISOString()
        },
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          sources: response.sources || [],
          created_at: new Date().toISOString(),
          context_used: response.context_used
        }
      ];

      setMessages(prev => [...prev, ...newMessages]);

      if (!currentConversation || currentConversation.id !== response.conversation_id) {
        setCurrentConversation({
          id: response.conversation_id,
          title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '')
        });
        await loadConversations();
      }
    } catch (err) {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  // Sidebar for both mobile (modal) and desktop
  const Sidebar = (
    <div
      className={`
        fixed top-0 left-0 z-40 w-11/12 max-w-xs h-full bg-white shadow-lg border-r border-gray-200
        sm:relative sm:translate-x-0 sm:w-80 sm:max-w-none sm:h-auto sm:z-0 sm:shadow-none sm:border-none
        ${sidebarOpen ? 'block' : 'hidden'} sm:block
      `}
      style={{ minWidth: 250 }}
    >
      <div className="flex flex-col gap-0 border-b border-gray-200 p-0">
        <div className="flex flex-row items-center justify-between p-4">
          <h2 className="text-lg font-semibold text-gray-900">💬 Chat History</h2>
          <button
            className="sm:hidden text-2xl text-gray-500 p-2 focus:outline-none"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close chat history"
          >
            ×
          </button>
        </div>
        <button
          onClick={startNewConversation}
          className="w-full px-4 py-3 btn-primary rounded-none border-b border-gray-200 text-lg"
          style={{ borderRadius: 0 }}
        >
          ➕ New Chat
        </button>
        <div className="flex flex-row items-center gap-1 p-3 border-b border-gray-200">
          <button
            className={`flex-1 px-2 py-1 rounded ${chatMode === 'general' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'} text-xs`}
            onClick={() => setChatMode('general')}
          >
            General Chat
          </button>
          <button
            className={`flex-1 px-2 py-1 rounded ${chatMode === 'rag' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'} text-xs ${conversations.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => conversations.length > 0 && setChatMode('rag')}
            disabled={conversations.length === 0}
            title={conversations.length === 0 ? 'Upload documents to enable RAG mode' : ''}
          >
            Document Chat
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {conversationsLoading ? (
          <div className="p-4 text-center"><LoadingSpinner size="medium" /><p className="text-sm text-gray-500 mt-2">Loading...</p></div>
        ) : conversations.length > 0 ? (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                currentConversation?.id === conversation.id ? 'bg-primary-50 border-l-4 border-primary-500' : 'hover:bg-gray-50'
              }`}
              onClick={() => loadConversation(conversation.id)}
            >
              <p className="text-sm font-medium text-gray-900 truncate">{conversation.title}</p>
              <p className="text-xs text-gray-500">{formatDate(conversation.created_at)}</p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <span className="text-4xl mb-3">💬</span>
            <p className="text-gray-500 text-sm">No chat history yet</p>
          </div>
        )}
      </div>
    </div>
  );

  // Backdrop for the sidebar on mobile
  const SidebarBackdrop = (
    sidebarOpen && (
      <div
        className="fixed inset-0 z-30 bg-black bg-opacity-30 block sm:hidden"
        onClick={() => setSidebarOpen(false)}
        aria-label="Close overlay"
      />
    )
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-8rem)] flex flex-col sm:flex-row relative">
      {/* Sidebar and overlay */}
      {SidebarBackdrop}
      {Sidebar}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Topbar: show hamburger on mobile */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between sm:justify-start">
          <button
            className="sm:hidden px-2 py-2 rounded text-primary-600 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open chat history"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center ml-0 sm:ml-2 truncate">
            {currentConversation ? currentConversation.title : 'AI RAG Chat'}
          </h3>
        </div>

        {/* Chat messages */}
        <div className="flex-1 flex flex-col overflow-y-auto px-2 py-2 sm:px-4 sm:py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {chatMode === 'rag' ? 'Start a RAG conversation' : 'Start a general chat'}
              </h3>
              <p className="text-gray-500 max-w-sm mb-6">
                {chatMode === 'rag'
                  ? 'Ask questions about your uploaded documents.'
                  : 'Chat freely without document context.'}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex mb-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-[85vw] sm:max-w-lg break-words
                      ${message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'}
                    `}
                    style={{ wordBreak: 'break-word' }}
                  >
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    {message.role === 'assistant' && message.context_used && chatMode === 'rag' && (
                      <div className="mt-2 text-xs text-primary-600 flex items-center">
                        ✨ Answered using knowledge base
                      </div>
                    )}
                    {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">📄 Sources:</p>
                        {message.sources.slice(0, 2).map((source, index) => (
                          <div key={index} className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-1">
                            <div className="font-medium">{source.filename}</div>
                            {source.similarity_score && (
                              <div className="text-primary-600">{Math.round(source.similarity_score * 100)}% match</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                    <LoadingSpinner size="small" />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input bar */}
        <div className="border-t border-gray-200 p-3 bg-gray-50 w-full">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder={chatMode === 'rag' ? "Ask me anything about your documents..." : "Chat freely without documents..."}
              className="flex-1 input-field min-h-[44px] sm:text-base text-sm"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !currentMessage.trim()}
              className="btn-primary px-4 sm:text-base text-xl h-[44px] flex items-center justify-center"
            >
              {loading ? <LoadingSpinner size="small" color="white" /> : '🚀'}
            </button>
          </form>
          <div className="mt-2 text-xs text-gray-500 text-center">
            💡 Tip: Upload documents in Knowledge Base to get better answers
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
