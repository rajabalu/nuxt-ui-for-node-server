<!-- index.vue -->
<template>
 <AzureTalkingHead  />
</template>

<script setup>
import AzureTalkingHead  from '~/components/chat/AzureTalkingHead.vue';

definePageMeta({
  layout: 'default',
});

useHead({ title: 'Welcome!' });
</script>

<style lang="scss" scoped>

// Smooth scroll behavior
html {
  scroll-behavior: smooth;
}
</style>