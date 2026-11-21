import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sapphire_chat_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sapphire_chat_token');
      localStorage.removeItem('sapphire_chat_user');
      // Only reload if we are not already on auth screen
      if (!window.location.pathname.includes('/login')) {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me')
};

// Users endpoints
export const usersAPI = {
  searchUsers: (query = '') => api.get(`/api/users?search=${encodeURIComponent(query)}`),
  updateProfile: (data) => api.put('/api/users/profile', data)
};

// Conversations endpoints
export const conversationsAPI = {
  getConversations: () => api.get('/api/conversations'),
  getOrCreateDirect: (recipientId) => api.post('/api/conversations/direct', { recipientId }),
  createGroup: (name, memberIds) => api.post('/api/conversations/group', { name, memberIds }),
  addGroupMember: (conversationId, userId) => api.post(`/api/conversations/${conversationId}/members`, { userId }),
  markAsRead: (conversationId) => api.put(`/api/conversations/${conversationId}/read`)
};

// Messages endpoints
export const messagesAPI = {
  getMessages: (conversationId, page = 1, limit = 25) =>
    api.get(`/api/messages/${conversationId}?page=${page}&limit=${limit}`),
  sendMessage: (data, isFormData = false) => {
    if (isFormData) {
      return api.post('/api/messages', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/api/messages', data);
  }
};

export default api;
