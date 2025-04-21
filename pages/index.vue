<!-- index.vue -->
<template>
 <AvatarPlaceholder />
</template>

<script setup>
import AvatarPlaceholder from '~/components/chat/Avatar.vue';

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