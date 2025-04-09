// Main application for Infinite Prairie Simulator
let gameState;
let apiHandler;
let uiHandler;
let audioManager; // Add audio manager

// Initialize the application
function initialize() {
  console.log('Initializing Infinite Prairie Simulator...');
  
  // Create instances of the main classes
  gameState = new GameState();
  apiHandler = new ApiHandler();
  uiHandler = new UiHandler(gameState);
  audioManager = new AudioManager(gameState); // Initialize audio manager
  
  // Initialize the UI
  uiHandler.initializeUi();
  
  // Start ambient audio
  audioManager.startAmbience();
  
  // Add reset button functionality
  const resetButton = document.getElementById('reset-button');
  if (resetButton) {
    resetButton.addEventListener('click', resetSimulation);
  }
  
  console.log('Initialization complete.');
}

// Reset the simulation but keep the API key
function resetSimulation() {
  // Create confirmation dialog
  if (confirm('The prairie will fade away like morning mist, memories scattered to the wind. Are you sure you want to begin anew?')) {
    // Play reset sound
    audioManager.playSoundEffect('reset');
    
    // Save the current API key and provider
    const apiKey = apiHandler.apiKey;
    const apiProvider = apiHandler.apiProvider;
    
    // Reset the game state
    gameState.resetState();
    
    // Restore the API key and provider
    apiHandler.setApiKey(apiKey, apiProvider);
    
    // Add a poetic transition message
    const transitionMessage = "The horizon shimmers and dissolves. The grasses bend and whisper secrets of rebirth. The prairie forgets you, so that you may discover it anew.";
    
    // Reset the UI
    uiHandler.narrativeDisplay.innerHTML = '';
    uiHandler.commandHistory.innerHTML = '';
    
    // Re-enable input if it was disabled after conclusion
    uiHandler.commandInput.disabled = false;
    uiHandler.commandInput.placeholder = "What will you do?";
    uiHandler.commandForm.querySelector('button').disabled = false;
    
    // Remove highlighting from reset button
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
      resetButton.classList.remove('highlighted', 'pulse');
    }
    
    // Display the transition message and then reinitialize
    uiHandler.displayMessage(transitionMessage);
    
    // Wait for dramatic effect, then reinitialize
    setTimeout(() => {
      uiHandler.initializeUi();
    }, 3000);
  }
}

// Add an event listener for when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize);

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Focus command input when pressing forward slash
  if (e.key === '/' && document.activeElement !== uiHandler.commandInput) {
    e.preventDefault();
    uiHandler.commandInput.focus();
  }
  
  // Clear command input with Escape
  if (e.key === 'Escape' && document.activeElement === uiHandler.commandInput) {
    uiHandler.commandInput.value = '';
  }
  
  // Direction shortcuts (when focused on input)
  if (document.activeElement === uiHandler.commandInput) {
    const directionMap = {
      'ArrowUp': 'north',
      'ArrowDown': 'south',
      'ArrowRight': 'east',
      'ArrowLeft': 'west'
    };
    
    if (directionMap[e.key] && e.altKey) {
      e.preventDefault();
      uiHandler.commandInput.value = `go ${directionMap[e.key]}`;
      uiHandler.commandForm.dispatchEvent(new Event('submit'));
    }
  }
});

// Handle visibility changes (stop/resume background processes)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('Resuming Infinite Prairie Simulator...');
  } else {
    console.log('Infinite Prairie Simulator minimized...');
  }
});

// Add error handling
window.addEventListener('error', (e) => {
  console.error('Application error:', e.error);
  
  // Notify the user about the error
  if (uiHandler) {
    uiHandler.displayMessage(`An error occurred: ${e.error.message}. Please refresh the page if the application becomes unstable.`);
  }
});

// Handle beforeunload event
window.addEventListener('beforeunload', () => {
  // Save game state before unloading
  if (gameState) {
    gameState.saveState();
  }
});

// Add debugging commands (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.__debugGameState = () => console.log(gameState);
  window.__resetGame = () => {
    gameState.resetState();
    window.location.reload();
  };
  console.log('Debug commands available: __debugGameState(), __resetGame()');
}