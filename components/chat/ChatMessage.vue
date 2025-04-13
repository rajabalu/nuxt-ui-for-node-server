<template>
  <div :class="['message-container', { 'user-message': isUser }]">
    <div class="message-wrapper">
      <!-- Avatar for system messages -->
      <div v-if="!isUser" class="message-avatar">
        <v-avatar size="40" color="#6366F1">
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
            <div v-if="isUser">{{ content }}</div>
            <div v-else class="markdown-content" v-html="parsedContent"></div>
            
            <!-- File attachment if exists -->
            <div v-if="file" class="file-attachment mt-2">
              <v-btn
                variant="outlined"
                size="small"
                :color="isUser ? 'white' : 'primary'"
                class="file-button"
                prepend-icon="mdi-file-document-outline"
                @click="openFile"
              >
                {{ file.name }}
              </v-btn>
              <div class="text-caption mt-1" :class="{'text-white': isUser}">
                {{ formatFileSize(file.size) }}
              </div>
            </div>
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
import { marked } from 'marked';
import { useSanitization } from '~/composables/chat/useSanitization';

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
  smartypants: true,
  // Security: disable dangerous features
  sanitize: false, // We'll handle sanitization with DOMPurify
});

// Get sanitization utility
const { sanitizeForDisplay } = useSanitization();

// Props
const props = defineProps({
  isUser: {
    type: Boolean,
    default: false
  },
  content: {
    type: String,
    default: ''
  },
  timestamp: {
    type: [Date, String],
    default: () => new Date()
  },
  status: {
    type: String,
    default: 'sent'
  },
  file: {
    type: Object,
    default: null
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

const parsedContent = computed(() => {
  if (!props.isUser) {
    const rawHtml = marked.parse(props.content || '');
    return sanitizeForDisplay(rawHtml);
  }
  return sanitizeForDisplay(props.content);
});

// Methods
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

const openFile = () => {
  if (props.file?.url) {
    window.open(props.file.url, '_blank', 'noopener,noreferrer');
  }
};
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
  background-color: #6366F1 !important;
  color: white;
}

.system-card {
  background-color: #F5F5F5;
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

// Markdown styling
.markdown-content {
  ::v-deep() {
    line-height: 1.6;
    
    h1, h2, h3, h4, h5, h6 {
      font-size: 1.1em;
      margin: 0.5em 0;
      font-weight: 600;
    }

    code {
      background-color: rgba(0,0,0,0.1);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: monospace;
    }

    pre {
      background-color: rgba(0,0,0,0.1);
      padding: 0.8em;
      border-radius: 4px;
      overflow-x: auto;
      
      code {
        background: none;
        padding: 0;
      }
    }

    a {
      color: inherit;
      text-decoration: underline;
      &:hover {
        opacity: 0.8;
      }
      &[href^="http"] {
        &::after {
          content: "↗";
          margin-left: 0.25em;
          font-size: 0.8em;
        }
      }
    }

    ul, ol {
      padding-left: 1.2em;
      margin: 0.5em 0;
    }

    blockquote {
      border-left: 3px solid rgba(0,0,0,0.1);
      margin: 0.5em 0;
      padding-left: 1em;
      color: rgba(0,0,0,0.7);
    }
  }
}

// Dark theme adjustments
.v-theme--dark {
  .system-card {
    background-color: #424242;
    color: white;
  }
  
  .message-time {
    color: rgba(255, 255, 255, 0.6);
  }

  .markdown-content ::v-deep() {
    code, pre {
      background-color: rgba(255,255,255,0.1);
    }
    
    blockquote {
      border-color: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.7);
    }
  }
}

.file-attachment {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.file-button {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>