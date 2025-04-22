<template>
    <div class="controls-container">
      <textarea
        v-model="textInput"
        rows="4"
        placeholder="Enter text for the avatar to speak..."
        :disabled="isSpeaking"
      ></textarea>
      <button @click="speak" :disabled="isSpeaking || !textInput.trim()">
        {{ isSpeaking ? 'Speaking...' : 'Speak' }}
      </button>
      <div v-if="status" class="status-message">{{ status }}</div>
      <div v-if="error" class="error-message">Error: {{ error }}</div>
    </div>
  </template>
  
  <script setup>
  import { ref, defineProps, defineEmits } from 'vue';
  
  const props = defineProps({
    isSpeaking: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      default: ''
    },
    error: {
      type: String,
      default: ''
    }
  });
  
  const emit = defineEmits(['speak']);
  
  const textInput = ref('');
  
  const speak = () => {
    if (textInput.value.trim() && !props.isSpeaking) {
      emit('speak', textInput.value);
    }
  };
  </script>
  
  <style scoped>
  .controls-container {
    padding: 15px;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
  }
  
  button {
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  button:hover:not(:disabled) {
    background-color: #0056b3;
  }
  
  .status-message {
    color: #333;
    font-style: italic;
  }
  
  .error-message {
    color: #dc3545;
    font-weight: bold;
  }
  </style>