<template>
  <nav class="navbar">
    <router-link to="/dashboard" class="navbar-logo">Boardly</router-link>
    <div class="navbar-links">
      <button class="navbar-theme-toggle-btn" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
        <span v-if="isDark">🌙</span>
        <span v-else>☀️</span>
      </button>
      <template v-if="auth.token">
        <div class="navbar-user-dropdown-wrapper" ref="dropdownRef">
          <button class="navbar-user-btn" @click="dropdownOpen = !dropdownOpen">
            <span>{{ auth.user?.username }}</span>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div v-if="dropdownOpen" class="navbar-user-dropdown">
            <div class="navbar-dropdown-item navbar-notifications-item" @click="showNotificationsModal = true; dropdownOpen = false; fetchInvitations();">
              <span>Notifications</span>
              <span v-if="notificationCount > 0" :class="['navbar-notification-badge', { 'pulse': badgePulse }]">{{ notificationCount }}</span>
            </div>
            <router-link to="/dashboard" class="navbar-dropdown-item" @click="dropdownOpen = false">Dashboard</router-link>
            <a href="#" class="navbar-dropdown-item" @click.prevent="logout">Logout</a>
          </div>
        </div>
      </template>
      <template v-else>
        <router-link to="/login" class="navbar-btn navbar-btn-outline">Login</router-link>
        <router-link to="/register" class="navbar-btn navbar-btn-filled">Register</router-link>
      </template>
    </div>
    <!-- Notifications Modal -->
    <div v-if="showNotificationsModal" class="navbar-modal-backdrop" @click.self="showNotificationsModal = false">
      <div class="navbar-modal-content navbar-notifications-modal">
        <h3>Invitations</h3>
        <div v-if="loadingInvites" class="navbar-notif-loading">Loading...</div>
        <div v-else-if="errorInvites" class="navbar-notif-error">{{ errorInvites }}</div>
        <div v-else-if="invitations.length === 0" class="navbar-notif-empty">
          <img src="/src/assets/empty-invite.svg" alt="No invites" class="navbar-notif-empty-img" />
          <div>No invitations.</div>
        </div>
        <div v-else class="navbar-notif-list">
          <div v-for="invite in invitations" :key="invite._id" class="navbar-notif-item">
            <div class="navbar-notif-info">
              <div class="navbar-notif-board-thumb" v-if="invite.board?.coverImage">
                <img :src="invite.board.coverImage" alt="Board cover" />
              </div>
              <b>{{ invite.board?.title || 'Board' }}</b>
              <span>from <span class="navbar-notif-avatar">{{ invite.fromUser?.username?.charAt(0).toUpperCase() }}</span> <b>{{ invite.fromUser?.username }}</b></span>
            </div>
            <div class="navbar-notif-actions">
              <button class="navbar-btn navbar-btn-primary" @click="handleAccept(invite._id)">Accept</button>
              <button class="navbar-btn navbar-btn-secondary" @click="handleDecline(invite._id)">Decline</button>
            </div>
          </div>
        </div>
        <div class="navbar-modal-actions">
          <button type="button" class="navbar-btn navbar-btn-secondary" @click="showNotificationsModal = false">Close</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useAuthStore } from '@/store';
import { useRouter } from 'vue-router';
import api from '@/api';
import { useToast } from 'vue-toastification';

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();

const isDark = ref(false);
const dropdownOpen = ref(false);
const notificationCount = ref(0);
const dropdownRef = ref(null);
const showNotificationsModal = ref(false);
const invitations = ref([]);
const loadingInvites = ref(false);
const errorInvites = ref('');
const prevCount = ref(0);
const badgePulse = ref(false);

const fetchInvitations = async () => {
  if (!auth.token) return;
  loadingInvites.value = true;
  errorInvites.value = '';
  try {
    const res = await api.get('/api/invitations');
    invitations.value = res.data;
    notificationCount.value = invitations.value.length;
  } catch (e) {
    errorInvites.value = 'Failed to load invitations.';
  } finally {
    loadingInvites.value = false;
  }
};

const handleAccept = async (inviteId) => {
  try {
    await api.post(`/api/invitations/${inviteId}/accept`);
    invitations.value = invitations.value.filter(i => i._id !== inviteId);
    notificationCount.value = invitations.value.length;
    toast.success('Invitation accepted!');
  } catch (e) {
    toast.error('Failed to accept invitation.');
  }
};
const handleDecline = async (inviteId) => {
  try {
    await api.post(`/api/invitations/${inviteId}/decline`);
    invitations.value = invitations.value.filter(i => i._id !== inviteId);
    notificationCount.value = invitations.value.length;
    toast.info('Invitation declined.');
  } catch (e) {
    toast.error('Failed to decline invitation.');
  }
};

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
  if (auth.token) fetchInvitations();
});
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

