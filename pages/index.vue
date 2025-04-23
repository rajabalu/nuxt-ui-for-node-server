<!-- index.vue -->
<template>
  <div class="home-container">
    <Splitpanes horizontal class="splitpanes-container">
      <!-- Avatar pane - smaller on mobile -->
      <Pane :min-size="80" :size="80">
        <AzureTalkingHead />
      </Pane>
      <!-- Scrollable text pane - larger on mobile -->
      <Pane :min-size="20" :size="20">
        <ChatInput />
      </Pane>
    </Splitpanes>
  </div>
</template>

<script setup>
import AzureTalkingHead from '~/components/chat/AzureTalkingHead.vue';
import ChatInput from '~/components/chat/ChatInput.vue';
import 'splitpanes/dist/splitpanes.css'
import { Splitpanes, Pane } from 'splitpanes'
import { useDisplay } from 'vuetify';
import { computed } from 'vue';

const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);

definePageMeta({
  layout: 'default',
});

useHead({ title: 'Welcome!' });
</script>

<style>
.home-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.splitpanes-container {
  height: 100%;
}

/* Ensure talking head responsive viewer fits properly */
:deep(.viewer-container) {
  height: 100% !important;
}

/* Mobile optimizations */
@media (max-width: 600px) {
  :deep(.splitpanes__pane) {
    transition: height 0.3s ease;
  }
  
  :deep(.splitpanes__splitter) {
    height: 6px !important;
    background-color: rgba(var(--v-theme-on-surface), 0.1);
  }
}
</style>
