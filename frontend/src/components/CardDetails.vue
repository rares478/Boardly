<template>
  <div class="card-details-modal-backdrop" @click.self="$emit('close')">
    <div class="modal card-details-card-modal-layout">
      <!-- Header: Title, Labels, Due Date, Members, Close -->
      <header class="modal-header card-details-new-modal-header">
        <div class="card-details-modal-header-left">
          <input v-model="card.title" class="card-title-input card-details-new-title-input" placeholder="Card title" />
          <div v-if="card.labels && card.labels.length" class="header-labels-under-title card-details-new-labels-row">
            <span v-for="(label, i) in card.labels" :key="i" class="label-chip" :style="{ backgroundColor: label.color }">
              <span class="label-chip-dot" :style="{ backgroundColor: label.color }"></span>
              <span class="label-chip-name">{{ label.name }}</span>
            </span>
          </div>
        </div>
        <div class="card-details-modal-header-right">
          <div v-if="card.dueDate" class="header-due-date card-details-new-due-date">
            <button class="due-date-badge" @click="rightPanel = 'dueDate'">{{ formatDate(card.dueDate) }}</button>
          </div>
          <div class="header-members card-details-new-header-members">
            <span v-for="member in card.members" :key="member._id" class="member-avatar" :title="member.username">
              {{ member.username.charAt(0).toUpperCase() }}
            </span>
          </div>
        </div>
        <button class="modal-close card-details-new-modal-close" @click="$emit('close')">&times;</button>
      </header>
      <div v-if="loading" class="card-details-loading">Loading...</div>
      <div v-else-if="error" class="card-details-error">{{ error }}</div>
      <div v-else class="modal-body-layout card-body-split">
        <!-- Left: Description and Checklists -->
        <div class="card-left">
          <div class="section">
            <div class="section-header">
              <span class="section-title">Description</span>
              <button v-if="!editingDescription" class="icon-btn" @click="editingDescription = true" title="Edit"><span>✏️</span></button>
              <button v-else class="icon-btn" @click="saveDescription" title="Save"><span>💾</span></button>
            </div>
            <div v-if="editingDescription">
              <textarea v-model="card.description" rows="3" class="desc-textarea" />
            </div>
            <div v-else class="desc-block" @click="editingDescription = true">
              <span v-if="card.description">{{ card.description }}</span>
              <span v-else class="desc-placeholder">Add a more detailed description...</span>
            </div>
          </div>
          <div v-for="(checklist, idx) in card.checklists || []" :key="checklist._id" class="checklist-block">
            <div class="checklist-title-row">
              <span class="checklist-title">{{ checklist.title }}</span>
              <span style="margin-left: 0.5em;" class="checklist-progress">{{ checklist.items.filter(i => i.checked).length }}/{{ checklist.items.length }}</span>
            </div>
            <!-- Progress bar -->
            <div class="progress-bar" v-if="checklist.items.length">
              <div class="progress-bar-inner" :style="{ width: Math.round(100 * checklist.items.filter(i => i.checked).length / checklist.items.length) + '%' }"></div>
            </div>
            <ul class="main-checklist-list">
              <li v-for="item in checklist.items" :key="item._id" class="main-checklist-item">
                <input type="checkbox" v-model="item.checked" @change="updateChecklistItem(checklist._id, item)" />
                <span :class="{ 'checked': item.checked }">{{ item.text }}</span>
              </li>
            </ul>
            <!-- Add checklist item form/button -->
            <form @submit.prevent="addChecklistItem(checklist._id, idx)" class="add-checklist-form main-add-checklist-form">
              <input v-model="newChecklistItemTexts[idx]" placeholder="Add checklist item" class="checklist-text-input" />
              <button type="submit" class="btn btn-checklist-add" title="Add"><span>➕</span></button>
            </form>
          </div>
        </div>
        <!-- Right: Action Buttons -->
        <div class="card-right">
          <button class="sidebar-btn" @click="rightPanel = 'checklist'"><span>✔️ Checklist</span></button>
          <button class="sidebar-btn" @click="rightPanel = 'dueDate'"><span>📅 Due Date</span></button>
          <button class="sidebar-btn" @click="rightPanel = 'labels'"><span>🏷️ Labels</span></button>
          <button class="sidebar-btn" @click="rightPanel = 'members'"><span>👥 Members</span></button>
        </div>
        <!-- Panels -->
        <div v-if="rightPanel === 'checklist'" class="floating-panel checklist-panel">
          <div class="panel-header">
            <span>Add Checklist</span>
            <button class="icon-btn" @click="rightPanel = ''">✖️</button>
          </div>
          <form @submit.prevent="addChecklist" class="add-checklist-form">
            <input v-model="newChecklistTitle" placeholder="Checklist title" class="checklist-text-input" required />
            <input v-model="newChecklistFirstItem" placeholder="First item" class="checklist-text-input" required />
            <button type="submit" class="btn btn-checklist-add">Add</button>
          </form>
        </div>
        <div v-if="rightPanel === 'dueDate'" class="floating-panel due-date-panel">
          <div class="panel-header">
            <span>Due Date</span>
            <button class="icon-btn" @click="rightPanel = ''">✖️</button>
          </div>
          <Datepicker v-model="card.dueDate" :input-class="'date-input'" />
        </div>
        <div v-if="rightPanel === 'labels'" class="floating-panel labels-panel">
          <div class="panel-header">
            <span>Labels</span>
            <button class="icon-btn" @click="rightPanel = ''">✖️</button>
          </div>
          <div class="labels-list">
            <div v-for="(label, i) in card.labels" :key="i" class="label-edit-row">
              <span class="label-chip" :style="{ backgroundColor: label.color }">
                <span class="label-chip-dot" :style="{ backgroundColor: label.color }"></span>
                <span class="label-chip-name">{{ label.name }}</span>
              </span>
              <input v-model="label.name" placeholder="Label name" class="label-name-input" />
              <input v-model="label.color" type="color" class="label-color-input" />
              <button type="button" class="label-remove" @click="removeLabel(i)" title="Delete"><span>🗑️</span></button>
            </div>
            <button type="button" class="label-add" @click="addLabel"><span>➕ Add Label</span></button>
          </div>
        </div>
        <div v-if="rightPanel === 'members'" class="floating-panel members-panel">
          <div class="panel-header">
            <span>Card Members</span>
            <button class="icon-btn" @click="rightPanel = ''">✖️</button>
          </div>
          <div class="members-panel-list">
            <div v-for="user in boardMembers" :key="user._id" class="members-panel-row">
              <span class="member-avatar" :title="user.username">{{ user.username.charAt(0).toUpperCase() }}</span>
              <span class="member-name">{{ user.username }}</span>
              <button v-if="!isMember(user._id)" class="btn btn-member-add" @click="addMember(user._id)"><span>➕</span></button>
              <button v-else class="btn btn-member-remove" @click="removeMember(user._id)"><span>🗑️</span></button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="saveCard">Save</button>
        <button type="button" class="btn btn-secondary" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted} from 'vue';
