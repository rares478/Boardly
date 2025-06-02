<template>
  <div class="dashboard-container">
    <h2>Your Boards</h2>
    <form @submit.prevent="createBoard" class="dashboard-form">
      <input v-model="newBoardTitle" placeholder="New board title" required />
      <button type="submit" class="btn">Create Board</button>
    </form>
    <div v-if="loading">Loading...</div>
    <div v-else class="boards-list">
      <div v-for="board in boards" :key="board._id" class="card board-card">
        <router-link :to="`/board/${board._id}`">{{ board.title }}</router-link>
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
  fetchBoards();
};

onMounted(fetchBoards);
</script>

<style scoped>
.dashboard-container {
  max-width: 700px;
  margin: 2rem auto;
  padding: 2rem;
  background: var(--color-card);
  border-radius: 12px;
  box-shadow: var(--color-shadow);
}
.dashboard-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}
input {
  flex: 1;
}
.boards-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}
.board-card {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 500;
  min-height: 80px;
  transition: box-shadow 0.2s;
}
.board-card a {
  color: var(--color-primary-dark);
  text-decoration: none;
}
.board-card:hover {
  box-shadow: 0 6px 24px rgba(60,60,60,0.13);
}
</style> 