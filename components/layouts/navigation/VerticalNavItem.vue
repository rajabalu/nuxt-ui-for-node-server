<template>
  <v-list-item
    :to="isEditing ? null : item.to"
    :active="active"
    class="nav-item my-1 rounded-lg mx-2"
    v-bind="$attrs"
    link
    @click="!isEditing && $emit('click', $event)"
  >
    <template v-slot:prepend>
      <v-icon :icon="item.icon" :class="{'active-icon': active}"></v-icon>
    </template>
    
    <v-list-item-title v-if="!isEditing" class="nav-item-title">{{ item.title }}</v-list-item-title>
    
    <div v-else class="d-flex align-center edit-container">
      <v-text-field
        v-model="editedTitle"
        variant="outlined"
        density="compact"
        hide-details
        autofocus
        class="edit-field"
        @keyup.enter="saveTitle"
        ref="titleInput"
      ></v-text-field>
      <v-btn
        icon
        size="small"
        color="success"
        class="ms-1"
        @click="saveTitle"
        title="Save"
      >
        <v-icon icon="tabler-check" size="small"></v-icon>
      </v-btn>
      <v-btn
        icon
        size="small"
        color="error"
        class="ms-1"
        @click="cancelEdit"
        title="Cancel"
      >
        <v-icon icon="tabler-x" size="small"></v-icon>
      </v-btn>
    </div>
    
    <template v-slot:append>
      <v-menu
        v-if="showMenuButton && !isEditing"
        location="bottom end"
        :close-on-content-click="true"
        transition="slide-y-transition"
      >
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            density="comfortable"
            icon
            size="small"
            variant="text"
            color="medium-emphasis"
            @click.stop.prevent
            class="menu-btn"
          >
            <v-icon icon="tabler-dots-vertical" size="small"></v-icon>
          </v-btn>
        </template>
        <v-list density="compact" class="py-0" min-width="120">
          <v-list-item
            density="compact"
            @click.stop.prevent="startEditing"
          >
            <template v-slot:prepend>
              <v-icon icon="tabler-edit" size="small" color="primary"></v-icon>
            </template>
            <v-list-item-title>Rename</v-list-item-title>
          </v-list-item>
          
          <v-list-item
            density="compact"
            color="error"
            @click.stop.prevent="$emit('deleteItem', item)"
          >
            <template v-slot:prepend>
              <v-icon icon="tabler-trash" size="small" color="error"></v-icon>
            </template>
            <v-list-item-title>Delete</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-list-item>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: Boolean,
    default: false
  },
  showMenuButton: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'deleteItem', 'renameItem', 'click']);

const isEditing = ref(false);
const editedTitle = ref('');
const titleInput = ref(null);

const startEditing = () => {
  editedTitle.value = props.item.title;
  isEditing.value = true;
  // Focus the input after it's rendered
  setTimeout(() => {
    titleInput.value?.focus();
  }, 50);
};

const saveTitle = () => {
  if (editedTitle.value.trim()) {
    emit('renameItem', { 
      id: props.item.id, 
      title: editedTitle.value.trim() 
    });
    isEditing.value = false;
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  editedTitle.value = props.item.title;
};
</script>

<style lang="scss" scoped>
.nav-item {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &.active {
    background-color: rgba(var(--v-theme-primary), 0.15);
    color: rgb(var(--v-theme-primary));
    font-weight: 500;
    box-shadow: 0 2px 5px rgba(var(--v-theme-primary), 0.2);
    
    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 4px;
      background-color: rgb(var(--v-theme-primary));
    }
  }
  
  &:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.08);
    transform: translateX(2px);
    
    .menu-btn {
      opacity: 1;
    }
  }
  
  .nav-item-title {
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .active-icon {
    color: rgb(var(--v-theme-primary));
  }
  
  .menu-btn {
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .edit-container {
    width: 100%;
    .edit-field {
      max-width: calc(100% - 70px);
    }
  }
}
</style> 