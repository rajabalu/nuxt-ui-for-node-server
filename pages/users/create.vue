<script setup>
import { useI18n } from 'vue-i18n';
import UserForm from '@/components/apps/users/UserForm.vue';

const { t } = useI18n();

definePageMeta({
  title: 'users.add_user',
  middleware: 'auth'
});
</script>

<template>
  <UserForm />
</template> 