<template>
    <div>
      <div v-if="loading" class="d-flex justify-center align-center pa-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <span class="ml-3">Loading strategy...</span>
      </div>
      
      <div v-else-if="error" class="d-flex flex-column align-center pa-4">
        <v-alert type="error" class="mb-4">
          {{ error }}
        </v-alert>
        <v-btn @click="fetchData" color="primary">Retry</v-btn>
      </div>
      
      <div v-else>
        <Splitpanes 
          class="strategy-container" 
          :horizontal="isMobile"
        >
          <Pane 
            :size="isMobile ? 40 : 25" 
            :min-size="isMobile ? 30 : 25" 
            :max-size="isMobile ? 60 : 50"
          >
            <div class="talking-head-wrapper">
              <AzureTalkingHead ref="talkingHeadRef" />
              <!-- Voice toggle button at the bottom right of the talking head -->
              <v-btn 
                class="voice-toggle-btn" 
                icon 
                variant="tonal" 
                size="small" 
                @click="toggleVoice"
                :color="voiceEnabled ? 'primary' : 'grey'"
              >
                <v-icon>{{ voiceEnabled ? 'mdi-volume-high' : 'mdi-volume-off' }}</v-icon>
              </v-btn>
            </div>
          </Pane>

          <Pane>
            <ChatInterface 
              :conversation-id="conversationId"
              @new-ai-message="handleNewAiMessage"
            />
          </Pane>
        </Splitpanes>
      </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import AzureTalkingHead from '~/components/chat/AzureTalkingHead.vue';
import ChatInterface from '~/components/chat/ChatInterface.vue';
import { useRoute } from 'vue-router';
import 'splitpanes/dist/splitpanes.css';
import { Splitpanes, Pane } from 'splitpanes';
import { useChatStore } from '~/stores/chat';

const route = useRoute();
const chatStore = useChatStore();
const conversationId = computed(() => route.params.id);
const loading = ref(true);
const error = ref(null);
const talkingHeadRef = ref(null);
const voiceEnabled = ref(true);
const strategyTitle = ref('Strategy Details');

// Computed properties for layout - always use automatic responsive mode
const isMobile = ref(false);

// Check if viewport is mobile
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

// Toggle voice functionality
const toggleVoice = () => {
  voiceEnabled.value = !voiceEnabled.value;
};

// Handle new AI messages from chat interface
const handleNewAiMessage = (message) => {
  if (voiceEnabled.value && talkingHeadRef.value && message?.content) {
    // Strip any markdown formatting for cleaner speech
    let cleanText = message.content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace markdown links with just the text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
      .replace(/#+\s+(.*)/g, '$1') // Remove heading formatting
      .replace(/\n\n+/g, '\n'); // Reduce multiple newlines
      
    // Speak the clean text
    talkingHeadRef.value.handleSpeakRequest(cleanText);
  }
};

onMounted(() => {
  // Initial check and fetch
  checkMobile();
  fetchData();
  
  // Add resize listener for responsive layout
  window.addEventListener('resize', checkMobile);
});

// Clean up resize listener
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

// Fetch strategy data
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // First check if conversation exists in store
    const conversation = chatStore.conversations.find(c => c.id === conversationId.value);
    
    if (conversation) {
      // Use title from store if available
      strategyTitle.value = conversation.title || 'Strategy Details';
    } else {
      // Otherwise attempt to fetch from API
      try {
        const response = await fetch(`/api/conversations/${conversationId.value}`);
        if (response.ok) {
          const data = await response.json();
          if (data.title) {
            strategyTitle.value = data.title;
          }
        }
      } catch (apiErr) {
        console.warn('Could not fetch strategy title:', apiErr);
        // Non-critical error, continue with default title
      }
    }
    
    // Update page title with strategy name
    useHead({ title: strategyTitle.value });
    
    loading.value = false;
  } catch (err) {
    loading.value = false;
    error.value = 'Failed to load strategy details. Please try again.';
    console.error('Error fetching strategy:', err);
  }
};

// Watch for conversation title changes in store
watch(() => chatStore.conversations, (newConversations) => {
  const conversation = newConversations.find(c => c.id === conversationId.value);
  if (conversation?.title) {
    strategyTitle.value = conversation.title;
    useHead({ title: conversation.title });
  }
}, { deep: true });

definePageMeta({
  layout: 'default',
});

// Initial head setup
useHead({ title: 'Strategy Details' });
</script>

<style lang="scss" scoped>
.strategy-container {
  height: calc(100vh - 90px); /* Adjusted for header only */
}

.talking-head-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.voice-toggle-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 10;
  opacity: 0.8;
  
  &:hover {
    opacity: 1;
  }
}

/* Mobile optimization */
@media (max-width: 600px) {
  .voice-toggle-btn {
    bottom: 8px;
    right: 8px;
  }
}
</style>