watch(() => auth.token, (newVal) => {
  if (newVal) fetchInvitations();
  else {
    invitations.value = [];
    notificationCount.value = 0;
  }
});

watch(notificationCount, (newVal, oldVal) => {
  if (newVal > oldVal) {
    badgePulse.value = true;
    setTimeout(() => badgePulse.value = false, 600);
  }
  prevCount.value = newVal;
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
.navbar-logo {
  font-weight: bold;
  color: var(--color-primary) !important;
  font-size: 1.5rem;
  text-decoration: none;
}
.navbar-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.navbar-theme-toggle-btn {
  background: transparent !important;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  margin-right: 1rem;
  color: #ffd700;
  transition: color 0.2s, background 0.2s;
  box-shadow: none;
}
.navbar-theme-toggle-btn:hover {
  color: #41b883;
  background: rgba(65,184,131,0.08);
}
.navbar-user-dropdown-wrapper {
  position: relative;
  display: inline-block;
}
.navbar-user-btn {
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
.navbar-user-btn:hover, .navbar-user-btn:focus {
  background: rgba(65,184,131,0.08);
}
.navbar-user-dropdown {
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
.navbar-dropdown-item {
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
.navbar-dropdown-item:hover {
  background: var(--color-bg);
  color: var(--color-primary);
}
.navbar-notifications-item {
  justify-content: space-between;
}
.navbar-notification-badge {
  background: #e74c3c;
  color: #fff;
  border-radius: 10px;
  padding: 0.1em 0.7em;
  font-size: 0.95em;
  font-weight: 700;
  margin-left: 0.5em;
  transition: box-shadow 0.2s, transform 0.2s;
}
.navbar-notification-badge.pulse {
  animation: badge-pulse 0.6s;
}
@keyframes badge-pulse {
  0% { box-shadow: 0 0 0 0 #e74c3c77; transform: scale(1); }
  60% { box-shadow: 0 0 0 8px #e74c3c33; transform: scale(1.18); }
  100% { box-shadow: 0 0 0 0 #e74c3c00; transform: scale(1); }
}
.navbar-btn {
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
.navbar-btn-outline {
  background: transparent;
  color: #fff;
  border: 2px solid #fff;
}
.navbar-btn-outline:hover, .navbar-btn-outline:focus {
  background: rgba(255,255,255,0.12);
  color: #fff;
}
.navbar-btn-filled {
  background: var(--color-primary);
  color: #fff;
  border: 2px solid var(--color-primary);
}
.navbar-btn-filled:hover, .navbar-btn-filled:focus {
  background: #369f6b;
  border-color: #369f6b;
  color: #fff;
}
.navbar-modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.navbar-modal-content.navbar-notifications-modal {
  background: var(--color-card);
  color: var(--color-text);
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(60,60,60,0.13);
  padding: 2rem 2.5rem 1.5rem 2.5rem;
  min-width: 320px;
  max-width: 95vw;
  min-height: 120px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}
.navbar-notif-list {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin: 1.2rem 0 0.5rem 0;
}
.navbar-notif-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg);
  border-radius: 8px;
  padding: 0.8rem 1.1rem;
  box-shadow: 0 1px 4px rgba(60,60,60,0.07);
}
.navbar-notif-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.navbar-notif-actions {
  display: flex;
  gap: 0.7rem;
}
.navbar-notif-loading, .navbar-notif-error, .navbar-notif-empty {
  margin: 1.5rem 0;
  text-align: center;
  color: #888;
}
.navbar-notif-board-thumb {
  width: 38px;
  height: 38px;
  border-radius: 7px;
  overflow: hidden;
  margin-bottom: 0.3em;
  box-shadow: 0 1px 4px rgba(60,60,60,0.10);
}
.navbar-notif-board-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.navbar-notif-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #41b883;
  color: #fff;
  font-weight: 700;
  font-size: 1em;
  margin-right: 0.3em;
}
.navbar-notif-empty-img {
  width: 70px;
  opacity: 0.7;
  margin-bottom: 0.7em;
}
</style> 