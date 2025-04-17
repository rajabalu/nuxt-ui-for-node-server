import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'

export const useVoiceToText = () => {
  const { locale } = useI18n()
  
  // State
  const isListening = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('')
  const error = ref(null)
  const recognition = ref(null)
  const isSupported = ref(false)
  const languageOptions = reactive({
    'en': 'English',
    'fr': 'French',
    'ar': 'Arabic',
    // Add more languages as needed based on i18n/locales
  })
  
  // Selected language (default to current i18n locale)
  const selectedLanguage = ref(locale.value || 'en')
  
  // Check for browser support
  const initializeSpeechRecognition = () => {
    if (process.client) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognition.value = new SpeechRecognition()
        isSupported.value = true
        
        // Configure recognition
        recognition.value.continuous = true
        recognition.value.interimResults = true
        recognition.value.lang = selectedLanguage.value
        
        // Set up event handlers
        recognition.value.onstart = () => {
          isListening.value = true
          error.value = null
        }
        
        recognition.value.onend = () => {
          isListening.value = false;
          // Finalize the transcript to ensure no data is lost
          if (interimTranscript.value.trim()) {
            transcript.value += ' ' + interimTranscript.value.trim();
            transcript.value = transcript.value.trim();
            interimTranscript.value = '';
          }
        }
        
        recognition.value.onresult = (event) => {
          let finalTranscript = ''
          let currentInterim = ''
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript
            } else {
              currentInterim += result[0].transcript
            }
          }
          
          if (finalTranscript) {
            transcript.value += ' ' + finalTranscript
            transcript.value = transcript.value.trim()
          }
          interimTranscript.value = currentInterim
        }
        
        recognition.value.onerror = (event) => {
          error.value = event.error
          isListening.value = false
        }
      }
    }
  }
  
  // Start listening
  const startListening = () => {
    if (!recognition.value) {
      initializeSpeechRecognition()
    }
    
    if (recognition.value) {
      try {
        // Make sure we're not already listening
        if (isListening.value) {
          recognition.value.stop()
        }
        
        // Reset transcript before starting a new session
        transcript.value = ''
        interimTranscript.value = ''
        
        // Update language based on current selection
        recognition.value.lang = selectedLanguage.value
        
        // Small delay to ensure any previous session is properly cleaned up
        setTimeout(() => {
          recognition.value.start()
        }, 100)
      } catch (err) {
        error.value = 'Failed to start speech recognition'
        console.error('Speech recognition error:', err)
      }
    } else {
      error.value = 'Speech recognition not supported in this browser'
    }
  }
  
  // Stop listening
  const stopListening = () => {
    if (recognition.value && isListening.value) {
      recognition.value.stop()
    }
  }
  
  // Change recognition language
  const setLanguage = (lang) => {
    selectedLanguage.value = lang
    if (recognition.value) {
      recognition.value.lang = lang
    }
  }
  
  // Reset transcript
  const resetTranscript = () => {
    transcript.value = ''
    interimTranscript.value = ''
  }

  // Computed properties
  const fullTranscript = computed(() => {
    return transcript.value + ' ' + interimTranscript.value
  })

  // Function to integrate with external speech recognition API like Whisper
  const useExternalRecognition = async (audioBlob, apiEndpoint, apiKey) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('language', selectedLanguage.value)
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }
      
      const data = await response.json()
      transcript.value = data.text
      return data
    } catch (err) {
      error.value = 'External speech recognition failed'
      console.error('External speech recognition error:', err)
      return null
    }
  }

  // Record audio for external API
  const recordAudio = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        error.value = 'Media recording not supported in this browser'
        reject(new Error('Media recording not supported'))
        return
      }

      const chunks = []
      let mediaRecorder = null
      
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorder = new MediaRecorder(stream)
          
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data)
            }
          }
          
          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' })
            stream.getTracks().forEach(track => track.stop())
            resolve(audioBlob)
          }
          
          mediaRecorder.onerror = (err) => {
            error.value = 'Error recording audio'
            reject(err)
          }
          
          mediaRecorder.start()
          isListening.value = true
          
          // Automatically stop after 30 seconds to prevent very large files
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop()
            }
          }, 30000)
          
          return mediaRecorder
        })
        .catch(err => {
          error.value = 'Failed to access microphone'
          reject(err)
        })
        
      return {
        stop: () => {
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop()
            isListening.value = false
          }
        }
      }
    })
  }

  // Whisper-like advanced transcription
  const startWhisperLikeTranscription = async (apiEndpoint, apiKey) => {
    try {
      const recorder = await recordAudio()
      
      // Return method to stop recording and get transcript
      return {
        stop: async () => {
          const audioBlob = await new Promise((resolve) => {
            recorder.stop()
            recorder.ondataavailable = (e) => {
              resolve(e.data)
            }
          })
          
          return useExternalRecognition(audioBlob, apiEndpoint, apiKey)
        }
      }
    } catch (err) {
      error.value = 'Failed to start Whisper-like transcription'
      console.error('Whisper-like transcription error:', err)
      return null
    }
  }

  // Initialize browser recognition on client-side only
  if (process.client) {
    initializeSpeechRecognition()
  }
  
  return {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript,
    error,
    isSupported,
    languageOptions,
    selectedLanguage,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage,
    // Advanced features for Whisper-like capabilities
    recordAudio,
    useExternalRecognition,
    startWhisperLikeTranscription
  }
}