/**
* Audio Worklet for playback of streaming audio.
* This worklet manages the buffering and playback of audio chunks in real-time.
*/
class PlaybackProcessor extends AudioWorkletProcessor {
  
  constructor() {
    super();
    
    // Audio buffer for incoming audio chunks
    this.buffer = [];
    this.bufferSize = 0;
    
    // Playback state
    this.isPlaying = false;
    this.position = 0;
    this.minBufferSize = 2048; // Start playing when we have enough data
    
    // Reset state when needed
    this.pendingReset = false;
    
    // Handle messages from the main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'audio-data') {
        // Add new audio data to the buffer
        if (event.data.audio && event.data.audio.length > 0) {
          this.buffer.push(event.data.audio);
          this.bufferSize += event.data.audio.length;
          
          // Start playback if we have enough data and aren't playing yet
          if (!this.isPlaying && this.bufferSize >= this.minBufferSize) {
            this.isPlaying = true;
            this.port.postMessage({ type: 'playback-started' });
          }
        }
      } else if (event.data.type === 'reset') {
        // Reset the playback state
        this.resetPlayback();
      }
    };
  }
  
  resetPlayback() {
    // Clear the buffer and reset playback state
    this.buffer = [];
    this.bufferSize = 0;
    this.isPlaying = false;
    this.position = 0;
    this.pendingReset = false;
    console.log("Playback worklet reset");
  }
  
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channel = output[0];
    
    // If we're not playing or don't have enough data, output silence
    if (!this.isPlaying || this.bufferSize < 128) {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = 0;
      }
      
      // Check if we should stop playing due to buffer depletion
      if (this.isPlaying && this.bufferSize === 0) {
        this.isPlaying = false;
        this.port.postMessage({ type: 'playback-ended' });
      }
      
      return true;
    }
    
    // Process the audio buffer to fill the output
    let samplesNeeded = channel.length;
    let outputPosition = 0;
    
    while (samplesNeeded > 0 && this.buffer.length > 0) {
      const currentBuffer = this.buffer[0];
      const availableSamples = currentBuffer.length - this.position;
      
      // Calculate how many samples to copy
      const samplesToCopy = Math.min(availableSamples, samplesNeeded);
      
      // Copy samples from the buffer to the output
      for (let i = 0; i < samplesToCopy; i++) {
        channel[outputPosition++] = currentBuffer[this.position++];
      }
      
      // Update counters
      samplesNeeded -= samplesToCopy;
      
      // If we've finished with the current buffer chunk, move to the next one
      if (this.position >= currentBuffer.length) {
        this.buffer.shift();
        this.position = 0;
      }
      
      // Update buffer size
      this.bufferSize -= samplesToCopy;
    }
    
    // If we couldn't fill the entire output, fill the rest with silence
    while (outputPosition < channel.length) {
      channel[outputPosition++] = 0;
    }
    
    // Check if we've depleted our buffer and should stop playing
    if (this.buffer.length === 0) {
      // If we've run out of data, signal playback ended
      if (this.isPlaying && this.bufferSize === 0) {
        this.isPlaying = false;
        this.port.postMessage({ type: 'playback-ended' });
      }
    }
    
    // Don't terminate the processor
    return true;
  }
}

// Register the processor
registerProcessor('playback-worklet', PlaybackProcessor);