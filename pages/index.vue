<!-- index.vue -->
<template>
    <Splitpanes horizontal>
      <!-- Fixed avatar pane -->
      <Pane min-size="80" size="80">
        <AzureTalkingHead />
      </Pane>
      <!-- Scrollable text pane -->
      <Pane min-size="20" size="20">
          <ChatInput />
      </Pane>
    </Splitpanes>
</template>

<script setup>
import AzureTalkingHead  from '~/components/chat/AzureTalkingHead.vue';
import ChatInput from '~/components/chat/ChatInput.vue';
import 'splitpanes/dist/splitpanes.css'
import { Splitpanes, Pane } from 'splitpanes'


definePageMeta({
  layout: 'default',
});

useHead({ title: 'Welcome!' });
</script>
