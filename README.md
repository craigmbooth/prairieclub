# A Map Without Edges

A surreal, infinite prairie exploration experience as a text adventure. Navigate the prairie via simple text commands, with responses generated dynamically by GPT.

## 🌾 Overview

"A Map Without Edges" is a browser-based text adventure set in a surreal, infinite prairie landscape. The player navigates the prairie using simple text commands (north, east, pick up, use, etc.). Behind the scenes, a language model (GPT) generates the responses and game logic dynamically.

## 📚 Features

- **Text Adventure UI**: Simple, atmospheric interface with command input, narrative display, command history, and inventory.
- **Command Handling**: User input is sent to GPT with the full command history and inventory.
- **Persistent Prairie**: The prairie is infinite and procedurally described by GPT.
- **Items & Interaction**: Players can find, collect, and use items throughout the prairie.
- **Local Storage**: Game state is saved to the browser's local storage.

## 🎮 How to Play

1. Enter your API key (OpenAI or Anthropic) when prompted.
2. Type commands in the input box at the bottom of the screen.
3. Press Enter or click the arrow button to submit your command.
4. Read the response in the narrative display.
5. Your inventory will update automatically when you pick up or drop items.

### Common Commands

- `go north/south/east/west` - Move in a direction
- `look` - Examine your surroundings
- `examine [object]` - Look closely at something
- `take/pick up [item]` - Add an item to your inventory
- `drop [item]` - Remove an item from your inventory
- `use [item]` - Use an item from your inventory
- `inventory` - List items you are carrying

## 🚀 Deployment

### GitHub Pages

1. Create a new GitHub repository.
2. Push this code to the repository.
3. Go to Settings > Pages.
4. Select the branch you want to deploy from (usually `main`).
5. Click Save and wait for the deployment to complete.

### Local Development

1. Clone the repository.
2. Open the project folder.
3. Start a local server (e.g., using Python's `http.server` or VS Code's Live Server extension).
4. Open the browser and navigate to the local server address.

## ⚙️ Configuration

### API Keys

The simulator requires an API key from either OpenAI or Anthropic to function. The key is stored only in your browser's local storage and is never sent to any server other than the API provider's.

To set up your API key:
1. Obtain an API key from [OpenAI](https://platform.openai.com/) or [Anthropic](https://www.anthropic.com/).
2. Enter the key when prompted upon starting the simulator.
3. Select the appropriate API provider.

### Customization

The game's behavior can be customized by modifying the `config.js` file:

- `initialNarrative`: The starting text displayed to the player.
- `systemPrompt`: The prompt that defines how the language model behaves.
- API settings: Model selection, temperature, max tokens, etc.

## 🧩 Project Structure

- `index.html` - Main HTML file.
- `css/style.css` - Stylesheet with "prairiewave" aesthetics.
- `js/config.js` - Configuration settings.
- `js/gameState.js` - Game state management.
- `js/api.js` - API handler for communication with language models.
- `js/ui.js` - UI handler for the interface.
- `js/main.js` - Main application initialization.

## 🔮 Future Extensions

- Custom prairie themes
- Persistent world features
- Multiple region types
- Quest system
- Time and weather cycles
- Sound effects and ambient audio

## 📜 License

MIT License. See LICENSE file for details.

## 🌟 Credits

Created as a browser-based text adventure experiment.

---

Enter the prairie. The horizon awaits.