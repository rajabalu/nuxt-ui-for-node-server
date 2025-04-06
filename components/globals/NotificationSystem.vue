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
    </div>
  </Teleport>
</template>

<script setup>
import { useNotification } from '@/composables/useNotification';

// Get the shared notification state
const { notifications, remove } = useNotification();

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
  z-index: 999999 !important; 
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  width: 400px !important;
  max-width: 90vw !important;
  pointer-events: auto !important;
}

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
</style> 