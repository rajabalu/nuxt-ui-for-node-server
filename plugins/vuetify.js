import { createVuetify } from "vuetify";
import { VBtn } from "vuetify/components";
import { Icon } from '@iconify/vue';

// Vuetify defaults
const defaults = {
  VBtn: {
    variant: 'flat',
    rounded: true,
  },
};

// Theme configuration
const theme = {
  defaultTheme: 'light',
  themes: {
    light: {
      colors: {
        primary: '#1867C0',
        secondary: '#5CBBF6',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FFC107',
      },
    },
  },
};

// Icons configuration using local iconify
const icons = {
  defaultSet: 'iconify',
  aliases: {
    // Common icons used in the app
    refresh: 'mdi-refresh',
    eye: 'mdi-eye',
    eyeOff: 'mdi-eye-off',
    logout: 'mdi-logout',
    account: 'mdi-account',
    email: 'mdi-email',
    calendar: 'mdi-calendar',
    shield: 'mdi-shield-account',
    check: 'mdi-account-check',
    login: 'mdi-login-variant',
    refresh: 'mdi-refresh',
    shieldAlert: 'mdi-shield-alert',
    accountOff: 'mdi-account-off'
  },
  sets: {
    iconify: {
      component: Icon,
    },
  },
};

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    ssr: false,
    aliases: {
      IconBtn: VBtn,
    },
    defaults,
    theme,
    icons,
  });

  app.vueApp.use(vuetify);
});
