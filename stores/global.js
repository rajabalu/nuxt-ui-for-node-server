import { defineStore } from "pinia";

export const useGlobal = defineStore({
  id: "global",
  state: () => ({
    appVersion: "1.0.0",
    sideNavBar: true,
    darkMode: false,
    selectedAvatarId: 1, // Add selected avatar ID to store
    AVAILABLE_AVATARS: [
      {
        id: 1,
        name: 'Peter Hinchcliffe',
        thumbnail: '/images/avatars/avatar-17.jpg', // Fixed path
        modelPath: '/models/business-man.glb'
      },
      {
        id: 2,
        name: 'Lara Smith',
        thumbnail: '/images/avatars/avatar-20.jpg', // Fixed path
        modelPath: '/models/business-women.glb'
      }
    ]
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
      this.darkMode = !this.darkMode;
    },
    
    // Add a method to change the avatar
    setAvatar(id) {
      if (this.AVAILABLE_AVATARS.some(avatar => avatar.id === id)) {
        this.selectedAvatarId = id;
      }
    },
    
    // Get the currently selected avatar
    getSelectedAvatar() {
      return this.AVAILABLE_AVATARS.find(avatar => avatar.id === this.selectedAvatarId) || this.AVAILABLE_AVATARS[0];
    }
  },
});

// Keep this for backward compatibility
export const AVAILABLE_AVATARS = [
  {
    id: 1,
    name: 'Peter Hinchcliffe',
    thumbnail: '/images/avatars/avatar-17.jpg', // Fixed path
    modelPath: '/models/business-man.glb'
  },
  {
    id: 2,
    name: 'Lara Smith',
    thumbnail: '/images/avatars/avatar-20.jpg', // Fixed path
    modelPath: '/models/business-women.glb'
  }
];