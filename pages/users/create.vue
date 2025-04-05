<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

definePageMeta({
  title: 'users.add_user',
  middleware: 'auth'
});
</script>

<template>
  <AppsUsersUserForm />
</template> 