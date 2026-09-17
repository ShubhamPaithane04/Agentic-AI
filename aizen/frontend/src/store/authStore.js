import { create } from 'zustand';
import { fetchApi } from '../config/api';

const loadUserFromStorage = () => {
  try {
    const user = localStorage.getItem('aizen_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: loadUserFromStorage(),
  isAuthenticated: !!loadUserFromStorage(),

  login: async (username, password) => {
    try {
      const res = await fetchApi('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('aizen_user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('aizen_token', data.token);
        set({ user: data.user, isAuthenticated: true });
        return { success: true };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch {
      return { success: false, error: 'Network error. Backend might be down.' };
    }
  },

  signup: async (username, password) => {
    try {
      const res = await fetchApi('/api/signup', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('aizen_user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('aizen_token', data.token);
        set({ user: data.user, isAuthenticated: true });
        return { success: true };
      }

      return { success: false, error: data.error || 'Signup failed' };
    } catch {
      return { success: false, error: 'Network error. Backend might be down.' };
    }
  },

  logout: () => {
    localStorage.removeItem('aizen_user');
    localStorage.removeItem('aizen_token');
    set({ user: null, isAuthenticated: false });
  },
}));
