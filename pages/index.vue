<script setup>
const route = useRoute();

const layoutClassic = route.path.includes("horizontal");

// Add authentication middleware to protect this page
definePageMeta({
  middleware: ['auth']
});
</script>
<template>
  <div class="project-dashboard ma-n1">
    <div :class="`project-dashboard__background-${layoutClassic ? 'horizontal' : 'classic'}`" />
  </div>

  <v-container fluid>
    <GlobalsHeader title="Projects" is-btn btn-color="light" btn-text="Create New Project" />
  </v-container>
</template>

<style scoped lang="scss">
.project-dashboard-background {
  background: rgba(var(--v-theme-primary));
  padding-bottom: 8.5rem;
  padding-top: 3rem;
  position: absolute;
  top: 0;
}

.project-dashboard {
  position: relative;
  &__background-classic {
    @extend .project-dashboard-background;
    width: 100%;
    left: 0px;
  }

  &__background-horizontal {
    @extend .project-dashboard-background;
    width: 200%;
    transform: translate(-20%);
  }
}
</style>
