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
          <ChatInput />
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
  align-items: stretch;
  justify-content: stretch;
  height: 100%;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}
.hello-pane > * {
  flex: 1 1 auto;
  height: 100%;
  width: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
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
import ChatInput from '~/components/chat/ChatInput.vue';
import 'splitpanes/dist/splitpanes.css'
import { Splitpanes, Pane } from 'splitpanes'


definePageMeta({
  layout: 'default',
});

useHead({ title: 'Welcome!' });
</script>
