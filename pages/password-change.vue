<script setup>
import { useRoute, useRouter } from 'vue-router';
import PasswordReset from "@/components/layouts-pages/authentications/PasswordReset.vue";

const route = useRoute();
const router = useRouter();

// Extract the hash from the URL
const hash = ref(route.query.hash || '');
const expires = ref(route.query.expires || '');

definePageMeta({
  layout: "blank",
  middleware: ['guest']
});

useSeoMeta({
  title: "Reset Password",
  ogTitle: "Reset Password",
  description: "Reset your account password",
  ogDescription: "Reset your account password",
  ogImage: "",
  twitterCard: "summary_large_image",
});

// Store the hash in sessionStorage to hide it from URL
onMounted(() => {
  if (hash.value) {
    // Store hash in session storage
    sessionStorage.setItem('password_reset_hash', hash.value);
    sessionStorage.setItem('password_reset_expires', expires.value);
    
    // Redirect to clean URL
    router.replace({ path: '/password-change' });
  } else {
    // Check if hash exists in session storage
    const storedHash = sessionStorage.getItem('password_reset_hash');
    const storedExpires = sessionStorage.getItem('password_reset_expires');
    
    if (!storedHash) {
      // No hash found, redirect to forget-password
      router.replace({ path: '/forget-password' });
    } else {
      // Check if expired
      if (storedExpires && parseInt(storedExpires) < Date.now()) {
        // Expired token
        sessionStorage.removeItem('password_reset_hash');
        sessionStorage.removeItem('password_reset_expires');
        router.replace({ 
          path: '/forget-password',
          query: { expired: 'true' }
        });
      } else {
        // Set the hash from session storage
        hash.value = storedHash;
      }
    }
  }
});
</script>

<template>
  <v-container fluid class="h-100">
    <v-row justify="center" align="center" class="h-100">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <PasswordReset :hash="hash" />
      </v-col>
    </v-row>
  </v-container>
</template> 