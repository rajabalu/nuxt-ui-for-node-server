/**
 * Playback worklet for TalkingHead library
 * 
 * This worklet handles audio streaming for the talking head animation.
 * It processes audio data and provides real-time playback capabilities.
 */

class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Audio buffer for streaming
    this.buffers = [];
    this.isPlaying = false;
    this.currentFrame = 0;
    this.startTime = 0;
    this.noMoreData = false;
    
    // Listen for messages from the main thread
    this.port.onmessage = (event) => {
      const data = event.data;
      
      if (data.type === 'audio-data') {
        // Add audio data to buffer
        this.buffers.push(new Float32Array(data.audio));
        
        // Start playing if not already playing
        if (!this.isPlaying) {
          this.isPlaying = true;
          this.startTime = currentTime;
          
          // Notify main thread that playback has started
          this.port.postMessage({ type: 'playback-started' });
        }
      } 
      else if (data.type === 'no-more-data') {
        this.noMoreData = true;
      }
    };
  }
  
  process(inputs, outputs, parameters) {
    const currentTime = globalThis.currentTime;
    
    // Get the output channel
    const output = outputs[0];
    const outputChannel = output[0];
    
    // If no data to play, just fill with silence and continue
    if (this.buffers.length === 0) {
      if (this.noMoreData && !this.isPlaying) {
        // All data processed and playback stopped
        this.port.postMessage({ type: 'playback-ended' });
        return false; // Stop processor
      }
      return true; // Continue processing
    }
    
    // Get the current buffer
    const currentBuffer = this.buffers[0];
    
    // Copy frames to output
    for (let i = 0; i < outputChannel.length; i++) {
      if (this.currentFrame < currentBuffer.length) {
        // Copy audio data
        outputChannel[i] = currentBuffer[this.currentFrame++];
      } else {
        // Move to next buffer
        this.buffers.shift();
        this.currentFrame = 0;
        
        // If no more buffers and no more data coming, mark as ended
        if (this.buffers.length === 0 && this.noMoreData) {
          this.isPlaying = false;
          this.port.postMessage({ type: 'playback-ended' });
          
          // Fill rest with silence
          while (i < outputChannel.length) {
            outputChannel[i++] = 0;
          }
          break;
        }
        
        // If there's another buffer, use it
        if (this.buffers.length > 0) {
          outputChannel[i] = this.buffers[0][this.currentFrame++];
        } else {
          // Otherwise fill with silence
          outputChannel[i] = 0;
        }
      }
    }
    
    // Copy to other channels (if any)
    for (let ch = 1; ch < output.length; ch++) {
      output[ch].set(outputChannel);
    }
    
    return true; // Continue processing
  }
}

// Register the processor with the name that matches what's expected in talkinghead.mjs
registerProcessor('playback-worklet', PlaybackProcessor);