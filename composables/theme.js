import { useDisplay } from "vuetify";
import { ref, computed } from "vue";
import { useTheme } from "vuetify";

export const themeConfig = () => {
  const { name } = useDisplay();
  const theme = useTheme();
  const currentTheme = ref(theme.global.current.value.dark ? "dark" : "light");

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

  const themeChangeMode = () => {
    currentTheme.value = currentTheme.value === "light" ? "dark" : "light";
    theme.global.name.value = currentTheme.value;
  };

  return {
    themeHeaderHeight,
    themeSidebarWidth,
    smallDisplay,
    themeName,
    themeColors,
    themeChangeMode,
  };
};