import api from '@/api';
import { useAuthStore } from '@/store';
import Datepicker from 'vue3-datepicker'

const props = defineProps({
  cardId: { type: String, required: true }
});
const emit = defineEmits(['close', 'updated']);

const card = ref({ title: '', description: '', labels: [], dueDate: '', members: [], checklists: [] });
const editingDescription = ref(false);
const rightPanel = ref('');
const boardMembers = ref([]);

const newChecklistTitle = ref('');
const newChecklistFirstItem = ref('');
const newChecklistItemTexts = ref([]);

const loading = ref(true);
const error = ref('');

const auth = useAuthStore();

const fetchCard = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await api.get(`/api/cards/${props.cardId}`);
    if (Array.isArray(res.data.checklists)) {
      card.value = res.data;
    } else {
      card.value = { ...res.data, checklists: res.data.checklist ? [{ _id: 'default', title: 'Checklist', items: res.data.checklist }] : [] };
    }
    if (card.value.dueDate) card.value.dueDate = card.value.dueDate.slice(0, 10);
  } catch (e) {
    error.value = 'Card not found or failed to load.';
  } finally {
    loading.value = false;
  }
};

const saveCard = async () => {
  // Remove empty labels
  card.value.labels = card.value.labels.filter(l => l.name && l.color);

  // Only send dueDate if it's a valid date string
  const payload = { ...card.value };
  if (!payload.dueDate || isNaN(new Date(payload.dueDate).getTime())) {
    delete payload.dueDate;
  }

  await api.patch(`/api/cards/${props.cardId}`, payload);
  emit('updated');
  emit('close');
};

