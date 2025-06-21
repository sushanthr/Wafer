# Wafer - Writing Assistance For EveRyone

Wafer is a Chrome / Edge extension that provides AI-powered writing assistance using Chrome / Edge's built-in Prompt API. It allows you to rewrite any selected text on web pages with different tones, lengths, and formats.

## Features

- **Right-click Integration**: Select text on any webpage and right-click to access Wafer
- **Multiple Rewriting Options**: 
  - Tones: Professional, Casual, Friendly, Formal, Creative
  - Length: Shorter, Same, Longer
  - Format: Plain text or Markdown
- **Custom Instructions**: Add specific instructions for how you want text rewritten
- **Version History**: Keep track of previous versions and iterate on them
- **Custom Tones**: Create and save your own custom tone prompts
- **Streaming Responses**: See text being generated in real-time
- **Modern UI**: Clean, responsive interface in the side panel

## Requirements

- Chrome / Edge browser with built-in AI support (Chrome 127+ / Edge Canary 134+ with appropriate flags enabled)
- The Prompt API feature must be enabled in Chrome / Edge

## Installation

1. Clone or download this repository
2. Open Chrome / Edge and navigate to `Chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the Wafer directory
5. The extension should now appear in your extensions list

## Usage

### Basic Usage
1. Select any text on a webpage
2. Right-click and choose "Rewrite with Wafer"
3. The side panel will open with your selected text pre-populated
4. Choose your desired tone, length, and format options
5. Click "Rewrite Text" to generate a new version

### Advanced Features
- **Custom Instructions**: Add specific requirements in the custom instructions field
- **Version History**: Access previous versions from the history section
- **Custom Tones**: Go to Settings to create custom tone prompts
- **Regenerate**: Use the regenerate button to create a new version with the same settings

## Chrome / Edge Prompt API Setup

To use this extension, you need Chrome / Edge with the Prompt API enabled:

1. Use Chrome / Edge Canary (version 127 or later)
2. Enable the following flags in `Chrome://flags/`:
   - `#prompt-api-for-gemini-nano` or '#edge-llm-prompt-api-for-phi-mini'
   - `#optimization-guide-on-device-model`
3. Restart Chrome / Edge
4. The first time you use the extension, it may need to download the language model

## Development

The extension consists of:
- `manifest.json` - Extension configuration
- `background.js` - Service worker for context menu and messaging
- `content.js` - Content script for text selection
- `sidepanel.html/js` - Main UI and functionality
- `styles.css` - Modern styling

## Privacy

All text processing happens locally on your device using Chrome / Edge's built-in language model. No data is sent to external servers.

## License

MIT License - feel free to modify and distribute as needed.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
