// Procedural sound generation using Web Audio API

export class SoundGenerator {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  // Low humming sound for pulsing lock
  playLowHum(duration: number = 2.5) {
    const now = this.audioContext.currentTime;
    
    // Create oscillators for rich harmonic hum
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const osc3 = this.audioContext.createOscillator();
    
    // Low frequencies for deep hum
    osc1.frequency.setValueAtTime(60, now);
    osc2.frequency.setValueAtTime(90, now);
    osc3.frequency.setValueAtTime(120, now);
    
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc3.type = 'triangle';
    
    // Gain nodes for volume control
    const gain1 = this.audioContext.createGain();
    const gain2 = this.audioContext.createGain();
    const gain3 = this.audioContext.createGain();
    const masterGain = this.audioContext.createGain();
    
    // Pulsing effect
    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.5);
    gain1.gain.linearRampToValueAtTime(0.1, now + 1);
    gain1.gain.linearRampToValueAtTime(0.15, now + 1.5);
    gain1.gain.linearRampToValueAtTime(0.1, now + 2);
    gain1.gain.linearRampToValueAtTime(0.15, now + 2.5);
    
    gain2.gain.setValueAtTime(0.08, now);
    gain3.gain.setValueAtTime(0.05, now);
    
    masterGain.gain.setValueAtTime(0.3, now);
    masterGain.gain.linearRampToValueAtTime(0, now + duration);
    
    // Connect nodes
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    gain3.connect(masterGain);
    masterGain.connect(this.audioContext.destination);
    
    // Start and stop
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
    osc3.stop(now + duration);
  }

  // Explosion sound with bright flash
  playExplosion() {
    const now = this.audioContext.currentTime;
    const duration = 1.5;
    
    // White noise for explosion
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    // High pass filter for brightness
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(300, now);
    
    // Low frequency boom
    const boom = this.audioContext.createOscillator();
    boom.frequency.setValueAtTime(80, now);
    boom.frequency.exponentialRampToValueAtTime(20, now + 0.5);
    boom.type = 'sine';
    
    const boomGain = this.audioContext.createGain();
    boomGain.gain.setValueAtTime(0.4, now);
    boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    // Noise envelope
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const masterGain = this.audioContext.createGain();
    masterGain.gain.setValueAtTime(0.6, now);
    
    // Connect
    noise.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(masterGain);
    
    boom.connect(boomGain);
    boomGain.connect(masterGain);
    
    masterGain.connect(this.audioContext.destination);
    
    // Play
    noise.start(now);
    boom.start(now);
    noise.stop(now + duration);
    boom.stop(now + 0.8);
  }

  // Deep metallic clang for door opening
  playMetallicClang() {
    const now = this.audioContext.currentTime;
    const duration = 2.5;
    
    // Multiple oscillators for metallic harmonics
    const frequencies = [150, 220, 330, 440, 660, 880];
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    
    frequencies.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.1);
      osc.type = i % 2 === 0 ? 'square' : 'sawtooth';
      
      const volume = 0.15 / (i + 1); // Higher harmonics quieter
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      osc.connect(gain);
      oscillators.push(osc);
      gains.push(gain);
    });
    
    // Add low frequency rumble
    const rumble = this.audioContext.createOscillator();
    rumble.frequency.setValueAtTime(50, now);
    rumble.type = 'sine';
    
    const rumbleGain = this.audioContext.createGain();
    rumbleGain.gain.setValueAtTime(0.3, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    rumble.connect(rumbleGain);
    
    // Master gain and reverb effect
    const masterGain = this.audioContext.createGain();
    masterGain.gain.setValueAtTime(0.5, now);
    
    const convolver = this.audioContext.createConvolver();
    convolver.buffer = this.createReverbBuffer();
    
    // Connect everything
    gains.forEach(gain => gain.connect(masterGain));
    rumbleGain.connect(masterGain);
    masterGain.connect(convolver);
    convolver.connect(this.audioContext.destination);
    
    // Dry signal too
    masterGain.connect(this.audioContext.destination);
    
    // Start all
    oscillators.forEach(osc => {
      osc.start(now);
      osc.stop(now + duration);
    });
    rumble.start(now);
    rumble.stop(now + duration);
  }

  // Camera shutter click sound - realistic mechanical shutter
  playCameraShutter() {
    const now = this.audioContext.currentTime;
    
    // Create the characteristic "ka-chik" camera sound
    
    // First click - mirror slap (the "ka" part)
    const createMirrorSlap = (startTime: number) => {
      // Sharp transient noise burst
      const bufferSize = Math.floor(this.audioContext.sampleRate * 0.03);
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        // Exponential decay noise
        const envelope = Math.exp(-i / (bufferSize * 0.1));
        data[i] = (Math.random() * 2 - 1) * envelope;
      }
      
      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      
      // Bandpass filter for that metallic click quality
      const bandpass = this.audioContext.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(3000, startTime);
      bandpass.Q.setValueAtTime(2, startTime);
      
      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0.5, startTime);
      
      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.audioContext.destination);
      
      noise.start(startTime);
    };
    
    // Second click - shutter curtain (the "chik" part)
    const createShutterCurtain = (startTime: number) => {
      // Slightly longer, more resonant click
      const bufferSize = Math.floor(this.audioContext.sampleRate * 0.05);
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        // Two-stage decay for that distinctive "chik" sound
        const t = i / this.audioContext.sampleRate;
        const envelope = Math.exp(-t * 80) * 0.7 + Math.exp(-t * 30) * 0.3;
        data[i] = (Math.random() * 2 - 1) * envelope;
      }
      
      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      
      // Higher frequency bandpass for the crisp "chik"
      const bandpass = this.audioContext.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(4500, startTime);
      bandpass.Q.setValueAtTime(3, startTime);
      
      // Add a subtle resonant tone
      const tone = this.audioContext.createOscillator();
      tone.frequency.setValueAtTime(2200, startTime);
      tone.frequency.exponentialRampToValueAtTime(800, startTime + 0.04);
      tone.type = 'sine';
      
      const toneGain = this.audioContext.createGain();
      toneGain.gain.setValueAtTime(0.15, startTime);
      toneGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);
      
      const noiseGain = this.audioContext.createGain();
      noiseGain.gain.setValueAtTime(0.6, startTime);
      
      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(this.audioContext.destination);
      
      tone.connect(toneGain);
      toneGain.connect(this.audioContext.destination);
      
      noise.start(startTime);
      tone.start(startTime);
      tone.stop(startTime + 0.05);
    };
    
    // Mechanical body resonance
    const createBodyResonance = (startTime: number) => {
      const osc = this.audioContext.createOscillator();
      osc.frequency.setValueAtTime(180, startTime);
      osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.1);
      osc.type = 'sine';
      
      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.1);
    };
    
    // Execute the shutter sequence: "ka-chik"
    createMirrorSlap(now);
    createBodyResonance(now);
    createShutterCurtain(now + 0.06); // Brief delay for the "chik"
    createBodyResonance(now + 0.06);
  }

  // Create a simple reverb buffer
  private createReverbBuffer(): AudioBuffer {
    const rate = this.audioContext.sampleRate;
    const length = rate * 2; // 2 second reverb
    const buffer = this.audioContext.createBuffer(2, length, rate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    return buffer;
  }

  // Clean up
  close() {
    this.audioContext.close();
  }
}
