<template>
  <div ref="container" class="three-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useGlobal } from '~/stores/global';
import { useChatStore } from '~/stores/chat';

const props = defineProps({
  avatarId: {
    type: Number,
    default: 1
  }
});

// References
const container = ref(null);
const globalStore = useGlobal();
const chatStore = useChatStore();

// Three.js variables
let scene, camera, renderer, mixer, model, clock, controls;
let animations = {};
let currentAnimation = null;
let isSpeaking = false;

// Get the selected avatar data
const selectedAvatar = computed(() => {
  return globalStore.AVAILABLE_AVATARS.find(avatar => avatar.id === props.avatarId) || globalStore.AVAILABLE_AVATARS[0];
});

// Watch for new messages
watch(() => chatStore.messages, (messages) => {
  if (messages && messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.isUser) {
      speakMessage(lastMessage.content);
    }
  }
}, { deep: true });

// Initialize Three.js scene
onMounted(() => {
  initThreeJS();
  loadAvatar();
  animate();
  
  // Handle window resize
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
});

function initThreeJS() {
  // Initialize scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  
  // Initialize camera with adjusted field of view and position
  camera = new THREE.PerspectiveCamera(
    25, // Wider field of view
    container.value.clientWidth / container.value.clientHeight, 
    0.1, 
    1000
  );
  camera.position.set(0, 1.0, 5.5); // Moved camera back and adjusted height
  
  // Initialize renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.value.appendChild(renderer.domElement);
  
  // Enhanced lighting for better appearance
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  
  // Main light positioned to illuminate the entire avatar
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(0, 2, 2); // Light from above and front
  scene.add(directionalLight);
  
  // Add a fill light to brighten the entire model
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
  fillLight.position.set(0, 1, -1); // From behind to create separation from background
  scene.add(fillLight);
  
  // Initialize clock for animations
  clock = new THREE.Clock();
  
  // Add orbit controls with optimized settings
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.rotateSpeed = 0.7;
  controls.maxDistance = 3.5;
  controls.minDistance = 1;
}

function loadAvatar() {
  const loader = new GLTFLoader();
  
  loader.load(selectedAvatar.value.modelPath, (gltf) => {
    model = gltf.scene;
    scene.add(model);
    
    // Center the model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Reset position
    model.position.x = -center.x;
    model.position.y = -center.y;
    model.position.z = -center.z;
    
    // Move model up to ensure full visibility including feet
    model.position.y += size.y * 0.1; 
    
    // Adjust the model's rotation to look directly at the camera
    model.rotation.x = THREE.MathUtils.degToRad(-20); // Just slightly tilt head up
    
    // Apply scale to ensure the entire avatar is visible
    const scale = 0.8; // Reduce scale more to ensure full visibility
    model.scale.set(scale, scale, scale);
    
    // Setup animations
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      
      // Store animations by name
      gltf.animations.forEach(clip => {
        animations[clip.name] = mixer.clipAction(clip);
      });
      
      // Log all available animations
      console.log('Available animations:');
      Object.keys(animations).forEach(animName => {
        console.log(`- ${animName}`);
      });
      
      // Play idle animation by default using correct name format
      const idleAnimation = animations['CharacterArmature|Idle'] || animations['CharacterArmature|Idle_Neutral'];
      if (idleAnimation) {
        idleAnimation.play();
        currentAnimation = idleAnimation === animations['CharacterArmature|Idle'] ? 
                           'CharacterArmature|Idle' : 'CharacterArmature|Idle_Neutral';
      }
      
      // Add a slight delay before playing the wave animation
      // This gives the model time to fully render and position itself
      setTimeout(() => {
        playWaveAnimation();
      }, 1000);
    }
  }, 
  // Progress callback
  (xhr) => {
    // Empty progress callback
  },
  // Error callback
  (error) => {
    console.error('Error loading 3D model:', error);
  });
}

