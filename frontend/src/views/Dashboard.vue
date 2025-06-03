<template>
  <div class="dashboard-container">
    <h2 class="dashboard-title">Your Boards</h2>
    <div v-if="loading" class="dashboard-loading">Loading...</div>
    <div v-else>
      <div v-if="boards.length === 0" class="dashboard-empty">
        <img src="/src/assets/logo.svg" alt="No boards" class="dashboard-empty-illustration" />
        <p class="dashboard-empty-text">No boards yet. Click the <b>+</b> button to create your first board!</p>
      </div>
      <div v-else class="dashboard-boards-list">
        <div v-for="board in boards" :key="board._id" class="dashboard-board-card" :style="board.coverImage ? { backgroundImage: `url('${board.coverImage}')` } : {}">
          <div class="dashboard-board-accent"></div>
          <!-- 3-dots menu button -->
          <button class="dashboard-board-menu-btn" @click.stop="openEditModal(board)">
            <span>⋮</span>
          </button>
          <!-- Members button -->
          <button class="dashboard-board-members-btn" @click.stop="openMembersModal(board)">
            <span>👥</span> Members
          </button>
          <router-link :to="`/board/${board._id}`" class="dashboard-board-link" :class="{ 'dashboard-board-link-overlay': board.coverImage }">{{ board.title }}</router-link>
        </div>
      </div>
    </div>
    <!-- Floating Action Button -->
    <button class="dashboard-fab" @click="showModal = true" title="Create Board">+</button>
    <!-- Modal -->
    <div v-if="showModal" class="dashboard-modal-backdrop" @click.self="showModal = false">
      <div class="dashboard-modal-content">
        <h3>Create New Board</h3>
        <form @submit.prevent="createBoard" class="dashboard-modal-form">
          <input v-model="newBoardTitle" placeholder="Board title" required autofocus />
          <div class="dashboard-modal-actions">
            <button type="submit" class="dashboard-btn-primary">Create</button>
            <button type="button" class="dashboard-btn-secondary" @click="showModal = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Edit Board Modal -->
    <div v-if="showEditModal" class="dashboard-modal-backdrop" @click.self="closeEditModal">
      <div class="dashboard-modal-content">
        <h3>Edit Board</h3>
        <form @submit.prevent="saveBoardEdit" class="dashboard-modal-form">
          <input v-model="editBoardTitle" placeholder="Board title" required autofocus />
          <input v-model="editBoardDescription" placeholder="Description (optional)" />
          <input v-model="editBoardCoverImage" placeholder="Cover image URL (optional)" />
          <div class="dashboard-modal-actions">
            <button type="submit" class="dashboard-btn-primary">Save</button>
            <button type="button" class="dashboard-btn-secondary" @click="closeEditModal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Members Modal -->
    <div v-if="showMembersModal" class="dashboard-modal-backdrop" @click.self="closeMembersModal">
      <div class="dashboard-modal-content">
        <h3>Board Members</h3>
        <div v-if="membersLoading">Loading...</div>
        <div v-else>
          <div class="dashboard-members-list">
            <div v-for="member in boardMembers" :key="member._id" class="dashboard-member-row">
              <span class="dashboard-member-avatar">{{ member.username.charAt(0).toUpperCase() }}</span>
              <span class="dashboard-member-name">{{ member.username }} <span class="dashboard-member-email">({{ member.email }})</span></span>
              <button v-if="canRemoveMember(member)" class="dashboard-btn-member-remove" @click="removeMember(member._id)">Remove</button>
            </div>
          </div>
          <div v-if="pendingInvites.length" class="dashboard-pending-list">
            <div class="dashboard-pending-title">Pending Invitations</div>
            <div v-for="user in pendingInvites" :key="user._id" class="dashboard-member-row dashboard-pending-row">
              <span class="dashboard-member-avatar">{{ user.username ? user.username.charAt(0).toUpperCase() : '?' }}</span>
              <span class="dashboard-member-name">{{ user.username || user._id }} <span class="dashboard-member-email">({{ user.email || '' }})</span></span>
              <span class="dashboard-pending-badge">Pending</span>
              <button
                v-if="auth.user && (boardOwnerId === auth.user._id || user.invitedBy === auth.user._id)"
                class="dashboard-btn-cancel-invite"
                @click="cancelInvite(user._id)"
                title="Cancel invitation"
              >🗑️</button>
            </div>
          </div>
          <div class="dashboard-add-member-section">
            <input v-model="userSearch" placeholder="Search users..." @input="searchUsers" class="dashboard-member-search-input" />
            <div v-if="userSearchLoading" class="dashboard-search-results">Searching...</div>
            <div v-else-if="userSearchResults.length" class="dashboard-search-results">
              <div v-for="user in userSearchResults" :key="user._id" class="dashboard-search-result-row">
                <span>{{ user.username }} <span class="dashboard-member-email">({{ user.email }})</span></span>
                <button
                  class="dashboard-btn-member-add"
                  :disabled="pendingInvites.includes(user._id)"
                  @click="addMember(user._id)"
                  v-tooltip="pendingInvites.includes(user._id) ? 'User already invited' : 'Send invitation to join this board'"
                >
                  {{ pendingInvites.includes(user._id) ? 'Invited' : 'Invite' }}
                </button>
              </div>
            </div>
            <div v-else-if="userSearchNoResults && userSearch" class="dashboard-search-results">No users found.</div>
          </div>
        </div>
        <div class="dashboard-modal-actions">
          <button type="button" class="dashboard-btn-secondary" @click="closeMembersModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/api';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '@/store';

