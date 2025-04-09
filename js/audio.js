// Audio manager for Infinite Prairie Simulator
class AudioManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.sounds = {};
    this.currentAmbience = null;
    this.isMuted = localStorage.getItem('infinitePrairie_audioMuted') === 'true';
    this.volume = parseFloat(localStorage.getItem('infinitePrairie_audioVolume') || '0.5');
    
    // Initialize audio elements
    this.initAudio();
    
    // Add visibility change handler to pause/resume audio
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
  }
  
  // Initialize audio elements
  initAudio() {
    // Main ambient background
    this.sounds.prairie = new Audio();
    this.sounds.prairie.src = 'audio/prairie_ambience.mp3';
    this.sounds.prairie.loop = true;
    this.sounds.prairie.volume = this.volume;
    
    // Additional ambient sounds
    this.sounds.wind = new Audio();
    this.sounds.wind.src = 'audio/wind.mp3';
    this.sounds.wind.loop = true;
    this.sounds.wind.volume = this.volume * 0.7;
    
    // UI sounds
    this.sounds.commandSubmit = new Audio();
    this.sounds.commandSubmit.src = 'audio/command_submit.mp3';
    this.sounds.commandSubmit.volume = this.volume * 0.5;
    
    this.sounds.reset = new Audio();
    this.sounds.reset.src = 'audio/reset.mp3';
    this.sounds.reset.volume = this.volume * 0.6;
    
    // Apply mute state
    if (this.isMuted) {
      this.muteAll();
    }
  }
  
  // Start playing main ambient sound
  startAmbience() {
    if (this.isMuted) return;
    
    // Don't try to autoplay - wait for user interaction instead
    console.log('Ambient audio ready - waiting for user interaction');
    
    // Setup one-time listener for user interaction to start audio
    if (!this._interactionListenerAdded) {
      this._interactionListenerAdded = true;
      const startAudio = () => {
        this.sounds.prairie.play().catch(e => {
          console.warn('Audio play failed:', e);
        });
        // Remove listeners after first interaction
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
      };
      
      document.addEventListener('click', startAudio);
      document.addEventListener('keydown', startAudio);
    }
  }
  
  // Play a one-shot sound effect
  playSoundEffect(name) {
    if (this.isMuted) return;
    
    if (this.sounds[name]) {
      // Reset sound to beginning if it's already playing
      this.sounds[name].currentTime = 0;
      this.sounds[name].play().catch(e => console.warn(`Couldn't play sound ${name}:`, e));
    }
  }
  
  // Update ambient sounds based on player location
  updateAmbientSound() {
    const locationKey = this.gameState.getLocationKey();
    
    // Simple algorithm: different ambient mix based on x,y coordinates
    const [x, y] = locationKey.split(',').map(Number);
    
    // Adjust wind volume based on location
    if (this.sounds.wind) {
      // More wind in higher y-coordinates
      const windVolume = Math.min(0.1 + Math.abs(y) * 0.1, 0.8) * this.volume;
      this.sounds.wind.volume = this.isMuted ? 0 : windVolume;
      
      if (!this.isMuted && windVolume > 0.2 && this.sounds.wind.paused) {
        this.sounds.wind.play().catch(e => console.warn('Wind sound autoplay prevented:', e));
      } else if (windVolume <= 0.2 && !this.sounds.wind.paused) {
        this.sounds.wind.pause();
      }
    }
  }
  
  // Pause all sounds
  pauseAll() {
    Object.values(this.sounds).forEach(sound => {
      if (!sound.paused) {
        sound.pause();
      }
    });
  }
  
  // Resume ambient sounds
  resumeAmbience() {
    if (this.isMuted) return;
    
    if (this.sounds.prairie && this.sounds.prairie.paused) {
      this.sounds.prairie.play().catch(e => console.warn('Prairie sound resume prevented:', e));
    }
    
    // Resume other ambient sounds based on current state
    this.updateAmbientSound();
  }
  
  // Mute/unmute all audio
  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('infinitePrairie_audioMuted', this.isMuted);
    
    if (this.isMuted) {
      this.muteAll();
    } else {
      this.unmuteAll();
    }
    
    return this.isMuted;
  }
  
  // Mute all sounds
  muteAll() {
    Object.values(this.sounds).forEach(sound => {
      sound.volume = 0;
    });
  }
  
  // Restore volume to all sounds
  unmuteAll() {
    this.sounds.prairie.volume = this.volume;
    this.sounds.wind.volume = this.volume * 0.7;
    this.sounds.commandSubmit.volume = this.volume * 0.5;
    this.sounds.reset.volume = this.volume * 0.6;
    
    // Start ambient sound if it's not playing
    if (this.sounds.prairie.paused) {
      this.startAmbience();
    }
    
    // Update location-based sounds
    this.updateAmbientSound();
  }
  
  // Set volume for all sounds
  setVolume(level) {
    this.volume = level;
    localStorage.setItem('infinitePrairie_audioVolume', level);
    
    if (!this.isMuted) {
      this.sounds.prairie.volume = level;
      this.sounds.wind.volume = level * 0.7;
      this.sounds.commandSubmit.volume = level * 0.5;
      this.sounds.reset.volume = level * 0.6;
    }
  }
  
  // Handle visibility changes (pause sounds when tab is inactive)
  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.resumeAmbience();
    } else {
      this.pauseAll();
    }
  }
  
  // Clean up audio resources
  cleanup() {
    this.pauseAll();
    Object.keys(this.sounds).forEach(key => {
      this.sounds[key].src = '';
    });
    this.sounds = {};
  }
}