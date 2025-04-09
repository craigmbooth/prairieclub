// Game state management for Infinite Prairie Simulator
class GameState {
  constructor() {
    this.playerLocation = { x: 0, y: 0 }; // Starting coordinates
    this.inventory = [];               // Player's inventory
    this.commandHistory = [];          // History of commands and responses
    this.narrativeHistory = [];        // History of narrative texts
    this.turnCount = 0;                // Number of turns taken
    this.locationDescriptions = {};    // Cache of location descriptions by coordinates
    this.discoveredItems = new Set();  // Set of discovered item IDs
    this.events = new Set();           // Set of triggered event IDs
    
    // Load saved state if available
    this.loadState();
  }

  // Add a command and its response to history
  addToHistory(command, response) {
    const turn = {
      id: this.turnCount++,
      timestamp: Date.now(),
      command: command,
      response: response,
      location: {...this.playerLocation}
    };
    
    this.commandHistory.push(turn);
    this.narrativeHistory.push(response);
    
    // Trim history if it exceeds the max stored count
    if (this.commandHistory.length > CONFIG.commandHistory.maxStored) {
      this.commandHistory.shift();
    }
    if (this.narrativeHistory.length > CONFIG.commandHistory.maxStored) {
      this.narrativeHistory.shift();
    }
    
    // Save state after each command
    this.saveState();
    
    return turn;
  }

  // Add an item to inventory
  addItem(item) {
    if (!this.hasItem(item.id)) {
      this.inventory.push(item);
      this.discoveredItems.add(item.id);
      this.saveState();
      return true;
    }
    return false;
  }

  // Remove an item from inventory
  removeItem(itemId) {
    const index = this.inventory.findIndex(item => item.id === itemId);
    if (index !== -1) {
      const item = this.inventory[index];
      this.inventory.splice(index, 1);
      this.saveState();
      return item;
    }
    return null;
  }

  // Check if player has an item
  hasItem(itemId) {
    return this.inventory.some(item => item.id === itemId);
  }

  // Update player location
  movePlayer(direction) {
    // Translate direction to coordinate change
    const directionMap = {
      'north': { x: 0, y: 1 },
      'south': { x: 0, y: -1 },
      'east': { x: 1, y: 0 },
      'west': { x: -1, y: 0 },
      'northeast': { x: 1, y: 1 },
      'northwest': { x: -1, y: 1 },
      'southeast': { x: 1, y: -1 },
      'southwest': { x: -1, y: -1 },
    };
    
    if (directionMap[direction]) {
      this.playerLocation.x += directionMap[direction].x;
      this.playerLocation.y += directionMap[direction].y;
      this.saveState();
      return true;
    }
    return false;
  }

  // Get location key for caching
  getLocationKey() {
    return `${this.playerLocation.x},${this.playerLocation.y}`;
  }

  // Cache a location description
  cacheLocationDescription(description) {
    const key = this.getLocationKey();
    this.locationDescriptions[key] = description;
  }

  // Get cached location description
  getCachedLocationDescription() {
    const key = this.getLocationKey();
    return this.locationDescriptions[key] || null;
  }

  // Record an event
  recordEvent(eventId) {
    this.events.add(eventId);
    this.saveState();
  }

  // Check if an event has occurred
  hasEventOccurred(eventId) {
    return this.events.has(eventId);
  }

  // Create a context object for the AI prompt
  getContextForPrompt() {
    return {
      playerLocation: this.playerLocation,
      inventory: this.inventory,
      turnCount: this.turnCount,
      recentCommands: this.commandHistory.slice(-10).map(turn => ({
        command: turn.command,
        response: turn.response
      })),
      discoveredItems: Array.from(this.discoveredItems),
      events: Array.from(this.events)
    };
  }

  // Save game state to local storage
  saveState() {
    const state = {
      playerLocation: this.playerLocation,
      inventory: this.inventory,
      commandHistory: this.commandHistory.slice(-20), // Only save recent history
      narrativeHistory: this.narrativeHistory.slice(-20),
      turnCount: this.turnCount,
      locationDescriptions: this.locationDescriptions,
      discoveredItems: Array.from(this.discoveredItems),
      events: Array.from(this.events)
    };
    
    localStorage.setItem(CONFIG.storageKeys.gameState, JSON.stringify(state));
  }

  // Load game state from local storage
  loadState() {
    const savedState = localStorage.getItem(CONFIG.storageKeys.gameState);
    
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        
        this.playerLocation = state.playerLocation || { x: 0, y: 0 };
        this.inventory = state.inventory || [];
        this.commandHistory = state.commandHistory || [];
        this.narrativeHistory = state.narrativeHistory || [];
        this.turnCount = state.turnCount || 0;
        this.locationDescriptions = state.locationDescriptions || {};
        
        // Convert arrays back to sets
        this.discoveredItems = new Set(state.discoveredItems || []);
        this.events = new Set(state.events || []);
        
        return true;
      } catch (e) {
        console.error('Failed to load game state:', e);
        return false;
      }
    }
    
    return false;
  }

  // Reset the game state
  resetState() {
    this.playerLocation = { x: 0, y: 0 };
    this.inventory = [];
    this.commandHistory = [];
    this.narrativeHistory = [];
    this.turnCount = 0;
    this.locationDescriptions = {};
    this.discoveredItems = new Set();
    this.events = new Set();
    
    localStorage.removeItem(CONFIG.storageKeys.gameState);
  }
}