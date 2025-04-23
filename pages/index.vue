<!-- index.vue -->
<template>
  <div class="page-root">
    <Splitpanes horizontal class="splitpanes-root">
      <!-- Fixed avatar pane -->
      <Pane min-size="80" size="80">
        <AzureTalkingHead />
      </Pane>
      <!-- Scrollable text pane -->
      <Pane min-size="20" size="20">
        <div class="hello-pane">
          <p>Hello world</p>
        </div>
      </Pane>
    </Splitpanes>
  </div>
</template>

<style scoped>
.page-root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
}
.splitpanes-root {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.hello-pane {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>

<script setup>
import AzureTalkingHead  from '~/components/chat/AzureTalkingHead.vue';
import ChatMessage from '~/components/chat/ChatMessage.vue';
import 'splitpanes/dist/splitpanes.css'
import { Splitpanes, Pane } from 'splitpanes'


definePageMeta({
  layout: 'default',
});

useHead({ title: 'Welcome!' });
</script>