const saveDescription = async () => {
  editingDescription.value = false;
  await api.patch(`/api/cards/${props.cardId}`, { description: card.value.description });
};

const saveDueDate = async () => {
  if (!card.value.dueDate || isNaN(new Date(card.value.dueDate).getTime())) {
    await api.patch(`/api/cards/${props.cardId}`, { dueDate: null });
  } else {
    await api.patch(`/api/cards/${props.cardId}`, { dueDate: card.value.dueDate });
  }
};

const addLabel = () => {
  card.value.labels.push({ name: '', color: '#61bd4f' });
};
const removeLabel = (i) => {
  card.value.labels.splice(i, 1);
};

const addChecklist = async () => {
  if (!newChecklistTitle.value.trim() || !newChecklistFirstItem.value.trim()) return;
  // Do NOT generate _id here
  const checklist = {
    title: newChecklistTitle.value,
    items: [{ text: newChecklistFirstItem.value, checked: false }]
  };
  // Use the backend endpoint to add a checklist and get the real _id
  await api.post(`/api/cards/${props.cardId}/checklists`, checklist);
  newChecklistTitle.value = '';
  newChecklistFirstItem.value = '';
  await fetchCard();
  rightPanel.value = '';
};

const updateChecklistItem = async (checklistId) => {
  const checklist = card.value.checklists.find(c => c._id === checklistId);
  if (!checklist) return;
  await api.patch(`/api/cards/${props.cardId}`, { checklists: card.value.checklists });
};

const fetchBoardMembers = async () => {
  if (!props.cardId) return;
  // Get the boardId from the card's list's board
  const cardRes = await api.get(`/api/cards/${props.cardId}`);
  const listRes = await api.get(`/api/lists/${cardRes.data.list}`);
  const boardId = listRes.data.board;
  const res = await api.get(`/api/boards/${boardId}/members`);
  boardMembers.value = res.data;
};

const addMember = async (userId) => {
  await api.post(`/api/cards/${props.cardId}/members`, { userId });
  await fetchCard();
};
const removeMember = async (userId) => {
  await api.delete(`/api/cards/${props.cardId}/members/${userId}`);
  await fetchCard();
};
const isMember = (userId) => {
  return (card.value.members || []).some(m => m._id === userId || m === userId);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString();
};

const addChecklistItem = async (checklistId, idx) => {
  const text = newChecklistItemTexts.value[idx];
  if (!text || !text.trim()) return;
  await api.post(`/api/cards/${props.cardId}/checklists/${checklistId}/items`, { text });
  newChecklistItemTexts.value[idx] = '';
  await fetchCard();
};

watch(() => props.cardId, fetchCard);
watch(rightPanel, (val) => {
  if (val === 'members') fetchBoardMembers();
});
onMounted(() => {
  console.log('User ID from JWT:', auth.user?.id);
  fetchCard();
});
</script>

