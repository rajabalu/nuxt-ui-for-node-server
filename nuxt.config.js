import { fileURLToPath } from "url";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

// PWA Config
const title = "AutoCortex";
const shortTitle = "AutoCortex";
const description =
  "AutoCortex - Vuetify Nuxt Admin Template Free and open-source Github, provides developers with everything need to create Web Application & Kick start project";
const image = "";
const url = "";
const themeColor = "#f1f5f9";

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      SERVER_URL: process.env.SERVER_URL || 'http://localhost:8000/api/v1/',
      CONTACT_PHONE: process.env.VITE_CONTACT_PHONE || '+61 2 8320 4047',
      CONTACT_EMAIL: process.env.VITE_CONTACT_EMAIL || 'info@gosol.com.au',
      CONTACT_ADDRESS: process.env.VITE_CONTACT_ADDRESS || 'Level 35, Tower One, International Towers, 100 Barangaroo Avenue, Sydney, 2000, NSW, Australia'
    }
  },  
  devServer: {
    port: Number(process.env.NUXT_PORT) || 3001
  },
  ssr: false,
  alias: {
    "@configured-variables": fileURLToPath(
      new URL("./assets/styles/_variables.scss", import.meta.url)
    ),    
  },

  app: {
    baseURL: "/",
    head: {
      title: "AutoCortex",
      titleTemplate: "%s",
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "canonical", href: url },
      ],
      meta: [
        { charset: "utf-8" },
        {
          hid: "description",
          name: "description",
          content: description,
        },
        { property: "og:site_name", content: title },
        { hid: "og:type", property: "og:type", content: "website" },
        {
          hid: "og:url",
          property: "og:url",
          content: url,
        },
        {
          hid: "og:image:secure_url",
          property: "og:image:secure_url",
          content: image,
        },
        {
          hid: "og:title",
          property: "og:title",
          content: title,
        },
        {
          hid: "og:description",
          property: "og:description",
          content: description,
        },
        {
          hid: "og:image",
          property: "og:image",
          content: image,
        },

        //Twitter
        { name: "twitter:card", content: "summary_large_image" },
        {
          hid: "twitter:url",
          name: "twitter:url",
          content: url,
        },
        {
          hid: "twitter:title",
          name: "twitter:title",
          content: title,
        },
        {
          hid: "twitter:description",
          name: "twitter:description",
          content: description,
        },
        {
          hid: "twitter:image",
          name: "twitter:image",
          content: image,
        },
      ],
    },
  },

  build: { transpile: ["vuetify"] },

  compatibilityDate: "2024-07-15",

  css: [
    "/assets/styles/_index.scss",
    "/assets/styles/plugin/vue-code-highlighter.css",
    "dropzone-vue/dist/drop-zone.common.css",
    "apexcharts/dist/apexcharts.css",
  ],

  components: [
    {
      path: "~/components/globals",
      prefix: "Globals",
    },
  ],

  devtools: { enabled: false },

  // Apply auth middleware globally to all routes
  // Using proper Nuxt 3 syntax and allowing route-specific middleware to override
  routeRules: {
    // Apply auth middleware globally except where overridden by route-specific middleware
    '/**': { middleware: ['auth'] }
  },

  modules: [
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "@vite-pwa/nuxt",
    "@nuxtjs/i18n",
    async (options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        config.plugins ||= [];
        config.plugins.push(
          vuetify({
            styles: {
              configFile: "/assets/styles/vuetify/_setting.scss",
            },
          })
        );
      });
    },
  ],
  
  // Load plugins in specific order
  plugins: [
    // Unified app initialization plugin runs first
    '~/plugins/app-initializer.client.js',
    '~/plugins/persistent-settings.js',
    // Social Login SDK integrations
    '~/plugins/facebook-sdk.js',
    '~/plugins/google-sdk.js',
    '~/plugins/apple-sdk.js',
    // RTL support plugin
    '~/plugins/rtl-support.client.js',
    // Other plugins will be loaded automatically
    '~/plugins/event-bus.js'
  ],
  
  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' },
      { code: 'fr', iso: 'fr-FR', name: 'Français', file: 'fr.json' },
      { code: 'ar', iso: 'ar-SA', name: 'العربية', file: 'ar.json' }
    ],
    defaultLocale: 'en',
    lazy: true,
    langDir: 'locales/',
    strategy: 'prefix_except_default'
  },
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: shortTitle,
      short_name: shortTitle,
      description: description,
      theme_color: themeColor,
      lang: "en",
      background_color: "#ffffff",
      icons: [
        {
          src: "/icons/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icons/pwa-maskable-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/icons/pwa-maskable-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
  },

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    server: {
      mimeTypes: {
        'json': 'application/json'
      }
    }
  },
});