const toast = useToast();
const auth = useAuthStore();

const boards = ref([]);
const loading = ref(false);
const newBoardTitle = ref('');
const showModal = ref(false);

// Edit modal state
const showEditModal = ref(false);
const editBoardId = ref(null);
const editBoardTitle = ref('');
const editBoardDescription = ref('');
const editBoardCoverImage = ref('');

// Members modal state
const showMembersModal = ref(false);
const membersLoading = ref(false);
const boardMembers = ref([]);
const userSearch = ref('');
const userSearchResults = ref([]);
const currentBoardId = ref(null);
const userSearchLoading = ref(false);
const userSearchNoResults = ref(false);
const pendingInvites = ref([]);
const boardOwnerId = ref(null);
let searchTimeout = null;

const fetchBoards = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/boards');
    boards.value = res.data;
  } finally {
    loading.value = false;
  }
};

const createBoard = async () => {
  if (!newBoardTitle.value) return;
  await api.post('/api/boards', { title: newBoardTitle.value });
  newBoardTitle.value = '';
  showModal.value = false;
  fetchBoards();
};

function openEditModal(board) {
  editBoardId.value = board._id;
  editBoardTitle.value = board.title;
  editBoardDescription.value = board.description || '';
  editBoardCoverImage.value = board.coverImage || '';
  showEditModal.value = true;
}
function closeEditModal() {
  showEditModal.value = false;
  editBoardId.value = null;
  editBoardTitle.value = '';
  editBoardDescription.value = '';
  editBoardCoverImage.value = '';
}
const saveBoardEdit = async () => {
  if (!editBoardId.value) return;
  await api.put(`/api/boards/${editBoardId.value}`, {
    title: editBoardTitle.value,
    description: editBoardDescription.value,
    coverImage: editBoardCoverImage.value,
  });
  closeEditModal();
  fetchBoards();
};

function openMembersModal(board) {
  currentBoardId.value = board._id;
  showMembersModal.value = true;
  fetchBoardMembers();
  fetchPendingInvites();
  fetchBoardOwner();
}
function closeMembersModal() {
  showMembersModal.value = false;
  boardMembers.value = [];
  userSearch.value = '';
  userSearchResults.value = [];
  currentBoardId.value = null;
}
async function fetchBoardMembers() {
  if (!currentBoardId.value) return;
  membersLoading.value = true;
  try {
    const res = await api.get(`/api/boards/${currentBoardId.value}/members`);
    boardMembers.value = res.data;
  } finally {
    membersLoading.value = false;
  }
}
async function searchUsers() {
  if (searchTimeout) clearTimeout(searchTimeout);
  userSearchLoading.value = true;
  userSearchNoResults.value = false;
  if (!userSearch.value.trim()) {
    userSearchResults.value = [];
    userSearchLoading.value = false;
    userSearchNoResults.value = false;
    return;
  }
  searchTimeout = setTimeout(async () => {
    const res = await api.get(`/api/boards/users?q=${encodeURIComponent(userSearch.value)}`);
    // Filter out users already in the board
    userSearchResults.value = res.data.filter(u =>
      !boardMembers.value.some(m => m._id === u._id)
    );
    userSearchLoading.value = false;
    userSearchNoResults.value = userSearchResults.value.length === 0;
  }, 400);
}
async function fetchPendingInvites() {
  if (!currentBoardId.value) return;
  try {
    const res = await api.get(`/api/invitations/board/${currentBoardId.value}`);
    // Each invite has toUser: { _id, username, email }
    pendingInvites.value = res.data.map(i => i.toUser);
  } catch {}
}
async function addMember(userId) {
  try {
    await api.post('/api/invitations', { toUser: userId, board: currentBoardId.value });
    userSearch.value = '';
    userSearchResults.value = [];
    fetchPendingInvites();
    toast.success('Invitation sent!');
  } catch (e) {
    toast.error(e?.response?.data?.message || 'Failed to send invitation.');
  }
}
async function removeMember(userId) {
  await api.delete(`/api/boards/${currentBoardId.value}/members/${userId}`);
  await fetchBoardMembers();
}
function canRemoveMember(member) {
  // Only allow removing if you are the owner or it's yourself
  return true;
}