<style scoped>
.card-details-modal-backdrop {
  align-items: center;
  background: rgba(0,0,0,0.25);
  display: flex;
  justify-content: center;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2000;
}
.card-details-card-modal-layout {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  max-width: 900px;
  min-width: 520px;
  overflow: hidden;
  padding: 0;
  width: 95vw;
}
.card-details-new-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: var(--color-card) !important;
  padding: 1.1rem 2rem 1.1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
  min-height: 64px;
  gap: 2rem;
}
.card-details-modal-header-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  flex: 1 1 0;
  gap: 0.2em;
}
.card-details-new-title-input {
  font-size: 1.4rem;
  font-weight: 700;
  border: none;
  background: var(--color-card) !important;
  outline: none;
  padding: 0.1em 0.1em 0.1em 0;
  width: 100%;
  max-width: 420px;
  margin-bottom: 0;
  box-sizing: border-box;
  transition: background 0.2s;
}
.card-details-new-title-input:focus {
  background: #f4f5f7;
  border-radius: 6px;
}
.card-details-new-labels-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.18em;
  margin-top: 0.08em;
  margin-bottom: 0;
  max-width: 100%;
  overflow-x: auto;
  padding: 0;
}
.card-details-modal-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5em;
  min-width: 120px;
  margin-left: 1.5rem;
}
.card-details-new-due-date {
  margin-bottom: 0.2em;
}
.card-details-new-header-members {
  display: flex;
  gap: 0.4em;
  align-items: center;
}
.card-details-new-modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #888;
  cursor: pointer;
  margin-left: 1.2rem;
  margin-top: 0.1em;
  align-self: flex-start;
  transition: color 0.2s;
}
.card-details-new-modal-close:hover {
  color: #e74c3c;
}

