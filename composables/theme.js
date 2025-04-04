import { useDisplay } from "vuetify";
import { ref, computed } from "vue";
import { useTheme } from "vuetify";
import { useUserPreferences } from "@/stores/userPreferences";

export const themeConfig = () => {
  const { name } = useDisplay();
  const theme = useTheme();
  const userPreferencesStore = useUserPreferences();
  
  // Get initial theme from user preferences store
  const currentTheme = ref(userPreferencesStore.theme || (theme.global.current.value.dark ? "dark" : "light"));

  // Fixed Value
  const themeHeaderHeight = "60";
  const themeSidebarWidth = "259";
  
  // Theme Grid Mode
  const smallDisplay = computed(() => {
    if (name.value === "sm" || name.value === "xs") {
      return true;
    } else {
      return false;
    }
  });

  const themeName = computed(() => currentTheme.value);
  const themeColors = computed(() => theme.themes.value[currentTheme.value].colors);

  const themeChangeMode = (toggle = true) => {
    if (toggle) {
      currentTheme.value = currentTheme.value === "light" ? "dark" : "light";
    }
    
    // Apply theme to Vuetify
    theme.global.name.value = currentTheme.value;
    
    // Update user preferences store which handles persistence
    userPreferencesStore.setTheme(currentTheme.value);
  };

  return {
    themeHeaderHeight,
    themeSidebarWidth,
    smallDisplay,
    themeName,
    themeColors,
    themeChangeMode,
    currentTheme,
  };
};
