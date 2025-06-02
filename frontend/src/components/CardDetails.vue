<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal card-modal-layout">
      <!-- Header: Title, Labels, Due Date, Members, Close -->
      <header class="modal-header new-modal-header">
        <div class="modal-header-left">
          <input v-model="card.title" class="card-title-input new-title-input" placeholder="Card title" />
          <div v-if="card.labels && card.labels.length" class="header-labels-under-title new-labels-row">
            <span v-for="(label, i) in card.labels" :key="i" class="label-chip" :style="{ backgroundColor: label.color }">
              <span class="label-chip-dot" :style="{ backgroundColor: label.color }"></span>
              <span class="label-chip-name">{{ label.name }}</span>
            </span>
          </div>
        </div>
        <div class="modal-header-right">
          <div v-if="card.dueDate" class="header-due-date new-due-date">
            <button class="due-date-badge" @click="rightPanel = 'dueDate'">{{ formatDate(card.dueDate) }}</button>
          </div>
          <div class="header-members new-header-members">
            <span v-for="member in card.members" :key="member._id" class="member-avatar" :title="member.username">
              {{ member.username.charAt(0).toUpperCase() }}
            </span>
          </div>
        </div>
        <button class="modal-close new-modal-close" @click="$emit('close')">&times;</button>
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
import { ref, watch, onMounted, computed } from 'vue';
import api from '@/api';
import './CardDetails.css';
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

const updateChecklistItem = async (checklistId, item) => {
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
.card-header-flex {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-card) !important;
  color: var(--color-text) !important;
  padding: 0.7rem 2rem 0.6rem 1.5rem;
  border-bottom: 1px solid var(--color-secondary);
  flex-shrink: 0;
  position: relative;
  min-height: 72px;
}
.header-title-group,
.title-input-wrapper,
.header-labels-under-title,
.header-due-members,
.header-due-date,
.header-members,
.card-body-split,
.card-left,
.card-right,
.section,
.section-header,
.section-title,
.icon-btn,
.labels-list,
.label-edit-row,
.label-chip-dot,
.label-color-input,
.label-remove,
.label-add,
.labels-preview,
.modal-actions,
.checklist-progress-summary,
.progress-bar,
.progress-bar-inner,
.main-checklist-list,
.main-checklist-item,
.main-add-checklist-form,
.members-panel-list,
.members-panel-row,
.member-name,
.btn-member-add,
.btn-member-remove {
  color: var(--color-text) !important;
  background: var(--color-card) !important;
  border-color: var(--color-secondary) !important;
}
.section-title {
  font-weight: 600;
}
.label-chip {
  color: #fff !important;
}
.progress-bar {
  background: #e0e0e0;
  border-radius: 4px;
  height: 8px;
  overflow: hidden;
  width: 100%;
  border: 1px solid #222; /* default for light theme */
}
.dark-theme .progress-bar {
  border: 1px solid #fff;
}
.progress-bar-inner {
  background: var(--color-primary) !important;
}
.label-name-input {
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
.label-name-input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 2px 8px rgba(65,184,131,0.10);
}
.label-remove, .btn-member-remove {
  background: #e74c3c !important;
  color: #fff !important;
  border: none;
  border-radius: 6px;
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
.label-remove:hover, .btn-member-remove:hover {
  background: #c0392b !important;
}
</style> 