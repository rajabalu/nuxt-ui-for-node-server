<template>
  <v-list-item
    :to="item.to"
    :active="active"
    class="my-1 rounded-r-xl mx-1"
    v-bind="$attrs"
  >
    <template v-slot:prepend>
      <v-icon :icon="item.icon"></v-icon>
    </template>
    <v-list-item-title>{{ item.title }}</v-list-item-title>
    <v-list-item-subtitle>{{ item.subtitle }}</v-list-item-subtitle>
  </v-list-item>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: Boolean,
    default: false
  }
});

defineEmits(['update:modelValue']);
</script>

<style lang="scss" scoped>
.v-list-item {
  &.active {
    background-color: rgba(var(--v-theme-primary), 0.1);
    color: rgb(var(--v-theme-primary));
    font-weight: 500;
  }
  
  &:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.05);
  }
}
</style> 