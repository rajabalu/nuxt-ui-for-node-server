<template>
  <!-- Force this to be rendered in the document body -->
  <Teleport to="body">
    <div id="notification-system-container" class="notification-system-container">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="notification-system-item"
        :class="typeToColor[notification.type] || 'bg-primary'"
      >
        <div class="notification-system-content">
          <v-icon :icon="typeToIcon[notification.type] || notification.icon" class="notification-system-icon"></v-icon>
          <div class="notification-system-text">
            <div v-if="notification.title" class="notification-system-title">{{ notification.title }}</div>
            <div class="notification-system-message">{{ notification.message }}</div>
          </div>
          <v-btn
            variant="text"
            density="compact"
            icon="tabler-x"
            size="small"
            @click="remove(notification.id)"
            class="notification-system-close"
          ></v-btn>
        </div>
      </div>
      
      <!-- Debug element to show notification count -->
      <div v-if="showDebug" class="notification-debug">
        <div>Notification Count: {{ notifications.length }}</div>
        <div v-for="notification in notifications" :key="notification.id">
          ID: {{ notification.id }} - {{ notification.message }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useNotification } from '@/composables/useNotification';
import { watch, onMounted, ref } from 'vue';

// Create component identifier for debugging
const componentId = Date.now();
console.log(`NotificationSystem component created: ${componentId}`);

// Get the shared notification state
const { notifications, remove, test } = useNotification();

// Only show debug panel in development mode
const showDebug = ref(process.env.NODE_ENV === 'development');

// Debug notification system
onMounted(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [Component ${componentId}] NotificationSystem mounted, notifications:`, notifications.value);
    console.log(`📍 [Component ${componentId}] Container element:`, document.getElementById('notification-system-container'));
  }
});

// Watch for changes to notifications array
watch(notifications, (newVal) => {
  console.log(`📊 [Component ${componentId}] Notifications updated, length:`, newVal.length);
  for (const notification of newVal) {
    console.log(`  - [Component ${componentId}] Notification:`, notification.id, notification.type, notification.message);
  }
  
  setTimeout(() => {
    console.log(`📍 [Component ${componentId}] Container after update:`, document.getElementById('notification-system-container'));
    console.log(`📍 [Component ${componentId}] Notification count in DOM:`, document.querySelectorAll('.notification-system-item').length);
  }, 0);
}, { deep: true });

// Map notification types to Vuetify colors
const typeToColor = {
  success: 'bg-success',
  error: 'bg-error',
  info: 'bg-info',
  warning: 'bg-warning'
};

// Map notification types to icons
const typeToIcon = {
  success: 'tabler-check-circle',
  error: 'tabler-alert-circle',
  info: 'tabler-info-circle',
  warning: 'tabler-alert-triangle'
};
</script>

<style>
.notification-system-container {
  position: fixed !important;
  top: 16px !important;
  right: 16px !important;
  z-index: 999999 !important; /* Extremely high z-index */
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  width: 400px !important;
  max-width: 90vw !important;
  pointer-events: auto !important;
}

/* Added !important to all styles to ensure they override Vuetify */
.notification-system-item {
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  overflow: hidden !important;
  margin-bottom: 8px !important;
  transform: none !important;
  transition: none !important;
  position: relative !important;
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.notification-system-content {
  display: flex !important;
  align-items: flex-start !important;
  padding: 16px !important;
  color: white !important;
}

.notification-system-icon {
  margin-right: 12px !important;
  flex-shrink: 0 !important;
}

.notification-system-text {
  flex-grow: 1 !important;
}

.notification-system-title {
  font-weight: bold !important;
  margin-bottom: 4px !important;
}

.notification-system-message {
  font-size: 0.95rem !important;
}

.notification-system-close {
  flex-shrink: 0 !important;
  margin-left: 8px !important;
  color: white !important;
}

/* Debug panel */
.notification-debug {
  background-color: rgba(0, 0, 0, 0.8) !important;
  color: white !important;
  padding: 8px !important;
  border-radius: 4px !important;
  margin-top: 20px !important;
  font-family: monospace !important;
  font-size: 12px !important;
  width: 100% !important;
  position: relative !important;
  z-index: 9999999 !important; /* Even higher z-index */
}
</style> 