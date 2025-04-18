<template>
    <div class="h-screen">
      <Splitpanes class="default-theme">
        <!-- Fixed avatar pane -->
      <Pane :size="25" :min-size="25" :max-size="50" class="flex items-center justify-center bg-gray-100">
        <AvatarPlaceHolder />
      </Pane>

      <!-- Scrollable text pane -->
      <Pane class="overflow-auto p-4 bg-white">
        <div class="space-y-4">
          <ChatInterface :conversation-id="conversationId" />
        </div>
      </Pane>
      </Splitpanes>
    </div>

</template>

<script setup>
import { computed } from 'vue';
import AvatarPlaceHolder from '~/components/chat/Avatar.vue';
import ChatInterface from '~/components/chat/ChatInterface.vue';
import { useRoute } from 'vue-router';
import { useGlobal } from '~/stores/global';
import 'splitpanes/dist/splitpanes.css'
import { Splitpanes, Pane } from 'splitpanes'

const globalStore = useGlobal();
const route = useRoute();
const conversationId = computed(() => route.params.id);

definePageMeta({
  layout: 'default',
});

useHead({ title: 'Strategy Details' });
</script>
