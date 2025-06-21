# WAFER - Writing Assistance For EveRyone

Wafer is a Chrome / Edge extension that provides AI-powered writing assistance using Chrome / Edge's built-in Prompt API. 
It allows you to rewrite any selected text on web pages or write from scratch with different tones, lengths, and formats.

<img width="1075" alt="image" src="https://github.com/user-attachments/assets/046fef30-c1ab-4e02-89e3-c6a99a27d9b2" />

## Requirements

- Chrome / Edge browser with built-in AI support (Chrome 127+ / Edge Canary 134+ with appropriate flags enabled)
- The Prompt API feature must be enabled in Chrome / Edge

## Installation

1. Clone or download this repository
2. Open Chrome / Edge and navigate to `Chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the Wafer directory
5. The extension should now appear in your extensions list

## Chrome / Edge Prompt API Setup

To use this extension, you need Chrome / Edge with the Prompt API enabled:

1. Use Chrome / Edge Canary (version 127 or later)
2. Enable the following flags in `Chrome://flags/`:
   - `#prompt-api-for-gemini-nano` or '#edge-llm-prompt-api-for-phi-mini'
   - `#optimization-guide-on-device-model`
3. Restart Chrome / Edge
4. The first time you use the extension, it may need to download the language model

## Privacy

All text processing happens locally on your device using Chrome / Edge's built-in language model. No data is sent to external servers.
