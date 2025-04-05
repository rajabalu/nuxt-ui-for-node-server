<script setup>
defineProps({
  menuType: {
    type: String,
    default: "vertical",
  },
});

const Admin = [
{
    title: "Users",
    to: "users",
    icon: "tabler-user",
  },
  {
    title: "Roles",
    to: "roles",
    icon: "tabler-user-circle",
  },
  {
    title: "Status",
    to: "status",
    icon: "tabler-shield",
  }
];
</script>
<template>
  <template v-if="menuType === 'vertical'">
    <v-list-group value="admin" color="primary">
      <template #activator="{ props }">
        <v-list-item v-bind="props" title="Admin" class="vertical-nav-list__item py-2">
          <template #prepend>
            <v-icon icon="tabler-home" />
          </template>
        </v-list-item>
      </template>

      <v-list-item
        v-for="item in Admin"
        :key="item.to"
        class="vertical-nav-list__group"
        :title="item.title"
        :to="`/${item.to}`"
      />
    </v-list-group>
  </template>
</template>
