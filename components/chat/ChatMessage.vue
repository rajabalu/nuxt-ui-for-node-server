<template>
    <div :class="['message-container', { 'user-message': isUser }]">
      <div class="message-wrapper">
        <!-- Avatar for system messages -->
        <div v-if="!isUser" class="message-avatar">
          <v-avatar color="primary" size="40">
            <v-icon color="white">mdi-robot</v-icon>
          </v-avatar>
        </div>
        
        <!-- Message bubble -->
        <div class="message-content">
          <v-card
            :color="isUser ? 'primary' : ''"
            :class="['message-card', { 'user-card': isUser }]"
          >
            <v-card-text :class="{'text-white': isUser}">
              {{ content }}
            </v-card-text>
          </v-card>
          
          <!-- Timestamp -->
          <div class="message-meta">
            <span class="message-time">{{ formattedTime }}</span>
            <span v-if="isUser" class="message-status ml-2">
              <v-icon x-small :color="statusColor">{{ statusIcon }}</v-icon>
            </span>
          </div>
        </div>
        
        <!-- Avatar for user messages (empty space for alignment) -->
        <div v-if="isUser" class="message-avatar user-avatar"></div>
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
  
  const statusIcon = computed(() => {
    switch(props.status) {
      case 'sent': return 'mdi-check';
      case 'delivered': return 'mdi-check-all';
      case 'read': return 'mdi-check-all';
      default: return 'mdi-clock-outline';
    }
  });
  
  const statusColor = computed(() => {
    switch(props.status) {
      case 'read': return 'light-blue';
      case 'delivered': return 'grey';
      default: return 'grey';
    }
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
  
  .user-avatar {
    margin-right: 0;
    margin-left: 12px;
  }
  
  .message-content {
    display: flex;
    flex-direction: column;
    max-width: calc(100% - 64px);
  }
  
  .message-card {
    border-radius: 18px;
    border-top-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow: hidden;
    max-width: 100%;
  }
  
  .user-card {
    border-radius: 18px;
    border-top-right-radius: 4px;
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
  
  .dark-theme {
    .message-card:not(.user-card) {
      background-color: rgba(var(--v-theme-surface-variant), 0.8);
    }
  }
  </style>