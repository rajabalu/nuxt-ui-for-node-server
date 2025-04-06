<template>
  <div :class="['message-container', { 'user-message': isUser }]">
    <div class="message-wrapper">
      <!-- Avatar for system messages -->
      <div v-if="!isUser" class="message-avatar">
        <v-avatar color="#6366F1" size="40">
          <v-icon color="white">mdi-robot</v-icon>
        </v-avatar>
      </div>
      
      <!-- Message bubble -->
      <div class="message-content">
        <v-card
          :color="isUser ? 'primary' : ''"
          :class="['message-card', { 'user-card': isUser, 'system-card': !isUser }]"
        >
          <v-card-text :class="{'text-white': isUser}">
            {{ content }}
          </v-card-text>
        </v-card>
        
        <!-- Timestamp -->
        <div class="message-meta">
          <span class="message-time">{{ formattedTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
  isUser: {
    type: Boolean,
    default: false
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: () => new Date()
  },
  status: {
    type: String,
    default: 'sent' // sent, delivered, read
  }
});

// Computed properties
const formattedTime = computed(() => {
  const date = new Date(props.timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
});
</script>

<style lang="scss" scoped>
.message-container {
  margin-bottom: 16px;
  max-width: 100%;
  animation: fade-in 0.3s ease-in-out;
}

.message-wrapper {
  display: flex;
  max-width: 100%;
}

.message-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  margin-right: 12px;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: calc(100% - 64px);
}

.message-card {
  border-radius: 18px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  overflow: hidden;
  max-width: 100%;
}

.user-card {
  background-color: #6366F1 !important; // Purple for user messages
  color: white;
}

.system-card {
  background-color: #F5F5F5; // Light gray for system messages
  color: #212121;
}

.message-meta {
  display: flex;
  align-items: center;
  margin-top: 4px;
  padding: 0 8px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.user-message {
  .message-wrapper {
    flex-direction: row-reverse;
  }
  
  .message-content {
    align-items: flex-end;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// For dark theme
.v-theme--dark {
  .system-card {
    background-color: #424242;
    color: white;
  }
  
  .message-time {
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>