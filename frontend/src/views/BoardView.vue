<template>
  <div class="board-view-container">
    <h2 class="board-view-title">{{ board?.title }}</h2>
    <div v-if="loading" class="board-view-loading">Loading...</div>
    <div v-else class="board-view-lists-container">
      <vuedraggable v-model="lists" group="lists" item-key="_id" direction="horizontal" @end="onListDrop">
        <template #item="{ element: list }">
          <div class="board-view-list-column board-view-card">
            <h3 class="board-view-list-title">{{ list.title }}</h3>
            <vuedraggable v-model="list.cards" :group="cardGroup" :item-key="'_id'" @end="e => onCardDrop(list, e)">
              <template #item="{ element: card }">
                <div class="board-view-card-item board-view-card" @click="openCard(card._id)">
                  <div class="board-view-card-labels">
                    <span v-for="(label, i) in card.labels" :key="i" class="board-view-card-label-badge" :style="{ backgroundColor: label.color }">
                      <!-- No label name, just color -->
                    </span>
                  </div>
                  {{ card.title }}
                </div>
              </template>
            </vuedraggable>
            <form @submit.prevent="addCard(list)" class="board-view-add-card-form">
              <input v-model="newCardTitles[list._id]" placeholder="Add card" class="board-view-add-card-input" />
              <button type="submit" class="board-view-btn">Add</button>
            </form>
          </div>
        </template>
      </vuedraggable>
      <form @submit.prevent="addList" class="board-view-add-list-form board-view-card">
        <input v-model="newListTitle" placeholder="Add list" class="board-view-add-list-input" />
        <button type="submit" class="board-view-btn">Add List</button>
      </form>
    </div>
    <CardDetails v-if="showCardModal" :cardId="selectedCardId" @close="closeCard" @updated="fetchLists" />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api';
import vuedraggable from 'vuedraggable';
import CardDetails from '@/components/CardDetails.vue';

const route = useRoute();
const boardId = route.params.id;
const board = ref(null);
const lists = ref([]);
const loading = ref(false);
const newListTitle = ref('');
const newCardTitles = reactive({});
const cardGroup = { name: 'cards', pull: true, put: true };
const showCardModal = ref(false);
const selectedCardId = ref(null);

const fetchBoard = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/api/boards/${boardId}`);
    board.value = res.data;
    await fetchLists();
  } finally {
    loading.value = false;
  }
};

const fetchLists = async () => {
  const res = await api.get(`/api/lists/board/${boardId}`);
  const listsData = res.data;
  for (const list of listsData) {
    const cardsRes = await api.get(`/api/cards/list/${list._id}`);
    list.cards = cardsRes.data;
  }
  lists.value = listsData;
};

const addList = async () => {
  if (!newListTitle.value) return;
  await api.post('/api/lists', { title: newListTitle.value, board: boardId, position: lists.value.length });
  newListTitle.value = '';
  await fetchLists();
};

const addCard = async (list) => {
  const title = newCardTitles[list._id];
  if (!title) return;
  await api.post('/api/cards', { title, list: list._id, position: list.cards.length });
  newCardTitles[list._id] = '';
  await fetchLists();
};

const onListDrop = async () => {
  const listOrder = lists.value.map(l => l._id);
  await api.patch(`/api/lists/reorder/${boardId}`, { listOrder });
  await fetchLists();
};

const onCardDrop = async (list) => {
  const cardOrder = list.cards.map(c => c._id);
  await api.patch(`/api/cards/reorder/${list._id}`, { cardOrder, targetListId: list._id });
  await fetchLists();
};

const openCard = (cardId) => {
  selectedCardId.value = cardId;
  showCardModal.value = true;
};
const closeCard = () => {
  showCardModal.value = false;
  selectedCardId.value = null;
};

onMounted(fetchBoard);
</script>

<style scoped>
.board-view-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
  background: var(--color-bg);
  border-radius: 12px;
}
.board-view-lists-container {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: 1rem;
  white-space: nowrap;
}
.board-view-list-column {
  background: var(--color-card);
  border-radius: 8px;
  min-width: 270px;
  padding: 1rem;
  box-shadow: var(--color-shadow);
  display: inline-block;
  vertical-align: top;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 1rem;
}
.board-view-card-item {
  position: relative;
  background: var(--color-card);
  border-radius: 6px;
  margin-bottom: 0.5rem;
  padding: 0.7rem 1rem 0.7rem 1.7rem;
  box-shadow: 0 2px 8px rgba(60,60,60,0.10);
  font-size: 1rem;
  transition: box-shadow 0.2s, border-color 0.2s, transform 0.13s;
  border: 1.5px solid var(--color-secondary);
  overflow: hidden;
}
.board-view-card-item::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 6px;
  border-radius: 6px 0 0 6px;
  background: #41b883;
  opacity: 0.85;
}
.board-view-card-item:hover {
  box-shadow: 0 8px 24px rgba(65,184,131,0.18), 0 2px 8px rgba(60,60,60,0.10);
  border-color: #41b883;
  transform: scale(1.03);
}
.board-view-add-list-form, .board-view-add-card-form {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.board-view-add-list-form input, .board-view-add-card-form input {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1.5px solid var(--color-secondary);
  border-radius: 6px;
  background: var(--color-card);
  color: var(--color-text);
  font-size: 1rem;
  box-shadow: 0 1px 4px rgba(60,60,60,0.04);
  transition: border 0.2s, box-shadow 0.2s;
}
.board-view-add-list-form input:focus, .board-view-add-card-form input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 2px 8px rgba(65,184,131,0.10);
}
.board-view-card-labels {
  display: flex;
  gap: 0.3rem;
  margin-bottom: 0.3rem;
  flex-wrap: wrap;
}
.board-view-card-label-badge {
  display: inline-block;
  min-width: 24px;
  height: 7px;
  padding: 0;
  border-radius: 4px;
  font-size: 0;
  color: transparent;
  margin-bottom: 2px;
}
.board-view-btn {
  background: #41b883;
  color: #fff;
  border: 1.5px solid var(--color-secondary);
  border-radius: 6px;
  padding: 0.5rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  font-size: 1rem;
  box-shadow: 0 1px 4px rgba(60,60,60,0.07);
}
.board-view-btn:hover {
  background: #34495e;
  border-color: #41b883;
}
</style> 