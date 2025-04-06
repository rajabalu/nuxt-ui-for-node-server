<script setup>
defineProps({
  menuType: {
    type: String,
    default: "vertical",
  },
});

const Conversations = [
{
    title: "Conversations",
    to: "conversations",
    icon: "tabler-message",
  }
];
</script>
<template>
  <template v-if="menuType === 'vertical'">
    <v-list-group value="conversation" color="primary">
      <template #activator="{ props }">
        <v-list-item v-bind="props" title="Conversations" class="vertical-nav-list__item py-2">
          <template #prepend>
            <v-icon icon="tabler-message" color="primary" bold />
          </template>
        </v-list-item>
      </template>

      <v-list-item
        v-for="item in Conversations"
        :key="item.to"
        class="vertical-nav-list__group"
        :title="item.title"
        :to="`/${item.to}`"
      />
    </v-list-group>
  </template>
</template>
