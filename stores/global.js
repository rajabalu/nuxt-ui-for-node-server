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

export const AVAILABLE_AVATARS = [
  {
  id: 1,
  name: 'Peter Hinchcliffe',
  thumbnail: 'public/images/avatars/avatar-17.jpg',
  modelPath: '/models/business-man.glb'
  },
  {
  id: 2,
  name: 'Lara Smith',
  thumbnail: 'public/images/avatars/avatar-20.jpg',
  modelPath: '/models/business-women.glb'
  }
  ];