// Add playWaveAnimation function to handle the initial greeting
function playWaveAnimation() {
  // Use the specific animation name we found in the model
  const waveAnimation = animations['CharacterArmature|Wave'];
  
  if (waveAnimation) {
    // Stop current animation with a fade out
    if (currentAnimation && animations[currentAnimation]) {
      animations[currentAnimation].fadeOut(0.3);
    }
    
    // Play wave animation
    waveAnimation.reset().fadeIn(0.3).play();
    currentAnimation = 'CharacterArmature|Wave';
    
    // After wave animation, return to idle
    setTimeout(() => {
      if (animations[currentAnimation]) {
        animations[currentAnimation].fadeOut(0.5);
      }
      
      // Find and play idle animation with the correct name
      const idleAnimation = animations['CharacterArmature|Idle'] || 
                          animations['CharacterArmature|Idle_Neutral'];
      
      if (idleAnimation) {
        idleAnimation.reset().fadeIn(0.5).play();
        currentAnimation = idleAnimation === animations['CharacterArmature|Idle'] ? 
                         'CharacterArmature|Idle' : 'CharacterArmature|Idle_Neutral';
      }
    }, 3000); // Duration for wave animation (3 seconds)
  }
}

// Add public method to trigger wave animation that can be called from parent component
function triggerWave() {
  const waveAnimation = animations['CharacterArmature|Wave'];
  
  if (waveAnimation) {
    // Stop current animation with a fade out
    if (currentAnimation && animations[currentAnimation]) {
      animations[currentAnimation].fadeOut(0.3);
    }
    
    // Play wave animation
    waveAnimation.reset().fadeIn(0.3).play();
    currentAnimation = 'CharacterArmature|Wave';
    
    // After wave animation completes, return to idle
    setTimeout(() => {
      if (animations[currentAnimation]) {
        animations[currentAnimation].fadeOut(0.5);
      }
      
      // Find and play idle animation
      const idleAnimation = animations['CharacterArmature|Idle'] || 
                           animations['CharacterArmature|Idle_Neutral'];
      
      if (idleAnimation) {
        idleAnimation.reset().fadeIn(0.5).play();
        currentAnimation = idleAnimation === animations['CharacterArmature|Idle'] ? 
                         'CharacterArmature|Idle' : 'CharacterArmature|Idle_Neutral';
      }
    }, 3000); // Duration for wave animation (3 seconds)
  }
}

// Expose the triggerWave method to parent components
defineExpose({
  triggerWave
});

// Handle window resize
function onResize() {
  if (container.value && camera && renderer) {
    camera.aspect = container.value.clientWidth / container.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update mixer
  if (mixer) {
    mixer.update(clock.getDelta());
  }
  
  // Update controls
  if (controls) {
    controls.update();
  }
  
  // Render scene
  renderer.render(scene, camera);
}

// Speak a message
function speakMessage(message) {
  // Start speaking animation
  isSpeaking = true;
  
  // If model has a "talking" animation, play it
  if (animations['talk'] && currentAnimation !== 'talk') {
    if (animations[currentAnimation]) {
      animations[currentAnimation].fadeOut(0.5);
    }
    animations['talk'].reset().fadeIn(0.5).play();
    currentAnimation = 'talk';
  } else if (animations['Talk'] && currentAnimation !== 'Talk') {
    if (animations[currentAnimation]) {
      animations[currentAnimation].fadeOut(0.5);
    }
    animations['Talk'].reset().fadeIn(0.5).play();
    currentAnimation = 'Talk';
  }
  
  // Calculate speech duration based on message length
  const duration = Math.max(3, message.length * 0.05); // minimum 3 seconds
  
  // Stop speaking after duration
  setTimeout(() => {
    isSpeaking = false;
    
    // Return to idle animation
    if ((animations['idle'] || animations['Idle']) && 
        (currentAnimation === 'talk' || currentAnimation === 'Talk')) {
      if (animations[currentAnimation]) {
        animations[currentAnimation].fadeOut(0.5);
      }
      
      if (animations['idle']) {
        animations['idle'].reset().fadeIn(0.5).play();
        currentAnimation = 'idle';
      } else if (animations['Idle']) {
        animations['Idle'].reset().fadeIn(0.5).play();
        currentAnimation = 'Idle';
      }
    }
  }, duration * 1000);
}
</script>

<style scoped>
.three-container {
  width: 100%;
  height: 100%;
  min-height: 400px; /* Match the avatar container's min-height */
  border-radius: 12px;
  overflow: hidden;
  position: relative; /* Added for potential overlays/effects */
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05); /* Subtle inner shadow for depth */
}
</style>
