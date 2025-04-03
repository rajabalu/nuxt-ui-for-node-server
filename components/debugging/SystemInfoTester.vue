<template>
  <v-card class="pa-4">
    <v-card-title>System Information</v-card-title>
    <v-card-text>
      <v-list>
        <v-list-item>
          <v-list-item-title>Browser:</v-list-item-title>
          <v-list-item-subtitle>{{ systemInfo.browser }}</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item>
          <v-list-item-title>User Agent:</v-list-item-title>
          <v-list-item-subtitle class="text-wrap">{{ systemInfo.userAgent }}</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item>
          <v-list-item-title>Screen Resolution:</v-list-item-title>
          <v-list-item-subtitle>{{ systemInfo.screenResolution }}</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item>
          <v-list-item-title>Window Size:</v-list-item-title>
          <v-list-item-subtitle>{{ systemInfo.windowSize }}</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item>
          <v-list-item-title>Device Type:</v-list-item-title>
          <v-list-item-subtitle>{{ systemInfo.deviceType }}</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item>
          <v-list-item-title>OS:</v-list-item-title>
          <v-list-item-subtitle>{{ systemInfo.os }}</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item>
          <v-list-item-title>Cookies Enabled:</v-list-item-title>
          <v-list-item-subtitle>{{ systemInfo.cookiesEnabled }}</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item>
          <v-list-item-title>LocalStorage Available:</v-list-item-title>
          <v-list-item-subtitle>{{ systemInfo.localStorageAvailable }}</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item>
          <v-list-item-title>SessionStorage Available:</v-list-item-title>
          <v-list-item-subtitle>{{ systemInfo.sessionStorageAvailable }}</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item>
          <v-list-item-title>Time:</v-list-item-title>
          <v-list-item-subtitle>{{ systemInfo.time }}</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item>
          <v-list-item-title>Timezone:</v-list-item-title>
          <v-list-item-subtitle>{{ systemInfo.timezone }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
      
      <v-divider class="my-4"></v-divider>
      
      <div class="text-h6 mb-3">Environment Variables</div>
      <v-list v-if="runtimeConfig && Object.keys(runtimeConfig).length > 0">
        <v-list-item v-for="(value, key) in runtimeConfig" :key="key">
          <v-list-item-title>{{ key }}:</v-list-item-title>
          <v-list-item-subtitle>{{ value }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <v-alert v-else type="info">No runtime configuration available</v-alert>
      
      <v-divider class="my-4"></v-divider>
      
      <div class="d-flex gap-2">
        <v-btn color="primary" @click="refresh">
          Refresh
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRuntimeConfig } from '#app';

// Get runtime config
const config = useRuntimeConfig();
const runtimeConfig = ref({});
const systemInfo = ref({
  browser: 'Unknown',
  userAgent: 'Unknown',
  screenResolution: 'Unknown',
  windowSize: 'Unknown', 
  deviceType: 'Unknown',
  os: 'Unknown',
  cookiesEnabled: 'Unknown',
  localStorageAvailable: 'Unknown',
  sessionStorageAvailable: 'Unknown',
  time: 'Unknown',
  timezone: 'Unknown'
});

// Detect browser
const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  
  if (userAgent.match(/chrome|chromium|crios/i)) {
    browser = 'Chrome';
  } else if (userAgent.match(/firefox|fxios/i)) {
    browser = 'Firefox';
  } else if (userAgent.match(/safari/i)) {
    browser = 'Safari';
  } else if (userAgent.match(/opr\//i)) {
    browser = 'Opera';
  } else if (userAgent.match(/edg/i)) {
    browser = 'Edge';
  } else if (userAgent.match(/msie|trident/i)) {
    browser = 'Internet Explorer';
  }
  
  return browser;
};

// Detect OS
const detectOS = () => {
  const userAgent = navigator.userAgent;
  let os = 'Unknown';
  
  if (userAgent.match(/windows nt/i)) {
    os = 'Windows';
  } else if (userAgent.match(/macintosh|mac os x/i)) {
    os = 'macOS';
  } else if (userAgent.match(/linux/i)) {
    os = 'Linux';
  } else if (userAgent.match(/android/i)) {
    os = 'Android';
  } else if (userAgent.match(/iphone|ipad|ipod/i)) {
    os = 'iOS';
  }
  
  return os;
};

// Detect device type
const detectDeviceType = () => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.match(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i)) {
    return 'Mobile';
  } else if (userAgent.match(/tablet|ipad/i)) {
    return 'Tablet';
  } else {
    return 'Desktop';
  }
};

// Check storage availability
const isStorageAvailable = (type) => {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return 'Available';
  } catch (e) {
    return 'Not Available';
  }
};

// Refresh system info
const refresh = () => {
  if (process.client) {
    // Update system info
    systemInfo.value = {
      browser: detectBrowser(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceType: detectDeviceType(),
      os: detectOS(),
      cookiesEnabled: navigator.cookieEnabled ? 'Enabled' : 'Disabled',
      localStorageAvailable: isStorageAvailable('localStorage'),
      sessionStorageAvailable: isStorageAvailable('sessionStorage'),
      time: new Date().toLocaleString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    // Update runtime config
    if (config.public) {
      runtimeConfig.value = { ...config.public };
    }
  }
};

// Initialize on mount
onMounted(() => {
  refresh();
});
</script> 