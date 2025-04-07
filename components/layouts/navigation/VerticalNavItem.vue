<template>
  <v-list-item
    :to="item.to"
    :active="active"
    class="nav-item my-1 rounded-lg mx-2"
    v-bind="$attrs"
    link
  >
    <template v-slot:prepend>
      <v-icon :icon="item.icon" :class="{'active-icon': active}"></v-icon>
    </template>
    <v-list-item-title class="nav-item-title">{{ item.title }}</v-list-item-title>
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
.nav-item {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &.active {
    background-color: rgba(var(--v-theme-primary), 0.15);
    color: rgb(var(--v-theme-primary));
    font-weight: 500;
    box-shadow: 0 2px 5px rgba(var(--v-theme-primary), 0.2);
    
    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 4px;
      background-color: rgb(var(--v-theme-primary));
    }
  }
  
  &:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.08);
    transform: translateX(2px);
  }
  
  .nav-item-title {
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .active-icon {
    color: rgb(var(--v-theme-primary));
  }
}
</style> 