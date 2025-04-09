// API handler for Infinite Prairie Simulator
class ApiHandler {
  constructor() {
    this.apiKey = localStorage.getItem(CONFIG.storageKeys.apiKey) || '';
    this.apiProvider = localStorage.getItem(CONFIG.storageKeys.apiProvider) || 'openai';
  }

  // Set API key and provider
  setApiKey(key, provider) {
    this.apiKey = key;
    this.apiProvider = provider;
    localStorage.setItem(CONFIG.storageKeys.apiKey, key);
    localStorage.setItem(CONFIG.storageKeys.apiProvider, provider);
  }

  // Check if API key is configured
  hasApiKey() {
    return this.apiKey !== '';
  }

  // Get API provider settings
  getApiSettings() {
    return CONFIG.api[this.apiProvider];
  }

  // Create the messages array for the API request
  async createMessages(userCommand, gameState) {
    const context = gameState.getContextForPrompt();
    const recentHistory = gameState.commandHistory.slice(-5).map(h => 
      `User: ${h.command}\nPrairie: ${h.response}`
    ).join('\n\n');
    
    // Format inventory for the prompt
    const inventoryText = context.inventory.length > 0 
      ? context.inventory.map(item => `- ${item.name}: ${item.description}`).join('\n')
      : 'No items';
    
    // Create the user message with context
    const userMessage = `
Current location: x=${context.playerLocation.x}, y=${context.playerLocation.y}
Turn count: ${context.turnCount}
Inventory:\n${inventoryText}

Recent history:
${recentHistory}

Player command: ${userCommand}
`;
    
    if (this.apiProvider === 'openai') {
      return [
        { role: 'system', content: CONFIG.systemPrompt },
        { role: 'user', content: userMessage }
      ];
    } else if (this.apiProvider === 'anthropic') {
      return {
        system: CONFIG.systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ]
      };
    }
  }

  // Send the API request
  async sendRequest(userCommand, gameState) {
    if (!this.hasApiKey()) {
      throw new Error('API key not configured');
    }
    
    const apiSettings = this.getApiSettings();
    let response;
    
    try {
      if (this.apiProvider === 'openai') {
        const messages = await this.createMessages(userCommand, gameState);
        response = await this.sendOpenAIRequest(messages, apiSettings);
      } else if (this.apiProvider === 'anthropic') {
        const { system, messages } = await this.createMessages(userCommand, gameState);
        response = await this.sendAnthropicRequest(system, messages, apiSettings);
      } else {
        throw new Error('Unsupported API provider');
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Send request to OpenAI API
  async sendOpenAIRequest(messages, apiSettings) {
    const response = await fetch(apiSettings.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: apiSettings.model,
        messages: messages,
        max_tokens: apiSettings.maxTokens,
        temperature: apiSettings.temperature,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  // Send request to Anthropic API
  async sendAnthropicRequest(system, messages, apiSettings) {
    const response = await fetch(apiSettings.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: apiSettings.model,
        system: system,
        messages: messages,
        max_tokens: apiSettings.maxTokens,
        temperature: apiSettings.temperature,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  // Parse the AI response to extract game updates
  parseResponse(response, userCommand, gameState) {
    // Parse the response to detect inventory changes
    this.updateGameStateFromResponse(response, userCommand, gameState);
    
    // Check if the story has reached its conclusion
    const hasReachedConclusion = this.checkForConclusion(response);
    
    return {
      narrativeText: response,
      isConclusion: hasReachedConclusion
    };
  }
  
  // Check if the response indicates that the story has concluded
  checkForConclusion(response) {
    const lowerResponse = response.toLowerCase();
    
    // Check for explicit conclusion markers
    if (response.includes("THE END")) {
      return true;
    }
    
    // Check for the most explicit phrases that should trigger the conclusion
    if (lowerResponse.includes("whisper to the wind to begin a new journey")) {
      return true;
    }
    
    // Check for phrases about journey concluding/ending
    if (lowerResponse.includes("your journey has concluded") || 
        lowerResponse.includes("your journey has ended")) {
      return true;
    }
    
    // Don't trigger conclusion just because both "end" and "journey" appear somewhere in text
    // Check for specific combined patterns instead
    if ((lowerResponse.includes("end of your journey") || 
         lowerResponse.includes("journey ends") || 
         lowerResponse.includes("journey has come to an end"))) {
      return true;
    }
    
    // Don't conclude for other cases
    return false;
  }
  
  // Analyze the response and update game state accordingly
  updateGameStateFromResponse(response, userCommand, gameState) {
    const lowerCommand = userCommand.toLowerCase().trim();
    const lowerResponse = response.toLowerCase();
    
    // Check for item pickup
    if (
      (lowerCommand.includes('take') || 
       lowerCommand.includes('pick up') || 
       lowerCommand.includes('grab') || 
       lowerCommand.includes('collect')) &&
      (lowerResponse.includes('you pick up') || 
       lowerResponse.includes('you take') || 
       lowerResponse.includes('you add') || 
       lowerResponse.includes('added to your inventory') ||
       lowerResponse.includes('to your inventory') ||
       lowerResponse.includes('you now have') ||
       lowerResponse.includes('you obtain') ||
       lowerResponse.includes('you acquire'))
    ) {
      // Try to extract the item name from the command
      let itemName = lowerCommand.replace(/take|pick up|grab|collect/gi, '').trim();
      
      // If the item name contains "the", remove it
      itemName = itemName.replace(/^the\s+/i, '');
      
      // If we have a valid item name, add it to inventory
      if (itemName && itemName.length > 0) {
        // Extract a proper description from the response if possible
        const sentenceWithItem = response.split('.').find(s => 
          s.toLowerCase().includes(itemName) && 
          (s.toLowerCase().includes('pick up') || 
           s.toLowerCase().includes('take') || 
           s.toLowerCase().includes('added') || 
           s.toLowerCase().includes('obtain') ||
           s.toLowerCase().includes('acquire'))
        ) || '';
        
        // Create a simple description based on the response
        let itemDescription = 'A mysterious item from the prairie.';
        if (sentenceWithItem) {
          // Try to extract a description if one is given
          const descriptionMatch = sentenceWithItem.match(/is (.*?)\./i) || 
                                  sentenceWithItem.match(/a (.*?)\./i);
          if (descriptionMatch && descriptionMatch[1]) {
            itemDescription = descriptionMatch[1];
          }
        }
        
        // Format the item name with proper capitalization
        const formattedItemName = itemName.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Create and add the item to inventory
        const newItem = {
          id: `item_${Date.now()}`,
          name: formattedItemName,
          description: itemDescription
        };
        
        gameState.addItem(newItem);
      }
    }
    
    // Check for direction movement
    const directionMatches = lowerCommand.match(/go\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
    if (directionMatches && directionMatches[1] && 
        !lowerResponse.includes("can't go") && 
        !lowerResponse.includes("cannot go") && 
        !lowerResponse.includes("unable to go")) {
      const direction = directionMatches[1].toLowerCase();
      gameState.movePlayer(direction);
    }
    
    // Check for dropping items
    if (lowerCommand.includes('drop') && 
        (lowerResponse.includes('you drop') || lowerResponse.includes('you set down'))) {
      // Extract item name from command
      const itemName = lowerCommand.replace(/drop/gi, '').replace(/^the\s+/i, '').trim();
      
      // Find the item in inventory
      const inventoryItem = gameState.inventory.find(item => 
        item.name.toLowerCase() === itemName || 
        itemName.includes(item.name.toLowerCase())
      );
      
      // If found, remove it
      if (inventoryItem) {
        gameState.removeItem(inventoryItem.id);
      }
    }
  }
}