<template>
  <nav class="navbar">
    <router-link to="/dashboard" class="nav-logo">Boardly</router-link>
    <div class="nav-links">
      <button class="theme-toggle-btn" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
        <span v-if="isDark">🌙</span>
        <span v-else>☀️</span>
      </button>
      <template v-if="auth.token">
        <span class="nav-user">Hello, {{ auth.user?.username }}</span>
        <router-link to="/dashboard">Dashboard</router-link>
        <a href="#" @click.prevent="logout">Logout</a>
      </template>
      <template v-else>
        <router-link to="/login">Login</router-link>
        <router-link to="/register">Register</router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAuthStore } from '@/store';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark-theme', isDark.value);
  document.documentElement.classList.toggle('light-theme', !isDark.value);
};

// Set initial theme
if (!document.documentElement.classList.contains('dark-theme') && !document.documentElement.classList.contains('light-theme')) {
  document.documentElement.classList.add('light-theme');
}

const logout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #2c3e50;
  color: #fff;
  margin-bottom: 0;
}
.nav-logo {
  font-weight: bold;
  color: #41b883;
  font-size: 1.5rem;
  text-decoration: none;
}
.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.theme-toggle-btn {
  background: transparent !important;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  margin-right: 1rem;
  color: #ffd700;
  transition: color 0.2s, background 0.2s;
  box-shadow: none;
}
.theme-toggle-btn:hover {
  color: #41b883;
  background: rgba(65,184,131,0.08);
}
.nav-links a, .nav-links .router-link-active {
  color: #fff;
  text-decoration: none;
}
.nav-user {
  margin-right: 1rem;
  color: #41b883;
}
</style> 