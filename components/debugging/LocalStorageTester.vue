<template>
  <v-card class="pa-4">
    <v-card-title>LocalStorage Diagnostic Tool</v-card-title>
    <v-card-text>
      <v-alert v-if="error" type="error" class="mb-4">
        {{ error }}
      </v-alert>
      
      <div class="text-h6 mb-3">Current Storage Keys</div>
      
      <v-table v-if="storageItems.length > 0">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in storageItems" :key="item.key">
            <td>{{ item.key }}</td>
            <td>
              <div class="text-truncate" style="max-width: 300px;">{{ item.value }}</div>
            </td>
            <td>
              <v-btn
                size="small"
                color="error"
                variant="text"
                @click="removeItem(item.key)"
              >
                Remove
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
      
      <v-alert v-else type="info" class="my-4">
        No items found in localStorage
      </v-alert>
      
      <v-divider class="my-4"></v-divider>
      
      <div class="text-h6 mb-3">Add/Edit Item</div>
      
      <v-form @submit.prevent="saveItem">
        <v-row>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="newItem.key"
              label="Key"
              required
              :rules="[v => !!v || 'Key is required']"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="newItem.value"
              label="Value"
              required
              :rules="[v => !!v || 'Value is required']"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              type="submit"
              color="primary"
              block
              :disabled="!newItem.key || !newItem.value"
            >
              Save
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
      
      <v-divider class="my-4"></v-divider>
      
      <div class="d-flex gap-2">
        <v-btn color="warning" @click="clearAll">
          Clear All
        </v-btn>
        <v-btn @click="refreshStorage">
          Refresh
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// State
const error = ref(null);
const storageItems = ref([]);
const newItem = ref({
  key: '',
  value: ''
});

// Load storage items
const loadStorageItems = () => {
  try {
    error.value = null;
    storageItems.value = [];
    
    if (process.client) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        storageItems.value.push({ key, value });
      }
    }
  } catch (e) {
    error.value = `Error loading storage items: ${e.message}`;
    console.error('Error loading storage items:', e);
  }
};

// Save item to localStorage
const saveItem = () => {
  try {
    if (!newItem.value.key || !newItem.value.value) {
      return;
    }
    
    localStorage.setItem(newItem.value.key, newItem.value.value);
    newItem.value = { key: '', value: '' };
    loadStorageItems();
  } catch (e) {
    error.value = `Error saving item: ${e.message}`;
    console.error('Error saving item:', e);
  }
};

// Remove item from localStorage
const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
    loadStorageItems();
  } catch (e) {
    error.value = `Error removing item: ${e.message}`;
    console.error('Error removing item:', e);
  }
};

// Clear all localStorage
const clearAll = () => {
  try {
    localStorage.clear();
    loadStorageItems();
  } catch (e) {
    error.value = `Error clearing storage: ${e.message}`;
    console.error('Error clearing storage:', e);
  }
};

// Refresh storage list
const refreshStorage = () => {
  loadStorageItems();
};

// Initialize on mount
onMounted(() => {
  loadStorageItems();
});
</script> 