import { defineStore } from "pinia";

export const useGlobal = defineStore({
  id: "global",
  state: () => ({
    appVersion: "1.0.0",
    sideNavBar: true,
    darkMode: false,
    selectedAvatarId: 1, // Default to Peter avatar
    AVAILABLE_AVATARS: [
      {
        id: 0,
        name: 'No Avatar',
        thumbnail: '/images/avatar/no-avatar.png', // Use a standard icon instead
        modelPath: '',
        settings: {
          // No settings for "No Avatar" option
        }
      },
      {
        id: 1,
        name: 'Leo',
        thumbnail: '/images/avatar/Leo.png',
        modelPath: '/models/leo.glb',
        settings: {
          body: 'M',
          mood: 'happy',
          voice: 'en-AU-WilliamNeural',
          cameraView: 'upper',
          avatarIdleHeadMove: 0.7,
          avatarSpeakingHeadMove: 0.8, 
          avatarIdleEyeContact: 0.9,
          avatarSpeakingEyeContact: 1.0
        }
      },
      {
        id: 2,
        name: 'Nova',
        thumbnail: '/images/avatar/Nova.png',
        modelPath: '/models/nova.glb',
        settings: {
          body: 'F',
          mood: 'love',
          voice: 'en-US-JennyNeural',
          cameraView: 'upper',
          avatarIdleHeadMove: 0.6,
          avatarSpeakingHeadMove: 0.7,
          avatarIdleEyeContact: 0.8,
          avatarSpeakingEyeContact: 0.9
        }
      },
      {
        id: 3,
        name: 'Max',
        thumbnail: '/images/avatar/Max.png',
        modelPath: '/models/max.glb',
        settings: {
          body: 'M',
          mood: 'neutral',
          voice: 'en-GB-RyanNeural',
          cameraView: 'upper',
          avatarIdleHeadMove: 0.5,
          avatarSpeakingHeadMove: 0.7,
          avatarIdleEyeContact: 0.7,
          avatarSpeakingEyeContact: 0.8
        }
      },
      {
        id: 4,
        name: 'Aria',
        thumbnail: '/images/avatar/Aria.png',
        modelPath: '/models/Aria.glb',
        settings: {
          body: 'F',
          mood: 'neutral',
          voice: 'en-GB-SoniaNeural',
          cameraView: 'upper',
          avatarIdleHeadMove: 0.6,
          avatarSpeakingHeadMove: 0.6,
          avatarIdleEyeContact: 0.8,
          avatarSpeakingEyeContact: 0.9
        }
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
    },
    
    // Check if avatar is enabled (not the "No Avatar" option)
    isAvatarEnabled() {
      return this.selectedAvatarId !== 0;
    }
  },
});

// Keep this for backward compatibility
export const AVAILABLE_AVATARS = [
  {
    id: 0,
    name: 'No Avatar',
    thumbnail: '/images/avatar/no-avatar.png',
    modelPath: ''
  },
  {
    id: 1,
    name: 'Peter Hinchcliffe',
    thumbnail: '/images/avatar/avatar-17.jpg',
    modelPath: '/models/business-man.glb'
  },
  {
    id: 2,
    name: 'Lara Smith',
    thumbnail: '/images/avatar/avatar-20.jpg',
    modelPath: '/models/business-women.glb'
  }
];