async function fetchBoardOwner() {
  if (!currentBoardId.value) return;
  try {
    const res = await api.get(`/api/boards/${currentBoardId.value}`);
    boardOwnerId.value = res.data.owner;
  } catch {}
}

async function cancelInvite(userId) {
  // Find the invite for this user
  try {
    const res = await api.get(`/api/invitations/board/${currentBoardId.value}`);
    const invite = res.data.find(i => i.toUser._id === userId);
    if (!invite) return toast.error('Invite not found');
    await api.delete(`/api/invitations/${invite._id}`);
    toast.success('Invitation cancelled');
    fetchPendingInvites();
  } catch {
    toast.error('Failed to cancel invitation');
  }
}

onMounted(fetchBoards);
</script>

<style scoped>
.dashboard-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2.5rem 1.5rem 4rem 1.5rem;
  background: var(--color-card);
  border-radius: 18px;
  box-shadow: var(--color-shadow);
  min-height: 60vh;
  position: relative;
}
.dashboard-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--color-primary-dark);
  margin-bottom: 2.5rem;
  text-align: left;
}
.dashboard-loading {
  text-align: center;
  font-size: 1.2rem;
  color: #888;
  margin-top: 2rem;
}
.dashboard-boards-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
}
.dashboard-board-card {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 180px;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(60,60,60,0.10);
  transition: box-shadow 0.2s, transform 0.15s;
  overflow: hidden;
  background: var(--color-card);
  padding: 0 0 0 0.7rem;
  background-size: cover;
  background-position: center;
}
.dashboard-board-card:hover {
  box-shadow: 0 8px 32px rgba(60,60,60,0.16);
  transform: translateY(-2px) scale(1.02);
}
.dashboard-board-card .dashboard-board-accent {
  width: 7px;
  height: 100%;
  background: linear-gradient(135deg, #41b883 60%, #34495e 100%);
  border-radius: 8px 0 0 8px;
  margin-right: 1.2rem;
  z-index: 2;
}
.dashboard-board-menu-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255,255,255,0.85);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: #888;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 10;
  pointer-events: auto;
}
.dashboard-board-card:hover .dashboard-board-menu-btn {
  opacity: 1;
}
.dashboard-board-menu-btn:focus {
  opacity: 1;
}
.dashboard-board-link {
  position: relative;
  z-index: 2;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-primary-dark);
  text-decoration: none;
  flex: 1;
  padding: 1.2rem 1.2rem;
  border-radius: 12px;
  transition: background 0.15s;
  display: block;
  margin-top: 0;
  background: none;
  padding-top: 0;
  pointer-events: auto;
}
.dashboard-board-link:hover {
  background: #f4f5f7;
}
.dashboard-board-link-overlay {
  color: #fff !important;
  text-shadow: 0 2px 8px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.18);
  background: none;
}
.dashboard-board-card[style*='background-image'] {
  background-color: #222;
}
.dashboard-board-card[style*='background-image']::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.10) 100%);
  z-index: 1;
  pointer-events: none;
}
.dashboard-board-card[style*='background-image'] .dashboard-board-accent {
  background: rgba(0,0,0,0.18);
}
.dashboard-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  margin-top: 2rem;
  color: #888;
}
.dashboard-empty-illustration {
  width: 90px;
  height: 90px;
  margin-bottom: 1.2rem;
  opacity: 0.8;
}
.dashboard-empty-text {
  font-size: 1.2rem;
  text-align: center;
  color: #888;
}
.dashboard-fab {
  position: fixed;
  right: 2.5rem;
  bottom: 2.5rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #41b883 60%, #34495e 100%);
  color: #fff;
  font-size: 2.5rem;
  font-weight: 900;
  border: none;
  box-shadow: 0 4px 24px rgba(60,60,60,0.18);
  cursor: pointer;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s, box-shadow 0.18s, transform 0.13s;
}
.dashboard-fab:hover {
  background: linear-gradient(135deg, #34495e 60%, #41b883 100%);
  box-shadow: 0 8px 32px rgba(60,60,60,0.22);
  transform: scale(1.07);
}
.dashboard-modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dashboard-modal-content {
  background: var(--color-card);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(60,60,60,0.18);
  padding: 2.2rem 2.5rem 2rem 2.5rem;
  min-width: 320px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.dashboard-modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  width: 100%;
}
.dashboard-modal-form input {
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-secondary);
  font-size: 1.1rem;
  background: var(--color-card);
  color: var(--color-text);
}
.dashboard-modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.2rem;
}
.dashboard-btn-primary {
  background: #41b883;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.dashboard-btn-primary:hover {
  background: #34495e;
}
.dashboard-btn-secondary {
  background: #e0e0e0;
  color: #34495e;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.dashboard-btn-secondary:hover {
  background: #bdbdbd;
  color: #222;
}
@media (max-width: 700px) {
  .dashboard-container {
    padding: 1rem 0.2rem 4rem 0.2rem;
  }
  .dashboard-boards-list {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
  .dashboard-fab {
    right: 1.2rem;
    bottom: 1.2rem;
    width: 52px;
    height: 52px;
    font-size: 2rem;
  }
  .dashboard-modal-content {
    padding: 1.2rem 0.7rem 1.2rem 0.7rem;
    min-width: 0;
  }
}
.dashboard-board-members-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(255,255,255,0.85);
  border: none;
  border-radius: 8px;
  padding: 0.3rem 0.8rem;
  font-size: 1rem;
  color: #34495e;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 1px 4px rgba(60,60,60,0.07);
  opacity: 0.92;
  transition: background 0.15s, color 0.15s;
}
.dashboard-board-members-btn:hover {
  background: #e0e0e0;
  color: #41b883;
}
.dashboard-members-list {
  margin-bottom: 1rem;
}
.dashboard-member-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.dashboard-member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #41b883;
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dashboard-member-name {
  flex: 1;
}
.dashboard-member-email {
  color: #888;
  font-size: 0.95em;
}
.dashboard-btn-member-remove {
  background: #e74c3c !important;
  color: #fff !important;
  border: none;
  border-radius: 6px;
  padding: 0.3em 0.9em;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(60,60,60,0.07);
}
.dashboard-btn-member-remove:hover {
  background: #c0392b !important;
  color: #fff !important;
}
.dashboard-add-member-section {
  margin-top: 1.2rem;
}
.dashboard-search-results {
  margin-top: 0.5rem;
  background: var(--color-card);
  color: var(--color-text);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(60,60,60,0.07);
  padding: 0.5rem 0.7rem;
}
.dashboard-search-result-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.4rem;
  justify-content: space-between;
}
.dashboard-btn-member-add {
  background: #41b883 !important;
  color: #fff !important;
  border: none;
  border-radius: 6px;
  padding: 0.3em 0.9em;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(60,60,60,0.07);
}
.dashboard-btn-member-add:hover {
  background: #369f6b !important;
  color: #fff !important;
}
.dashboard-member-search-input {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1.5px solid var(--color-secondary);
  border-radius: 6px;
  background: var(--color-card);
  color: var(--color-text);
  font-size: 1rem;
  box-shadow: 0 1px 4px rgba(60, 60, 60, 0.04);
  transition: border 0.2s, box-shadow 0.2s;
}
.dashboard-pending-badge {
  background: #ffd700;
  color: #222;
  border-radius: 6px;
  padding: 0.2em 0.7em;
  font-size: 0.95em;
  font-weight: 700;
  margin-left: 0.5em;
}
.dashboard-pending-list {
  margin-top: 1.2rem;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}
.dashboard-pending-title {
  font-weight: 700;
  color: #888;
  margin-bottom: 0.7em;
  font-size: 1.08em;
}
.dashboard-pending-row {
  opacity: 0.7;
}
.dashboard-btn-cancel-invite {
  background: #fff3f3 !important;
  color: #e74c3c !important;
  border: none;
  border-radius: 6px;
  padding: 0.3em 0.7em;
  cursor: pointer;
  font-size: 1.1em;
  margin-left: 0.5em;
  transition: background 0.18s, color 0.18s;
}
.dashboard-btn-cancel-invite:hover {
  background: #e74c3c !important;
  color: #fff !important;
}
</style> 