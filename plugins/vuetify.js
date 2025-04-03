import { createVuetify } from "vuetify";
import { VBtn } from "vuetify/components";

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    ssr: true,
    aliases: {
      IconBtn: VBtn,
    },
    defaults,
    theme,
    icons,
    rtl: {
      auto: true
    },
  });

  app.vueApp.use(vuetify);
});
