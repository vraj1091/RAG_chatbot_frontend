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
  const [chatMode, setChatMode] = useState('rag'); // default to RAG mode
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setConversationsLoading(true);
      const data = await apiService.getConversations();
      setConversations(data);
      if (data.length === 0) setChatMode('general'); // No docs -> set general mode
    } catch (err) {
      toast.error('Failed to load chat history');
    } finally {
      setConversationsLoading(false);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      setLoading(true);
      const messages = await apiService.getConversationMessages(conversationId);
      setCurrentConversation(conversations.find(c => c.id === conversationId));
      setMessages(messages);
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
      // Pass chatMode as query param 'mode' to backend
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
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-8rem)] flex">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">💬 Chat History</h2>
          <button onClick={startNewConversation} className="w-full mt-3 btn-primary">
            ➕ New Chat
          </button>
        </div>

        <div className="p-4 flex space-x-2">
          {/* Mode toggle buttons */}
          <button
            className={`flex-1 px-3 py-1 rounded ${
              chatMode === 'general' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setChatMode('general')}
          >
            General Chat
          </button>
          <button
            className={`flex-1 px-3 py-1 rounded ${
              chatMode === 'rag' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            } ${conversations.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => conversations.length > 0 && setChatMode('rag')}
            disabled={conversations.length === 0}
            title={conversations.length === 0 ? 'Upload documents to enable RAG mode' : ''}
          >
            Document Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4 text-center">
              <LoadingSpinner size="medium" />
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            </div>
          ) : conversations.length > 0 ? (
            <div className="p-2">
              {conversations.map((conversation) => (
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
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <span className="text-4xl mb-3">💬</span>
              <p className="text-gray-500 text-sm">No chat history yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            ✨ {currentConversation ? currentConversation.title : 'AI RAG Chat'}
          </h3>
          <p className="text-sm text-gray-500"></p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white ml-auto'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

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

        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <form onSubmit={sendMessage} className="flex items-center space-x-3">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder={chatMode === 'rag' ? "Ask me anything about your documents..." : "Chat freely without documents..."}
              className="flex-1 input-field"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !currentMessage.trim()}
              className="btn-primary px-4 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="small" color="white" /> : '🚀'}
            </button>
          </form>

          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>💡 Tip: Upload documents in Knowledge Base to get better answers</span>
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
