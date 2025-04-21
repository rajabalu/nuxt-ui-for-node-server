<!-- Avatar.vue -->
<template>
  <div id="avatar-container" ref="avatarContainer"></div>
  <div id="subtitles" ref="subtitlesElement"></div>

  <!-- Controls at the top -->
  <div id="controls">
    <input id="text" type="text" value="Hello, how are you?" />
    <button id="speak" @click="speak">Speak</button>
    <button id="settings-button" @click="toggleSettings">Settings</button>
  </div>

  <!-- Collapsible Settings Panel -->
  <div id="settings-panel" ref="settingsPanel" style="display: none;">
    <label for="azure-key">Azure Key</label>
    <input id="azure-key" type="text" aria-label="Azure key" placeholder="Enter Azure Key">

    <label for="azure-region">Azure Region</label>
    <input id="azure-region" type="text" aria-label="Azure region" placeholder="Enter Azure Region">
    <br>
    <fieldset id="lipsync-type">
      <legend>Lip-sync Data Type</legend>
      <label>
        <input type="radio" name="lipsync_type" value="visemes" checked>
        Visemes
      </label>
      <label>
        <input type="radio" name="lipsync_type" value="words">
        Words
      </label>
      <label>
        <input type="radio" name="lipsync_type" value="blendshapes">
        Blend shapes
      </label>
    </fieldset>
  </div>

  <!-- Loading or error display -->
  <div id="loading" ref="loadingElement"></div>
</template>

<script setup>
import { useRouter } from '#app';
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useChatStore } from '~/stores/chat';
import { useGlobal } from '~/stores/global';

// Define refs for DOM elements
const avatarContainer = ref(null);
const subtitlesElement = ref(null);
const settingsPanel = ref(null);
const loadingElement = ref(null);

// Stores
const router = useRouter();
const chatStore = useChatStore();
const globalStore = useGlobal();
const { $talkingHeadReady } = useNuxtApp();

// Initialize variables
const talkingHead = ref(null);
const isInitialized = ref(false);

// Get selected avatar through computed property
const selectedAvatar = computed(() => globalStore.getSelectedAvatar());

const navigateToNewStrategy = () => {
  chatStore.clearMessages();
  router.push('/');
};

// Speak function to test the avatar
const speak = async () => {
  if (!talkingHead.value) return;
  
  try {
    const text = document.getElementById('text')?.value || 'Hello, how are you?';
    await talkingHead.value.speakText(text, {}, (node) => {
      if (subtitlesElement.value) {
        subtitlesElement.value.textContent = node.textContent || '';
        subtitlesElement.value.style.display = node.textContent ? 'block' : 'none';
      }
    });
  } catch (error) {
    console.error('Error during speech:', error);
    if (loadingElement.value) {
      loadingElement.value.textContent = `Error: ${error.message}`;
    }
  }
};

const toggleSettings = () => {
  if (settingsPanel.value) {
    settingsPanel.value.style.display = 
      settingsPanel.value.style.display === 'none' ? 'block' : 'none';
  }
};

// Initialize TalkingHead on client-side only
onMounted(async () => {
  // Wait for the DOM to be fully rendered
  await nextTick();
  
  // Don't initialize if it's server-side
  if (process.server) return;
  
  try {
    // Dynamically import the TalkingHead library to avoid SSR issues
    const { TalkingHead } = await import('@met4citizen/talkinghead');
    
    // Initialize TalkingHead with the container element
    if (avatarContainer.value) {
      talkingHead.value = new TalkingHead(avatarContainer.value, {
        avatarMood: "neutral",
        avatarIdleEyeContact: 0.2,
        avatarIdleHeadMove: 0.5,
        avatarSpeakingEyeContact: 0.5,
        avatarSpeakingHeadMove: 0.5
      });

      // Load avatar model
      await talkingHead.value.showAvatar({
        url: '/models/Leo.glb',
        avatarMood: "neutral"
      });

      isInitialized.value = true;
      console.log("TalkingHead initialized successfully");
      
      // Greet the user
      await speak();
    }
  } catch (error) {
    console.error("Error initializing TalkingHead:", error);
    if (loadingElement.value) {
      loadingElement.value.textContent = `Error loading avatar: ${error.message}`;
    }
  }
});

// Clean up on component unmount
onBeforeUnmount(() => {
  if (talkingHead.value) {
    talkingHead.value.stop();
    talkingHead.value = null;
  }
});
</script>

<style scoped lang="scss">
#avatar-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

/* Controls container at top */
#controls {
  display: flex;
  align-items: center;
  gap: 10px;
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  height: 40px;
}

#text {
  flex: 1;
  font-size: 20px;
  height: 100%;
  padding: 5px;
  box-sizing: border-box;
}

#speak {
  width: 100px;
  height: 100%;
  font-size: 16px;
  cursor: pointer;
}

/* Settings toggle button */
#settings-button {
  width: 80px;
  height: 100%;
  font-size: 16px;
  background: #333;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

#settings-button:hover {
  background: #444;
}

/* Collapsible Settings Panel */
#settings-panel {
  position: absolute;
  top: 60px;
  right: 10px;
  width: 220px;
  background-color: #333;
  padding: 10px;
  border-radius: 5px;
  z-index: 998;
}

#settings-panel label {
  display: block;
  margin-top: 10px;
  font-weight: bold;
  font-size: 0.9rem;
}

#settings-panel input, #settings-panel select {
  width: calc(100% - 10px);
  padding: 5px;
  margin-top: 5px;
  font-size: 0.9rem;
  box-sizing: border-box;
}

/* Loading text at bottom-left */
#loading {
  display: block;
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  height: 40px;
  font-size: 20px;
}

#subtitles {
  position: absolute;
  bottom: 50px;
  left: 10%;
  right: 10%;
  text-align: center;
  font-size: 1.2em;
  color: #ffffff;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  z-index: 1000;
  padding: 5px 10px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.3);
  display: none;
}

#lipsync-type {
  text-align: left;
}

#lipsync-type label {
  display: inline-flex;
  align-items: center;
  margin-right: 1rem;
}

#lipsync-type label input[type="radio"] {
  display: inline-block !important;
  width: auto !important;
  margin-right: 0.3rem;
}

.status {
  position: absolute;
  bottom: 70px;
  left: 10px;
  color: #666;
  font-size: 0.8rem;
}
</style>