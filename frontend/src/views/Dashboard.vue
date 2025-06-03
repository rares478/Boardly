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
          <!-- Board cover image removed, now background -->
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
  align-items: center;
  min-height: 110px;
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
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-primary-dark);
  text-decoration: none;
  flex: 1;
  padding: 1.2rem 1.2rem;
  border-radius: 12px;
  transition: background 0.15s;
  display: block;
  z-index: 2;
  margin-top: 0;
  background: none;
  position: relative;
  /* Add padding-top to avoid overlapping the 3-dots button */
  padding-top: 2.5rem;
  pointer-events: auto;
}
.board-link:hover {
  background: #f4f5f7;
}
.board-link-overlay {
  color: #fff !important;
  text-shadow: 0 2px 8px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.18);
  background: rgba(0,0,0,0.18);
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
</style> 