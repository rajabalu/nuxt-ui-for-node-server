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
  
  // Initialize camera
  camera = new THREE.PerspectiveCamera(
    45, 
    container.value.clientWidth / container.value.clientHeight, 
    0.1, 
    1000
  );
  camera.position.set(0, 1.5, 3);
  
  // Initialize renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.value.appendChild(renderer.domElement);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 1, 2);
  scene.add(directionalLight);
  
  // Initialize clock for animations
  clock = new THREE.Clock();
  
  // Add orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.update();
  controls.enablePan = false;
  controls.enableDamping = true;
}

function loadAvatar() {
  const loader = new GLTFLoader();
  
  console.log('Loading avatar from:', selectedAvatar.value.modelPath);
  
  loader.load(selectedAvatar.value.modelPath, (gltf) => {
    model = gltf.scene;
    scene.add(model);
    
    // Center the model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.x = -center.x;
    model.position.y = -center.y;
    model.position.z = -center.z;
    
    // Setup animations
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      
      // Store animations by name
      gltf.animations.forEach(clip => {
        animations[clip.name] = mixer.clipAction(clip);
        console.log('Found animation:', clip.name);
      });
      
      // Play idle animation by default
      if (animations['idle']) {
        animations['idle'].play();
        currentAnimation = 'idle';
      } else if (animations['Idle']) {
        animations['Idle'].play();
        currentAnimation = 'Idle';
      }
    }
  }, 
  // Progress callback
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  // Error callback
  (error) => {
    console.error('Error loading 3D model:', error);
  });
}

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
  min-height: 300px;
  border-radius: 12px;
  overflow: hidden;
}
</style>
