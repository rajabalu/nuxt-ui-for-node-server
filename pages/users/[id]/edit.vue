<script setup>
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import UserForm from '@/components/apps/users/UserForm.vue';

const route = useRoute();
const { t } = useI18n();
const userId = route.params.id;

definePageMeta({
  title: 'users.edit_user',
  middleware: 'auth'
});
</script>

<template>
  <UserForm :user-id="userId" />
</template> 