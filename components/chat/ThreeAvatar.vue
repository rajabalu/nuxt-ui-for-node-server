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
    30, // Slightly wider field of view for better body proportions
    container.value.clientWidth / container.value.clientHeight, 
    0.1, 
    1000
  );
  camera.position.set(0, 0.8, 4.5); // Adjusted position for better body proportions
  
  // Initialize renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.value.appendChild(renderer.domElement);
  
  // Enhanced lighting for more natural facial features
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  
  // Main light positioned to illuminate face and front of avatar
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
  directionalLight.position.set(1, 1.5, 3); // Adjusted position for better facial lighting
  scene.add(directionalLight);
  
  // Add a fill light from the side for dimension
  const fillLight = new THREE.DirectionalLight(0xf5f5ff, 0.7);
  fillLight.position.set(-2, 0.5, 1); // Light from left side for better facial contours
  scene.add(fillLight);
  
  // Add subtle backlight for separation
  const backLight = new THREE.DirectionalLight(0xf0f0ff, 0.4);
  backLight.position.set(0, 1, -2); // From behind to create depth
  scene.add(backLight);
  
  // Initialize clock for animations
  clock = new THREE.Clock();
  
  // Add orbit controls with optimized settings
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.5, 0); // Adjust target to focus on upper body/face
  controls.update();
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05; // Smoother camera movement
  controls.rotateSpeed = 0.5; // Slower rotation for more precise control
  controls.maxPolarAngle = Math.PI * 0.65; // Limit vertical rotation to prevent awkward angles
  controls.minPolarAngle = Math.PI * 0.25; // Ensure the avatar isn't viewed from below
  controls.maxDistance = 5.0; // Allow zooming out to see full body
  controls.minDistance = 2.0; // Prevent getting too close to the face
}

function loadAvatar() {
  // Check if we have a valid model path before attempting to load it
  if (!selectedAvatar.value.modelPath) {
    console.log('No avatar model path provided, skipping 3D avatar loading');
    return;
  }
  
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
    
    // Adjust position for a more casual stance - move slightly lower
    model.position.y -= size.y * 0.05; 
    
    // Create a more casual, relaxed posture through subtle rotation
    model.rotation.x = THREE.MathUtils.degToRad(-3); // Very slight tilt forward for natural look
    model.rotation.y = THREE.MathUtils.degToRad(5); // Slight turn to one side for casual pose
    
    // Apply scale to ensure proper framing
    const scale = 0.75; // Scale to show more of the body
    model.scale.set(scale, scale, scale);
    
    // If there are animations, set them up (but handle the case where there aren't any)
    if (gltf.animations && gltf.animations.length > 0) {
      console.log('Available animations for ' + selectedAvatar.value.modelPath + ':');
      gltf.animations.forEach((clip, index) => {
        console.log(`[${index}] ${clip.name} (Duration: ${clip.duration.toFixed(2)}s)`);
      });
      
      mixer = new THREE.AnimationMixer(model);
      
      // Store animations by name
      gltf.animations.forEach(clip => {
        animations[clip.name] = mixer.clipAction(clip);
      });
      
      // Try to play idle animation if available
      const idleAnimation = animations['CharacterArmature|Idle'] || animations['CharacterArmature|Idle_Neutral'];
      if (idleAnimation) {
        idleAnimation.play();
        currentAnimation = idleAnimation === animations['CharacterArmature|Idle'] ? 
                          'CharacterArmature|Idle' : 'CharacterArmature|Idle_Neutral';
      }
      
      // Try to play wave animation if available
      setTimeout(() => {
        if (animations['CharacterArmature|Wave']) {
          playWaveAnimation();
        }
      }, 1000);
    } else {
      console.log('No animations found in the model. Using static pose.');
      
      // Since there are no animations, apply manual transformations to limbs if possible
      // This would require accessing specific bones in the model if they exist
      traverseAndAdjustBones(model);
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

// Function to manually adjust bones for a more natural pose
function traverseAndAdjustBones(model) {
  // Create a map to store found bones
  const bones = {};
  
  // Traverse the model to find bones or meaningful object groups
  model.traverse((object) => {
    // Store the object by name for later manipulation
    if (object.name) {
      bones[object.name] = object;
      console.log(`Found model part: ${object.name}`);
    }
    
    // Look for common naming patterns in 3D models
    if (object.name && object.name.toLowerCase().includes('arm')) {
      // Adjust arms to be in a more relaxed position
      // Left arm slightly bent
      if (object.name.toLowerCase().includes('left')) {
        object.rotation.z += THREE.MathUtils.degToRad(15); // Bend slightly outward
        object.rotation.x += THREE.MathUtils.degToRad(5);  // Bend slightly forward
      }
      // Right arm in a casual position
      else if (object.name.toLowerCase().includes('right')) {
        object.rotation.z -= THREE.MathUtils.degToRad(10); // Bend slightly outward
        object.rotation.x += THREE.MathUtils.degToRad(3);  // Bend slightly forward
      }
    }
    
    // Adjust leg positioning for a casual stance
    if (object.name && object.name.toLowerCase().includes('leg')) {
      if (object.name.toLowerCase().includes('left')) {
        object.rotation.x -= THREE.MathUtils.degToRad(3); // Slightly forward
        object.rotation.z += THREE.MathUtils.degToRad(2); // Slightly outward
      } else if (object.name.toLowerCase().includes('right')) {
        object.rotation.x += THREE.MathUtils.degToRad(5); // Slightly back
        object.rotation.z -= THREE.MathUtils.degToRad(1); // Slightly inward
      }
    }
    
    // Adjust head to face forward with a slight tilt
    if (object.name && object.name.toLowerCase().includes('head')) {
      object.rotation.y = THREE.MathUtils.degToRad(0);    // Look straight ahead
      object.rotation.z = THREE.MathUtils.degToRad(0);    // No tilt side to side
      object.rotation.x = THREE.MathUtils.degToRad(-5);   // Slight downward tilt for natural look
    }
  });
  
  return bones;
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
