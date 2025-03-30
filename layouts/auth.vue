<template>
  <v-app>
    <v-main>
      <v-container fluid class="fill-height pa-0">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
// Ensure the user is redirected to the login page if unauthenticated
// No need for auth middleware here as it's handled by individual pages
</script> 