.member-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #41b883;
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 1px 4px rgba(60,60,60,0.07);
}
.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #888;
  cursor: pointer;
  margin-left: 1rem;
  transition: color 0.2s;
}
.modal-close:hover {
  color: #e74c3c;
}
.modal-body-layout {
  display: flex;
  flex-direction: row;
  gap: 2.5rem;
  max-height: 70vh;
  min-height: 0;
  overflow-y: auto;
  padding: 2rem 2rem 1.5rem 2rem;
  width: 100%;
}
.card-left {
  display: flex;
  flex: 2 1 0;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
}
.card-right {
  align-items: flex-start;
  display: flex;
  flex: 0 0 220px;
  flex-direction: column;
  gap: 1.2rem;
  margin-left: auto;
  min-width: 180px;
}
.card-title-input:focus {
  background: #f4f5f7;
  border-radius: 6px;
}
.card-right {
  flex: 0 0 220px;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-left: auto;
  min-width: 180px;
}
.sidebar-btn {
  align-items: center;
  background: #f4f5f7;
  border: none;
  border-radius: 8px;
  color: #34495e;
  cursor: pointer;
  display: flex;
  font-size: 1rem;
  font-weight: 500;
  gap: 0.7em;
  justify-content: space-between;
  padding: 0.7em 1.2em;
  transition: background 0.2s, color 0.2s;
  width: 100%;
}
.sidebar-btn:hover {
  background: #e0e0e0;
  color: #41b883;
}
.floating-panel {
  animation: fadeIn 0.2s;
  background: var(--color-card);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(60,60,60,0.13);
  left: auto;
  max-width: 95vw;
  min-height: 60px;
  min-width: 320px;
  padding: 1.2rem 1.5rem 1.2rem 1.5rem;
  position: absolute;
  right: 60px;
  top: 110px;
  z-index: 10;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: none; }
}
.panel-header {
  align-items: center;
  display: flex;
  font-weight: 600;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.checklist-text-input {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 0.4rem 0.7rem;
  font-size: 1rem;
  background: #fff;
}
.add-checklist-form {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  background: var(--color-card);
}
.btn-checklist-add {
  background: #41b883;
  color: #fff;
  border-radius: 6px;
  border: none;
  padding: 0.4em 1.2em;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-checklist-add:hover {
  background: #34495e;
}
.section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--color-card);
}
.section-header {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
}
.section-title {
  color: #34495e;
  font-size: 1.1rem;
  font-weight: 600;
}
.icon-btn {
  background: none;
  border: none;
  border-radius: 4px;
  color: #888;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.2em 0.5em;
  transition: background 0.2s, color 0.2s;
}
.icon-btn:hover {
  background: #f4f5f7;
  color: #41b883;
}
.desc-block {
  background: var(--color-card) !important;
  border-radius: 6px;
  cursor: pointer;
  min-height: 2.5em;
  padding: 0.7em 1em;
  transition: background 0.2s;
}
.desc-block:hover {
  background: #e0e0e0;
}
.desc-placeholder {
  color: #bbb;
}
.desc-textarea {
  background: var(--color-card) !important;
  border: 1px solid var(--color-secondary);
  border-radius: 6px;
  font-size: 1rem;
  padding: 0.7em 1em;
  width: 100%;
}
.labels-list {
  margin-bottom: 0.5rem;
  background: var(--color-card);
}
.label-edit-row {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  background: var(--color-card);
}
.label-chip {
  align-items: center;
  background: var(--color-secondary);
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(60,60,60,0.07);
  display: flex;
  font-size: 0.95em;
  margin-right: 0.2em;
  min-width: 48px;
  padding: 0.1em 0.7em 0.1em 0.4em;
}
.label-chip[data-v-dac8b5ca] {
  background: var(--color-secondary);
  color: #fff !important;
}
.label-chip-dot {
  background: inherit;
  border: 1.5px solid #fff3;
  border-radius: 50%;
  height: 12px;
  margin-right: 0.5em;
  width: 12px;
}
.label-chip-name {
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.12);
}
.label-color-input {
  background: none;
  border: none;
  height: 32px;
  padding: 0;
  width: 32px;
}
.label-remove {
  background: #e74c3c;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font-size: 1.2rem;
  min-width: 32px;
  min-height: 32px;
  width: 32px;
  height: 32px;
  padding: 0;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.label-remove:hover {
  background: #c0392b;
}
.label-add {
  background: #61bd4f;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 0.5rem;
  padding: 0.4em 1.2em;
  transition: background 0.2s;
}
.label-add:hover {
  background: #4ba63e;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding: 0 2rem 2rem 2rem;
}
.btn {
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.6rem 1.5rem;
  transition: background 0.2s, color 0.2s;
}
.btn-primary {
  color: #fff;
}
.btn-primary:hover {
  background: #34495e;
}
.btn-secondary {
  background: var(--color-secondary);
}
.btn-secondary:hover {
  background: #bdbdbd;
}
.progress-bar {
  background: #e0e0e0;
  border-radius: 4px;
  height: 8px;
  overflow: hidden;
  width: 100%;
}
.progress-bar-inner {
  background: #41b883;
  border-radius: 4px;
  height: 100%;
  transition: width 0.2s;
}
.main-checklist-list {
  display: flex;
  flex-direction: column;
  gap: 0.3em;
  list-style: none;
  margin: 0.7em 0 0 0;
  padding: 0;
  background: var(--color-card);
}
.main-checklist-item {
  align-items: center;
  color: #34495e;
  display: flex;
  font-size: 1rem;
  gap: 0.7em;
  background: var(--color-card);
}
.main-checklist-item .checked {
  color: #bbb;
  text-decoration: line-through;
}
.main-add-checklist-form {
  margin-top: 0.5em;
}
.members-panel-list {
  display: flex;
  flex-direction: column;
  gap: 0.7em;
}
.members-panel-row {
  align-items: center;
  display: flex;
  gap: 0.7em;
  padding: 0.3em 0;
}
.member-name {
  color: #34495e;
  flex: 1;
  font-size: 1rem;
}
.btn-member-add {
  background: #41b883;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  padding: 0.3em 0.9em;
  transition: background 0.2s;
}
.btn-member-add:hover {
  background: #34495e;
}
.btn-member-remove {
  background: #e74c3c;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  padding: 0.3em 0.9em;
  transition: background 0.2s;
}
.btn-member-remove:hover {
  background: #c0392b;
}
.dark-theme .card-details-new-modal-header, .dark-theme .card-details-new-modal-header * {
  color: var(--color-text) !important;
}
input,
textarea,
button,
select,
.card-details-new-title-input,
.desc-textarea,
.desc-block {
  color: var(--color-text) !important;
  background: var(--color-card) !important;
  border: 1px solid var(--color-secondary);
}
.dark-theme .modal, .dark-theme .modal * {
  color: var(--color-text) !important;
}
.dark-theme .card-details-card-modal-layout, .dark-theme .card-details-card-modal-layout * {
  color: var(--color-text) !important;
}
</style> 