import { ref } from 'vue';

export function useCache() {
  const cache = ref(new Map());
  
  // Get a value from cache
  const get = (key) => {
    if (!cache.value.has(key)) return null;
    
    const item = cache.value.get(key);
    
    // Check if expired
    if (item.expiry && item.expiry < Date.now()) {
      cache.value.delete(key);
      return null;
    }
    
    return item.value;
  };
  
  // Set a value in cache with optional expiry time
  const set = (key, value, ttl = 0) => {
    const item = {
      value,
      expiry: ttl > 0 ? Date.now() + ttl : null
    };
    
    cache.value.set(key, item);
  };
  
  // Remove a value from cache
  const remove = (key) => {
    cache.value.delete(key);
  };
  
  // Clear all cache or items matching a prefix
  const clear = (prefix = '') => {
    if (!prefix) {
      cache.value.clear();
      return;
    }
    
    // Clear items with matching prefix
    for (const key of cache.value.keys()) {
      if (key.startsWith(prefix)) {
        cache.value.delete(key);
      }
    }
  };
  
  // Check if a key exists in cache and is not expired
  const has = (key) => {
    if (!cache.value.has(key)) return false;
    
    const item = cache.value.get(key);
    
    // Check if expired
    if (item.expiry && item.expiry < Date.now()) {
      cache.value.delete(key);
      return false;
    }
    
    return true;
  };
  
  // Get all cache keys
  const keys = () => {
    return Array.from(cache.value.keys());
  };
  
  return {
    get,
    set,
    remove,
    clear,
    has,
    keys
  };
} 