<template>
  <div class="dashboard-container">
    <h2 class="dashboard-title">Your Boards</h2>
    <div v-if="loading" class="dashboard-loading">Loading...</div>
    <div v-else>
      <div v-if="boards.length === 0" class="dashboard-empty">
        <img src="/src/assets/logo.svg" alt="No boards" class="dashboard-empty-illustration" />
        <p class="dashboard-empty-text">No boards yet. Click the <b>+</b> button to create your first board!</p>
      </div>
      <div v-else class="boards-list">
        <div v-for="board in boards" :key="board._id" class="card board-card" :style="board.coverImage ? { backgroundImage: `url('${board.coverImage}')` } : {}">
          <div class="board-accent"></div>
          <!-- 3-dots menu button -->
          <button class="board-menu-btn" @click.stop="openEditModal(board)">
            <span>⋮</span>
          </button>
          <!-- Members button -->
          <button class="board-members-btn" @click.stop="openMembersModal(board)">
            <span>👥</span> Members
          </button>
          <router-link :to="`/board/${board._id}`" class="board-link" :class="{ 'board-link-overlay': board.coverImage }">{{ board.title }}</router-link>
        </div>
      </div>
    </div>
    <!-- Floating Action Button -->
    <button class="fab" @click="showModal = true" title="Create Board">+</button>
    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal-content">
        <h3>Create New Board</h3>
        <form @submit.prevent="createBoard" class="modal-form">
          <input v-model="newBoardTitle" placeholder="Board title" required autofocus />
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">Create</button>
            <button type="button" class="btn btn-secondary" @click="showModal = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Edit Board Modal -->
    <div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
      <div class="modal-content">
        <h3>Edit Board</h3>
        <form @submit.prevent="saveBoardEdit" class="modal-form">
          <input v-model="editBoardTitle" placeholder="Board title" required autofocus />
          <input v-model="editBoardDescription" placeholder="Description (optional)" />
          <input v-model="editBoardCoverImage" placeholder="Cover image URL (optional)" />
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary">Save</button>
            <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Members Modal -->
    <div v-if="showMembersModal" class="modal-backdrop" @click.self="closeMembersModal">
      <div class="modal-content">
        <h3>Board Members</h3>
        <div v-if="membersLoading">Loading...</div>
        <div v-else>
          <div class="members-list">
            <div v-for="member in boardMembers" :key="member._id" class="member-row">
              <span class="member-avatar">{{ member.username.charAt(0).toUpperCase() }}</span>
              <span class="member-name">{{ member.username }} <span class="member-email">({{ member.email }})</span></span>
              <button v-if="canRemoveMember(member)" class="btn btn-member-remove" @click="removeMember(member._id)">Remove</button>
            </div>
          </div>
          <div class="add-member-section">
            <input v-model="userSearch" placeholder="Search users..." @input="searchUsers" />
            <div v-if="userSearchLoading" class="search-results">Searching...</div>
            <div v-else-if="userSearchResults.length" class="search-results">
              <div v-for="user in userSearchResults" :key="user._id" class="search-result-row">
                <span>{{ user.username }} <span class="member-email">({{ user.email }})</span></span>
                <button class="btn btn-member-add" @click="addMember(user._id)">Add</button>
              </div>
            </div>
            <div v-else-if="userSearchNoResults && userSearch" class="search-results">No users found.</div>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="closeMembersModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/api';

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
async function addMember(userId) {
  await api.post(`/api/boards/${currentBoardId.value}/members`, { userId });
  await fetchBoardMembers();
  userSearch.value = '';
  userSearchResults.value = [];
}
async function removeMember(userId) {
  await api.delete(`/api/boards/${currentBoardId.value}/members/${userId}`);
  await fetchBoardMembers();
}
function canRemoveMember(member) {
  // Only allow removing if you are the owner or it's yourself
  // (You can enhance this logic as needed)
  return true;
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
.boards-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
}
.board-card {
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
.board-card:hover {
  box-shadow: 0 8px 32px rgba(60,60,60,0.16);
  transform: translateY(-2px) scale(1.02);
}
.board-card .board-accent {
  width: 7px;
  height: 100%;
  background: linear-gradient(135deg, #41b883 60%, #34495e 100%);
  border-radius: 8px 0 0 8px;
  margin-right: 1.2rem;
  z-index: 2;
}
/* 3-dots menu button */
.board-menu-btn {
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
.board-card:hover .board-menu-btn {
  opacity: 1;
}
.board-menu-btn:focus {
  opacity: 1;
}
/* Board cover image removed, now background */
.board-link {
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
.board-link:hover {
  background: #f4f5f7;
}
.board-link-overlay {
  color: #fff !important;
  text-shadow: 0 2px 8px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.18);
  background: none;
}
.board-card[style*='background-image'] {
  background-color: #222;
}
.board-card[style*='background-image']::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.10) 100%);
  z-index: 1;
  pointer-events: none;
}
.board-card[style*='background-image'] .board-accent {
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
.fab {
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
.fab:hover {
  background: linear-gradient(135deg, #34495e 60%, #41b883 100%);
  box-shadow: 0 8px 32px rgba(60,60,60,0.22);
  transform: scale(1.07);
}
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
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
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  width: 100%;
}
.modal-form input {
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  border: 1.5px solid var(--color-secondary);
  font-size: 1.1rem;
  background: var(--color-background);
  color: var(--color-text);
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.2rem;
}
.btn-primary {
  background: #41b883;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-primary:hover {
  background: #34495e;
}
.btn-secondary {
  background: #e0e0e0;
  color: #34495e;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-secondary:hover {
  background: #bdbdbd;
  color: #222;
}
@media (max-width: 700px) {
  .dashboard-container {
    padding: 1rem 0.2rem 4rem 0.2rem;
  }
  .boards-list {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
  .fab {
    right: 1.2rem;
    bottom: 1.2rem;
    width: 52px;
    height: 52px;
    font-size: 2rem;
  }
  .modal-content {
    padding: 1.2rem 0.7rem 1.2rem 0.7rem;
    min-width: 0;
  }
}
/* Members button */
.board-members-btn {
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
.board-members-btn:hover {
  background: #e0e0e0;
  color: #41b883;
}
.members-list {
  margin-bottom: 1rem;
}
.member-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.member-avatar {
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
.member-name {
  flex: 1;
}
.member-email {
  color: #888;
  font-size: 0.95em;
}
.btn-member-remove {
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3em 0.9em;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-member-remove:hover {
  background: #c0392b;
}
.add-member-section {
  margin-top: 1.2rem;
}
.search-results {
  margin-top: 0.5rem;
  background: #f4f5f7;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(60,60,60,0.07);
  padding: 0.5rem 0.7rem;
}
.search-result-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.4rem;
}
.btn-member-add {
  background: #41b883;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.3em 0.9em;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-member-add:hover {
  background: #34495e;
}
</style> 