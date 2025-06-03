<template>
  <nav class="navbar">
    <router-link to="/dashboard" class="nav-logo">Boardly</router-link>
    <div class="nav-links">
      <button class="theme-toggle-btn" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
        <span v-if="isDark">🌙</span>
        <span v-else>☀️</span>
      </button>
      <template v-if="auth.token">
        <div class="nav-user-dropdown-wrapper" ref="dropdownRef">
          <button class="nav-user-btn" @click="dropdownOpen = !dropdownOpen">
            <span>{{ auth.user?.username }}</span>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div v-if="dropdownOpen" class="nav-user-dropdown">
            <div class="dropdown-item notifications-item">
              <span>Notifications</span>
              <span v-if="notificationCount > 0" class="notification-badge">{{ notificationCount }}</span>
            </div>
            <router-link to="/dashboard" class="dropdown-item" @click="dropdownOpen = false">Dashboard</router-link>
            <a href="#" class="dropdown-item" @click.prevent="logout">Logout</a>
          </div>
        </div>
      </template>
      <template v-else>
        <router-link to="/login" class="nav-btn nav-btn-outline">Login</router-link>
        <router-link to="/register" class="nav-btn nav-btn-filled">Register</router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '@/store';
import { useRouter } from 'vue-router';
import { nextTick } from 'vue';

const auth = useAuthStore();
const router = useRouter();

const isDark = ref(false);
const dropdownOpen = ref(false);
const notificationCount = ref(0); // Replace with real notification count when available
const dropdownRef = ref(null);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark-theme', isDark.value);
  document.documentElement.classList.toggle('light-theme', !isDark.value);
};

function handleClickOutside(event) {
  if (dropdownOpen.value && dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    dropdownOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

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
  color: var(--color-primary) !important;
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
.nav-user-dropdown-wrapper {
  position: relative;
  display: inline-block;
}
.nav-user-btn {
  background: none;
  border: none;
  color: #41b883;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  transition: background 0.15s;
}
.nav-user-btn:hover, .nav-user-btn:focus {
  background: rgba(65,184,131,0.08);
}
.nav-user-dropdown {
  position: absolute;
  right: 0;
  top: 110%;
  min-width: 170px;
  background: var(--color-card);
  color: var(--color-text);
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(60,60,60,0.13);
  padding: 0.5rem 0;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.dropdown-item {
  padding: 0.7rem 1.2rem;
  cursor: pointer;
  color: var(--color-text);
  text-decoration: none;
  font-size: 1rem;
  border: none;
  background: none;
  text-align: left;
  transition: background 0.13s, color 0.13s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.dropdown-item:hover {
  background: var(--color-bg);
  color: var(--color-primary);
}
.notifications-item {
  justify-content: space-between;
}
.notification-badge {
  background: #e74c3c;
  color: #fff;
  border-radius: 10px;
  padding: 0.1em 0.7em;
  font-size: 0.95em;
  font-weight: 700;
  margin-left: 0.5em;
}
.nav-btn {
  display: inline-block;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 6px;
  padding: 0.4rem 1.1rem;
  margin-left: 0.3rem;
  transition: background 0.18s, color 0.18s, border 0.18s;
  border: 2px solid transparent;
  cursor: pointer;
  text-align: center;
}
.nav-btn-outline {
  background: transparent;
  color: #fff;
  border: 2px solid #fff;
}
.nav-btn-outline:hover, .nav-btn-outline:focus {
  background: rgba(255,255,255,0.12);
  color: #fff;
}
.nav-btn-filled {
  background: var(--color-primary);
  color: #fff;
  border: 2px solid var(--color-primary);
}
.nav-btn-filled:hover, .nav-btn-filled:focus {
  background: #369f6b;
  border-color: #369f6b;
  color: #fff;
}
</style> 