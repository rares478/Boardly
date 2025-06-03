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
            <div class="dropdown-item notifications-item" @click="showNotificationsModal = true; dropdownOpen = false; fetchInvitations();">
              <span>Notifications</span>
              <span v-if="notificationCount > 0" :class="['notification-badge', { 'pulse': badgePulse }]">{{ notificationCount }}</span>
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
    <!-- Notifications Modal -->
    <div v-if="showNotificationsModal" class="modal-backdrop" @click.self="showNotificationsModal = false">
      <div class="modal-content notifications-modal">
        <h3>Invitations</h3>
        <div v-if="loadingInvites" class="notif-loading">Loading...</div>
        <div v-else-if="errorInvites" class="notif-error">{{ errorInvites }}</div>
        <div v-else-if="invitations.length === 0" class="notif-empty">
          <img src="/src/assets/empty-invite.svg" alt="No invites" class="notif-empty-img" />
          <div>No invitations.</div>
        </div>
        <div v-else class="notif-list">
          <div v-for="invite in invitations" :key="invite._id" class="notif-item">
            <div class="notif-info">
              <div class="notif-board-thumb" v-if="invite.board?.coverImage">
                <img :src="invite.board.coverImage" alt="Board cover" />
              </div>
              <b>{{ invite.board?.title || 'Board' }}</b>
              <span>from <span class="notif-avatar">{{ invite.fromUser?.username?.charAt(0).toUpperCase() }}</span> <b>{{ invite.fromUser?.username }}</b></span>
            </div>
            <div class="notif-actions">
              <button class="btn btn-primary" @click="handleAccept(invite._id)">Accept</button>
              <button class="btn btn-secondary" @click="handleDecline(invite._id)">Decline</button>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="showNotificationsModal = false">Close</button>
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
  transition: box-shadow 0.2s, transform 0.2s;
}
.notification-badge.pulse {
  animation: badge-pulse 0.6s;
}
@keyframes badge-pulse {
  0% { box-shadow: 0 0 0 0 #e74c3c77; transform: scale(1); }
  60% { box-shadow: 0 0 0 8px #e74c3c33; transform: scale(1.18); }
  100% { box-shadow: 0 0 0 0 #e74c3c00; transform: scale(1); }
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
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content.notifications-modal {
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
.notif-list {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin: 1.2rem 0 0.5rem 0;
}
.notif-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg);
  border-radius: 8px;
  padding: 0.8rem 1.1rem;
  box-shadow: 0 1px 4px rgba(60,60,60,0.07);
}
.notif-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.notif-actions {
  display: flex;
  gap: 0.7rem;
}
.notif-loading, .notif-error, .notif-empty {
  margin: 1.5rem 0;
  text-align: center;
  color: #888;
}
.notif-board-thumb {
  width: 38px;
  height: 38px;
  border-radius: 7px;
  overflow: hidden;
  margin-bottom: 0.3em;
  box-shadow: 0 1px 4px rgba(60,60,60,0.10);
}
.notif-board-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.notif-avatar {
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
.notif-empty-img {
  width: 70px;
  opacity: 0.7;
  margin-bottom: 0.7em;
}
</style> 