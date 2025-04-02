import { defineStore } from "pinia";

export const useGlobal = defineStore({
  id: "global",
  state: () => ({
    appVersion: "1.0.0",
    sideNavBar: true,
    datkMode: false,
  }),

  actions: {
    sideBarToggle(tempValue) {
      if (tempValue) {
        this.sideNavBar = tempValue;
      } else {
        this.sideNavBar = !this.sideNavBar;
      }
    },
    darkModeToggle() {
      this.datkMode = !this.datkMode;
    },
  },
});
