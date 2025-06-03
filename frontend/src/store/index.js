import { defineStore } from 'pinia';
import api from '@/api';
import Cookies from 'js-cookie';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: Cookies.get('token') || '',
    user: null,
    loading: false,
    error: null,
  }),
  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post('/api/auth/login', { email, password });
        this.token = res.data.token;
        Cookies.set('token', this.token, { expires: 7 }); // 7 days
        this.user = this.parseJwt(this.token);
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed';
      } finally {
        this.loading = false;
      }
    },
    async register(username, email, password) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.post('/api/auth/register', { username, email, password });
        this.token = res.data.token;
        Cookies.set('token', this.token, { expires: 7 });
        this.user = this.parseJwt(this.token);
      } catch (err) {
        this.error = err.response?.data?.message || 'Registration failed';
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.token = '';
      this.user = null;
      Cookies.remove('token');
    },
    parseJwt(token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')));
      } catch (e) {
        return null;
      }
    },
    hydrate() {
      if (this.token) {
        this.user = this.parseJwt(this.token);
      } else {
        this.user = null;
      }
    },
  },
}); 