// UI handler for Infinite Prairie Simulator
class UiHandler {
  constructor(gameState) {
    this.gameState = gameState;
    this.narrativeDisplay = document.getElementById('narrative-display');
    this.commandForm = document.getElementById('command-form');
    this.commandInput = document.getElementById('command-input');
    this.commandHistory = document.getElementById('command-history');
    this.apiKeyModal = document.getElementById('api-key-modal');
    this.apiKeyForm = document.getElementById('api-key-form');
    this.apiKeyInput = document.getElementById('api-key-input');
    this.apiProvider = document.getElementById('api-provider');
    this.audioButton = document.getElementById('audio-toggle');
    this.volumeSlider = document.getElementById('volume-slider');
    
    this.isWaitingForResponse = false;
    
    this.initEventListeners();
  }

  // Initialize event listeners
  initEventListeners() {
    // Command form submission
    this.commandForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCommand();
    });
    
    // API key form submission
    this.apiKeyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveApiKey();
    });
    
    // Audio button
    if (this.audioButton) {
      this.audioButton.addEventListener('click', () => {
        const isMuted = audioManager.toggleMute();
        this.updateAudioButtonIcon(isMuted);
      });
    }
    
    // Volume slider
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        audioManager.setVolume(volume);
      });
    }
  }
  
  // Update the audio button icon
  updateAudioButtonIcon(isMuted) {
    if (this.audioButton) {
      if (isMuted) {
        this.audioButton.innerHTML = '🔇';
        this.audioButton.title = 'Unmute';
      } else {
        this.audioButton.innerHTML = '🔊';
        this.audioButton.title = 'Mute';
      }
    }
  }

  // Display the API key modal
  showApiKeyModal() {
    this.apiKeyModal.style.display = 'block';
    this.apiKeyInput.focus();
  }

  // Hide the API key modal
  hideApiKeyModal() {
    this.apiKeyModal.style.display = 'none';
  }

  // Save the API key
  saveApiKey() {
    const key = this.apiKeyInput.value.trim();
    const provider = this.apiProvider.value;
    
    if (key) {
      apiHandler.setApiKey(key, provider);
      this.hideApiKeyModal();
      this.displayMessage('API key saved! The prairie awaits...');
    } else {
      this.displayMessage('Please enter a valid API key.');
    }
  }

  // Handle user command
  async handleCommand() {
    if (this.isWaitingForResponse) return;
    
    const command = this.commandInput.value.trim();
    if (!command) return;
    
    // Check if API key is configured
    if (!apiHandler.hasApiKey()) {
      this.showApiKeyModal();
      return;
    }
    
    // Play command submit sound
    audioManager.playSoundEffect('commandSubmit');
    
    this.addCommandToHistory(command);
    this.commandInput.value = '';
    this.isWaitingForResponse = true;
    
    // Add loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('loading');
    this.narrativeDisplay.appendChild(loadingElement);
    
    try {
      // Send the command to the API
      const responseText = await apiHandler.sendRequest(command, this.gameState);
      
      // Remove loading indicator
      this.narrativeDisplay.removeChild(loadingElement);
      
      // Process and display the response
      const responseData = apiHandler.parseResponse(responseText, command, this.gameState);
      
      // If this is the conclusion, display it differently
      if (responseData.isConclusion) {
        this.displayConclusion(command, responseData.narrativeText);
      } else {
        this.displayResponse(command, responseData.narrativeText);
      }
      
      // Update game state with the response
      this.gameState.addToHistory(command, responseData.narrativeText);
    } catch (error) {
      // Remove loading indicator
      if (loadingElement.parentNode) {
        this.narrativeDisplay.removeChild(loadingElement);
      }
      
      console.error('Error processing command:', error);
      this.displayMessage(`Error: ${error.message}. Please try again.`);
    } finally {
      this.isWaitingForResponse = false;
      this.commandInput.focus();
    }
  }

  // Add command to history display
  addCommandToHistory(command) {
    const commandElement = document.createElement('div');
    commandElement.classList.add('command');
    commandElement.textContent = `> ${command}`;
    this.commandHistory.appendChild(commandElement);
    this.commandHistory.scrollTop = this.commandHistory.scrollHeight;
  }

  // Display the response in the narrative display
  displayResponse(command, responseText) {
    // First add the user command to the narrative display
    if (command) {
      const commandElement = document.createElement('div');
      commandElement.classList.add('user-command');
      commandElement.textContent = `> ${command}`;
      this.narrativeDisplay.appendChild(commandElement);
    }
    
    // Then add the response
    const responseElement = document.createElement('div');
    responseElement.classList.add('command-response', 'new-content');
    
    // Format the response text, preserving paragraphs
    const formattedText = responseText
      .split('\n\n')
      .filter(para => para.trim() !== '')
      .map(para => `<p>${para}</p>`)
      .join('');
    
    responseElement.innerHTML = formattedText;
    this.narrativeDisplay.appendChild(responseElement);
    this.narrativeDisplay.scrollTop = this.narrativeDisplay.scrollHeight;
  }
  
  // Display the story conclusion with special formatting
  displayConclusion(command, responseText) {
    // First add the user command to the narrative display
    if (command) {
      const commandElement = document.createElement('div');
      commandElement.classList.add('user-command');
      commandElement.textContent = `> ${command}`;
      this.narrativeDisplay.appendChild(commandElement);
    }
    
    const conclusionElement = document.createElement('div');
    conclusionElement.classList.add('conclusion', 'new-content');
    
    // Clean up the text to properly display THE END
    let cleanText = responseText;
    
    // If the text contains "THE END", split and format it specially
    if (responseText.includes("THE END")) {
      const parts = responseText.split("THE END");
      
      // Format the main text
      const mainText = parts[0]
        .split('\n\n')
        .filter(para => para.trim() !== '')
        .map(para => `<p>${para}</p>`)
        .join('');
      
      // Format any epilogue text
      const epilogueText = parts[1] ? 
        parts[1]
          .split('\n\n')
          .filter(para => para.trim() !== '')
          .map(para => `<p class="epilogue">${para}</p>`)
          .join('') : '';
      
      // Combine with a stylized "THE END"
      conclusionElement.innerHTML = `
        ${mainText}
        <div class="the-end">THE END</div>
        ${epilogueText}
        <div class="restart-prompt">
          <p>Click "Whisper to the Wind" to begin a new journey</p>
        </div>
      `;
    } else {
      // If no "THE END" marker, just format normally but still add restart prompt
      const formattedText = responseText
        .split('\n\n')
        .filter(para => para.trim() !== '')
        .map(para => `<p>${para}</p>`)
        .join('');
      
      conclusionElement.innerHTML = `
        ${formattedText}
        <div class="restart-prompt">
          <p>Click "Whisper to the Wind" to begin a new journey</p>
        </div>
      `;
    }
    
    this.narrativeDisplay.appendChild(conclusionElement);
    this.narrativeDisplay.scrollTop = this.narrativeDisplay.scrollHeight;
    
    // Highlight the reset button to indicate it should be used
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
      resetButton.classList.add('highlighted');
      
      // Animate the button subtly to draw attention
      setTimeout(() => {
        resetButton.classList.add('pulse');
      }, 1000);
    }
    
    // Disable the input form since the story is complete
    this.commandInput.disabled = true;
    this.commandInput.placeholder = "Your journey has concluded...";
    this.commandForm.querySelector('button').disabled = true;
  }

  // Display a system message in the narrative display
  displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('system-message');
    messageElement.textContent = message;
    this.narrativeDisplay.appendChild(messageElement);
    this.narrativeDisplay.scrollTop = this.narrativeDisplay.scrollHeight;
  }


  // Initialize the UI with the current game state
  initializeUi() {
    // Display initial narrative
    if (this.gameState.narrativeHistory.length > 0) {
      // If there's saved narrative history, display the last response
      this.displayResponse('', this.gameState.narrativeHistory[this.gameState.narrativeHistory.length - 1]);
    } else {
      // Otherwise display the initial narrative
      this.displayResponse('', CONFIG.initialNarrative);
      this.gameState.addToHistory('', CONFIG.initialNarrative);
    }
    
    // Populate command history
    this.populateCommandHistory();
    
    
    // Check if API key is configured
    if (!apiHandler.hasApiKey()) {
      this.showApiKeyModal();
    }
    
    // Focus on command input
    this.commandInput.focus();
  }

  // Populate the command history display from game state
  populateCommandHistory() {
    this.commandHistory.innerHTML = '';
    
    const historyToShow = this.gameState.commandHistory.slice(-CONFIG.commandHistory.maxDisplayed);
    
    for (const turn of historyToShow) {
      if (turn.command) { // Skip the initial narrative
        const commandElement = document.createElement('div');
        commandElement.classList.add('command');
        commandElement.textContent = `> ${turn.command}`;
        this.commandHistory.appendChild(commandElement);
      }
    }
  }
}