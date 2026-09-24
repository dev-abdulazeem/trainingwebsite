import { create } from 'zustand';
import { authApi, userApi } from '@api/client';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,

  // Check auth on app load
  checkAuth: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const response = await authApi.me();
      const user = response.data.user;

      set({
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'ADMIN',
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
      });
    }
  },

  // Login
  login: async (email, password) => {
    const response = await authApi.login({ email, password });
    const { accessToken, refreshToken, user } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    set({
      user,
      isAuthenticated: true,
      isAdmin: user.role === 'ADMIN',
    });

    return response.data;
  },

  // Register
  register: async (data) => {
    const response = await authApi.register(data);
    const { accessToken, refreshToken, user } = response.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    set({
      user,
      isAuthenticated: true,
      isAdmin: user.role === 'ADMIN',
    });

    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore error
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
    });
  },

  // Update user data
  updateUser: (userData) => {
    set({ user: { ...get().user, ...userData } });
  },

  // Refresh user data from server
  refreshUser: async () => {
    try {
      const response = await userApi.profile();
      set({ user: { ...get().user, ...response.data.user } });
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },
}));