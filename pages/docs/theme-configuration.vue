<script setup>
import { VueCodeHighlighter } from "vue-code-highlighter";

const contantList = [
  {
    name: "Colors & Themes",
    to: "intro",
  },
  {
    name: "Updating Colors",
    to: "updating-colors",
  },
  {
    name: "User Preferences",
    to: "user-preferences",
  },
];

useSeoMeta({
  title: "Theme Configuration",
  ogTitle: "Theme Configuration",
  description: "",
  ogDescription: "",
  ogImage: "",
  twitterCard: "summary_large_image",
});
</script>
<template>
  <v-container>
    <div class="mt-lg-6 pt-lg-6">
      <v-row>
        <v-col offset-lg="2" lg="6" md="12">
          <div class="mb-6">
            <div id="intro">
              <h1 class="text-h1">Colors & Themes</h1>
              <p class="intro-font my-3">
                Customize your application's default text colors, surfaces, and more. Easily modify
                your theme programmatically in real time. Vuetify comes with standard support for
                light and dark variants. For more detailed explnation read this
                <a
                  href="https://next.vuetifyjs.com/en/features/theme/"
                  target="_blank"
                  class="intro-font"
                  >documentation</a
                >
              </p>
            </div>

            <v-divider class="my-4" />

            <div id="updating-colors" class="py-6">
              <h2 class="text-h3">Updating colors</h2>

              <p class="intro-font my-3">
                Here, we will go over how you can customize the theme/colors in our template. <br />
                Theme's colors and modes are defined in
                <span class="text-grey-400">
                  /dashui-nuxt-starter-admin-template/plugins/vuetify/theme.js.
                </span>
              </p>

              <p class="intro-font my-3">
                To update primary colors to something else navigate to above mentioned vuetify
                plugin theme file and update primary to desired colors in themes you like.
              </p>

              <p class="intro-font">
                File:
                <span class="text-grey-400">
                  /dashui-nuxt-starter-admin-template/utils/theme.js</span
                >
              </p>

              <VueCodeHighlighter
                lang="js"
                :code="`const theme = {
  ...
  ...
  themes: {
    light: {
      colors: {
        dark: '#1e293b',
        light: '#f1f5f9',
        white: '#ffffff',
        primary: '#624bff',
        ...
        ...
      },
    },

    dark: {
      colors: {
        dark: '#f1f5f9',
        light: '#1e293b',
        white: '#ffffff',
        primary: '#624bff',
        ...
        ...
      }
    }
  }
}`"
                width="100%"
                height="100%"
                font-size="16px"
                theme="dark"
                class="my-4"
              />

              <v-alert color="success" variant="outlined" class="my-4">
                <p class="text-body-1 text-success">
                  <b>TIP</b>
                  <br />
                  If you want to override any style or want to add your custom scss code, you can
                  use _user.scss file located at below path.<br />
                  File : /src/@core/styles/_user.scss
                </p>
              </v-alert>
            </div>

            <v-divider class="my-4" />

            <div id="user-preferences" class="py-6">
              <h2 class="text-h3">User Preferences System</h2>

              <p class="intro-font my-3">
                We've implemented a unified user preferences system that handles both theme and language settings consistently.
                This ensures a smooth user experience with persistent preferences across sessions.
              </p>

              <p class="intro-font">Key components of this system include:</p>

              <ul class="intro-font my-3">
                <li class="my-2">
                  <b>Pinia Store</b>: The <code>userPreferences</code> store manages both theme and language preferences
                </li>
                <li class="my-2">
                  <b>App Initializer</b>: The client-side plugin loads preferences on startup
                </li>
                <li class="my-2">
                  <b>Theme Composable</b>: <code>useThemeConfig()</code> provides reactive theme access
                </li>
              </ul>

              <p class="intro-font my-3">
                To change the theme programmatically:
              </p>

              <VueCodeHighlighter
                lang="js"
                :code="`// Option 1: Using the theme composable
import { themeConfig } from '@/composables/theme';

const { themeChangeMode } = themeConfig();
themeChangeMode(); // Toggle between light/dark

// Option 2: Using the store directly
import { useUserPreferences } from '@/stores/userPreferences';

const userPreferencesStore = useUserPreferences();
userPreferencesStore.setTheme('dark'); // Set specific theme`"
                width="100%"
                height="100%"
                font-size="16px"
                theme="dark"
                class="my-4"
              />

              <v-alert color="info" variant="outlined" class="my-4">
                <p class="text-body-1 text-info">
                  <b>NOTE</b>
                  <br />
                  The preference system automatically handles persistence to localStorage and synchronizes with
                  the Vuetify theme system. It also coordinates with the i18n language settings for a consistent approach.
                </p>
              </v-alert>
            </div>
          </div>
        </v-col>
        <v-col lg="3" class="d-none d-lg-block">
          <GlobalsContentList :list="contantList" />
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<style scoped>
.intro-font {
  font-size: 16px;
  margin-bottom: 4px;
}
</style>
