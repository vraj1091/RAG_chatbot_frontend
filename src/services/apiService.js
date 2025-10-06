import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://vraj1091-rag-chatbot.hf.space/api/v1';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async register(username, email, password) {
    const response = await this.api.post('/auth/register', { username, email, password });
    return response.data;
  }

  async login(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await this.api.post('/auth/token', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async uploadDocument(file, onUploadProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onUploadProgress
        ? (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(percentCompleted);
          }
        : undefined,
    });
    return response.data;
  }

  async getDocuments(skip = 0, limit = 50) {
    const response = await this.api.get(`/documents/?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  async deleteDocument(documentId) {
    const response = await this.api.delete(`/documents/${documentId}`);
    return response.data;
  }

  async getDocumentStats() {
    const response = await this.api.get('/documents/stats');
    return response.data;
  }

  // Updated sendMessage with error handling
  async sendMessage(message, conversationId = null, mode = 'rag') {
    const params = new URLSearchParams();
    if (mode) params.append('mode', mode);

    const url = `/chat/?${params.toString()}`;

    const payload = { message };
    if (conversationId !== null && conversationId !== undefined) {
      payload.conversation_id = conversationId;
    }

    try {
      const response = await this.api.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('sendMessage API error:', error.response?.data || error.message || error);
      toast.error('Error sending message, please try again.');
      throw error;
    }
  }

  async getConversations(skip = 0, limit = 20) {
    const response = await this.api.get(`/chat/conversations?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  async getConversationMessages(conversationId, skip = 0, limit = 50) {
    const response = await this.api.get(`/chat/conversations/${conversationId}/messages?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  async deleteConversation(conversationId) {
    const response = await this.api.delete(`/chat/conversations/${conversationId}`);
    return response.data;
  }

  async getChatStats() {
    const response = await this.api.get('/chat/stats');
    return response.data;
  }
}

export const apiService = new ApiService();
