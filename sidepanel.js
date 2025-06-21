// Wafer Side Panel JavaScript
class WaferApp {
  constructor() {
    this.session = null;
    this.isModelAvailable = false;
    this.isDownloading = false;
    this.currentText = '';
    this.currentMode = 'rewrite'; // 'rewrite' or 'write'
    this.history = [];
    this.currentHistoryIndex = -1;
    this.customTones = [];
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.loadSettings();
    await this.checkModelAvailability();
    this.setupMessageListener();
  }

  setupEventListeners() {
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleTabClick(e));
    });

    // Option buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleOptionClick(e));
    });

    // Main action buttons
    document.getElementById('rewriteBtn').addEventListener('click', () => this.processText());
    document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
    document.getElementById('copyBtn').addEventListener('click', () => this.copyOutput());
    document.getElementById('regenerateBtn').addEventListener('click', () => this.regenerateText());

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
    document.getElementById('closeSettingsBtn').addEventListener('click', () => this.closeSettings());
    document.getElementById('addToneBtn').addEventListener('click', () => this.addCustomTone());

    // Temperature slider
    const tempSlider = document.getElementById('temperature');
    const tempValue = document.getElementById('temperatureValue');
    tempSlider.addEventListener('input', (e) => {
      tempValue.textContent = e.target.value;
      this.saveSettings();
    });

    // Input text change
    document.getElementById('inputText').addEventListener('input', (e) => {
      this.currentText = e.target.value;
      this.updateTabTitles();
    });

    // Write instructions change
    document.getElementById('writeInstructions').addEventListener('input', (e) => {
      this.updateTabTitles();
    });

    // Listen for sidepanel closing to clear everything
    window.addEventListener('beforeunload', () => {
      this.clearAll();
    });

    // Also listen for visibility change as backup
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.clearAll();
      }
    });
  }

  setupMessageListener() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SELECTED_TEXT') {
        this.setInputText(message.text);
      }
    });

    // Request selected text when panel opens
    chrome.runtime.sendMessage({ type: 'GET_SELECTED_TEXT' }, (response) => {
      if (response && response.text) {
        this.setInputText(response.text);
      }
    });
  }

  async checkModelAvailability() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const downloadProgress = document.getElementById('downloadProgress');

    try {
      // Check if LanguageModel API is available
      if (!('LanguageModel' in window)) {
        this.updateStatus('unavailable', 'Language Model API not available in this browser');
        return;
      }

      statusText.textContent = 'Checking model availability...';
      
      const availability = await LanguageModel.availability();
      
      switch (availability) {
        case 'available':
          this.updateStatus('available', 'Model ready');
          this.isModelAvailable = true;
          break;
          
        case 'downloadable':
          this.updateStatus('downloading', 'Model needs to be downloaded');
          await this.downloadModel();
          break;
          
        case 'downloading':
          this.updateStatus('downloading', 'Model is downloading...');
          await this.waitForDownload();
          break;
          
        case 'unavailable':
        default:
          this.updateStatus('unavailable', 'Language model not available');
          break;
      }
    } catch (error) {
      console.error('Error checking model availability:', error);
      this.updateStatus('unavailable', 'Error checking model availability');
    }
  }

  async downloadModel() {
    const downloadProgress = document.getElementById('downloadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    downloadProgress.classList.remove('hidden');
    this.isDownloading = true;

    try {
      this.session = await LanguageModel.create({
        topk:50,
        temperature: parseFloat(document.getElementById('temperature').value),
        monitor: (monitor) => {
          monitor.addEventListener('downloadprogress', (e) => {
            const percent = Math.round(e.loaded * 100);
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `Downloading model... ${percent}%`;
          });
        }
      });

      this.updateStatus('available', 'Model ready');
      this.isModelAvailable = true;
      downloadProgress.classList.add('hidden');
      this.isDownloading = false;
    } catch (error) {
      console.error('Error downloading model:', error);
      this.updateStatus('unavailable', 'Failed to download model');
      downloadProgress.classList.add('hidden');
      this.isDownloading = false;
    }
  }

  async waitForDownload() {
    // Poll for availability until download is complete
    const checkInterval = setInterval(async () => {
      try {
        const availability = await LanguageModel.availability();
        if (availability === 'available') {
          clearInterval(checkInterval);
          this.updateStatus('available', 'Model ready');
          this.isModelAvailable = true;
        }
      } catch (error) {
        clearInterval(checkInterval);
        this.updateStatus('unavailable', 'Error waiting for download');
      }
    }, 1000);
  }

  updateStatus(status, message) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    statusIndicator.className = `status-indicator ${status}`;
    statusText.textContent = message;
  }

  setInputText(text) {
    const inputText = document.getElementById('inputText');
    inputText.value = text;
    this.currentText = text;
    this.updateTabTitles();
  }

  handleTabClick(e) {
    const clickedTab = e.target.closest('.tab-btn');
    const tabType = clickedTab.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(tab => {
      tab.classList.remove('active');
    });
    clickedTab.classList.add('active');
    
    // Update active panel
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    document.getElementById(`${tabType}Panel`).classList.add('active');
    
    // Update current mode
    this.currentMode = tabType;
    this.updateUI();
  }

  updateTabTitles() {
    const rewriteTab = document.getElementById('rewriteTab');
    const writeTab = document.getElementById('writeTab');
    const inputText = document.getElementById('inputText').value.trim();
    
    if (inputText && this.currentMode === 'write') {
      // If there's text to rewrite and we're in write mode, show custom instructions option
      rewriteTab.querySelector('.tab-title').textContent = 'Custom Instructions';
    } else {
      rewriteTab.querySelector('.tab-title').textContent = 'Text to Rewrite';
    }
    
    writeTab.querySelector('.tab-title').textContent = 'Write from Scratch';
  }

  updateUI() {
    const rewriteBtn = document.getElementById('rewriteBtn');
    const btnText = rewriteBtn.querySelector('.btn-text');
    const outputHeader = document.querySelector('.output-section .section-label');
    const outputPlaceholder = document.querySelector('.output-placeholder');
    
    if (this.currentMode === 'write') {
      btnText.textContent = 'Generate Text';
      outputHeader.textContent = 'Generated Text';
      if (outputPlaceholder) {
        outputPlaceholder.textContent = 'Your generated text will appear here...';
      }
    } else {
      btnText.textContent = 'Rewrite Text';
      outputHeader.textContent = 'Rewritten Text';
      if (outputPlaceholder) {
        outputPlaceholder.textContent = 'Your rewritten text will appear here...';
      }
    }
  }

  handleOptionClick(e) {
    const button = e.target;
    const group = button.parentElement;
    
    // Remove active class from siblings
    group.querySelectorAll('.option-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    button.classList.add('active');
  }

  getSelectedOptions() {
    const tone = document.querySelector('#toneOptions .option-btn.active')?.dataset.tone || 'professional';
    const length = document.querySelector('#lengthOptions .option-btn.active')?.dataset.length || 'same';
    const format = document.querySelector('#formatOptions .option-btn.active')?.dataset.format || 'text';
    const customPrompt = document.getElementById('customPrompt').value.trim();

    return { tone, length, format, customPrompt };
  }

  buildPrompt(text, options, mode = 'rewrite') {
    let prompt;
    
    if (mode === 'write') {
      // Write from scratch mode
      prompt = `Please write text based on the following instructions and requirements:\n\n`;
      
      // Add the instructions/topic
      prompt += `Topic/Instructions: ${text}\n\n`;
    } else {
      // Rewrite mode
      prompt = `Please rewrite the following text with these specifications:\n\n`;
    }
    
    // Check if it's a custom tone
    const customTone = this.customTones.find(tone => tone.id === options.tone);
    if (customTone) {
      prompt += `Tone: ${customTone.prompt}\n`;
    } else {
      // Add tone instruction
      const toneInstructions = {
        professional: 'Use a professional, business-appropriate tone',
        casual: 'Use a casual, conversational tone',
        friendly: 'Use a warm, friendly tone',
        formal: 'Use a formal, academic tone',
        creative: 'Use a creative, engaging tone'
      };
      
      prompt += `Tone: ${toneInstructions[options.tone] || toneInstructions.professional}\n`;
    }
    
    // Add length instruction (modify for write mode)
    const lengthInstructions = {
      shorter: mode === 'write' ? 'Keep it concise and brief' : 'Make it more concise and shorter',
      same: mode === 'write' ? 'Write a moderate length response' : 'Keep approximately the same length',
      longer: mode === 'write' ? 'Write a detailed and comprehensive response' : 'Expand it with more detail and explanation'
    };
    
    prompt += `Length: ${lengthInstructions[options.length] || lengthInstructions.same}\n`;
    
    // Add format instruction
    if (options.format === 'markdown') {
      prompt += `Format: Output in Markdown format with appropriate formatting\n`;
    } else {
      prompt += `Format: Output as plain text\n`;
    }
    
    // Add custom instructions
    if (options.customPrompt) {
      prompt += `Additional instructions: ${options.customPrompt}\n`;
    }
    
    if (mode === 'rewrite') {
      prompt += `\nText to rewrite:\n"${text}"\n\nRewritten text:`;
    } else {
      prompt += `\nGenerated text:`;
    }
    
    return prompt;
  }

  async processText() {
    if (!this.isModelAvailable || this.isDownloading) {
      alert('Model is not ready yet. Please wait for it to download.');
      return;
    }

    let inputText;
    let alertMessage;
    
    if (this.currentMode === 'write') {
      inputText = document.getElementById('writeInstructions').value.trim();
      alertMessage = 'Please enter instructions for what you want to write.';
    } else {
      inputText = document.getElementById('inputText').value.trim();
      alertMessage = 'Please enter some text to rewrite.';
    }

    if (!inputText) {
      alert(alertMessage);
      return;
    }

    const rewriteBtn = document.getElementById('rewriteBtn');
    const btnText = rewriteBtn.querySelector('.btn-text');
    const btnSpinner = rewriteBtn.querySelector('.btn-spinner');
    const outputContent = document.getElementById('outputContent');

    // Show loading state
    rewriteBtn.disabled = true;
    const loadingText = this.currentMode === 'write' ? 'Generating...' : 'Rewriting...';
    btnText.textContent = loadingText;
    btnSpinner.classList.remove('hidden');
    outputContent.classList.add('streaming');
    outputContent.textContent = '';

    try {
      // Create session if not exists
      if (!this.session) {
        this.session = await LanguageModel.create({
          topK: 50,
          temperature: parseFloat(document.getElementById('temperature').value)
        });
      }

      const options = this.getSelectedOptions();
      const prompt = this.buildPrompt(inputText, options, this.currentMode);

      // Stream the response
      const stream = this.session.promptStreaming(prompt);
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        outputContent.textContent = fullResponse;
      }
      this.session = null;
      
      // Save to history
      this.addToHistory({
        input: inputText,
        output: fullResponse,
        options: options,
        mode: this.currentMode,
        prompt: prompt,
        timestamp: new Date().toISOString()
      });

      this.showHistory();

    } catch (error) {
      console.error('Error processing text:', error);
      const errorMessage = this.currentMode === 'write' ? 'Error: Failed to generate text. Please try again.' : 'Error: Failed to rewrite text. Please try again.';
      outputContent.textContent = errorMessage;
    } finally {
      // Reset button state
      rewriteBtn.disabled = false;
      this.updateUI(); // This will set the correct button text
      btnSpinner.classList.add('hidden');
      outputContent.classList.remove('streaming');
    }
  }

  async regenerateText() {
    if (this.history.length === 0) return;
    
    const lastEntry = this.history[this.history.length - 1];
    
    // Switch to the correct mode and set the input
    if (lastEntry.mode) {
      this.currentMode = lastEntry.mode;
      
      // Update tab UI
      document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === this.currentMode);
      });
      
      // Update panel UI
      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `${this.currentMode}Panel`);
      });
      
      this.updateUI();
    }
    
    // Set the input in the correct field
    if (this.currentMode === 'write') {
      document.getElementById('writeInstructions').value = lastEntry.input;
    } else {
      document.getElementById('inputText').value = lastEntry.input;
    }
    
    this.setSelectedOptions(lastEntry.options);
    document.getElementById('customPrompt').value = lastEntry.options.customPrompt || '';
    
    // Regenerate
    await this.processText();
  }

  setSelectedOptions(options) {
    // Set tone
    document.querySelectorAll('#toneOptions .option-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tone === options.tone);
    });
    
    // Set length
    document.querySelectorAll('#lengthOptions .option-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.length === options.length);
    });
    
    // Set format
    document.querySelectorAll('#formatOptions .option-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.format === options.format);
    });
  }

  addToHistory(entry) {
    this.history.push(entry);
    this.currentHistoryIndex = this.history.length - 1;
    
    // Keep only last 10 entries
    if (this.history.length > 10) {
      this.history = this.history.slice(-10);
      this.currentHistoryIndex = this.history.length - 1;
    }
    
    this.saveHistory();
    this.renderHistory();
  }

  showHistory() {
    const historySection = document.getElementById('historySection');
    if (this.history.length > 0) {
      historySection.classList.remove('hidden');
    }
  }

  renderHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    this.history.forEach((entry, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = `history-item ${index === this.currentHistoryIndex ? 'active' : ''}`;
      
      historyItem.innerHTML = `
        <div class="history-meta">
          <span>Version ${index + 1}</span>
          <span>${new Date(entry.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="history-preview">${entry.output.substring(0, 100)}...</div>
      `;
      
      historyItem.addEventListener('click', () => this.loadHistoryItem(index));
      historyList.appendChild(historyItem);
    });
  }

  loadHistoryItem(index) {
    const entry = this.history[index];
    if (!entry) return;

    document.getElementById('inputText').value = entry.input;
    document.getElementById('outputContent').textContent = entry.output;
    this.setSelectedOptions(entry.options);
    document.getElementById('customPrompt').value = entry.options.customPrompt || '';

    this.currentHistoryIndex = index;
    this.renderHistory();
  }

  async copyOutput() {
    const outputContent = document.getElementById('outputContent');
    const text = outputContent.textContent;
    
    if (!text || text === 'Your rewritten text will appear here...') {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      
      // Show feedback
      const copyBtn = document.getElementById('copyBtn');
      const originalTitle = copyBtn.title;
      copyBtn.title = 'Copied!';
      setTimeout(() => {
        copyBtn.title = originalTitle;
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }

  clearAll() {
    document.getElementById('inputText').value = '';
    document.getElementById('writeInstructions').value = '';
    document.getElementById('customPrompt').value = '';
    document.getElementById('outputContent').innerHTML = '<div class="output-placeholder">Your rewritten text will appear here...</div>';
    document.getElementById('historySection').classList.add('hidden');
    this.currentText = '';
    this.history = [];
    this.currentHistoryIndex = -1;
    this.saveHistory();
    this.updateTabTitles();
    this.updateUI();
  }

  openSettings() {
    document.getElementById('settingsPanel').classList.remove('hidden');
    this.renderCustomTones();
  }

  closeSettings() {
    document.getElementById('settingsPanel').classList.add('hidden');
  }

  addCustomTone() {
    const name = prompt('Enter a name for the custom tone:');
    if (!name) return;

    const promptText = prompt('Enter the prompt/instructions for this tone:');
    if (!promptText) return;

    const customTone = {
      id: Date.now().toString(),
      name: name.trim(),
      prompt: promptText.trim()
    };

    this.customTones.push(customTone);
    this.saveSettings();
    this.renderCustomTones();
    this.addCustomToneButton(customTone);
  }

  addCustomToneButton(tone) {
    const toneOptions = document.getElementById('toneOptions');
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.dataset.tone = tone.id;
    button.textContent = tone.name;
    button.addEventListener('click', (e) => this.handleOptionClick(e));
    toneOptions.appendChild(button);
  }

  renderCustomTones() {
    const customTonesContainer = document.getElementById('customTones');
    customTonesContainer.innerHTML = '';

    this.customTones.forEach(tone => {
      const toneItem = document.createElement('div');
      toneItem.className = 'custom-tone-item';
      toneItem.innerHTML = `
        <div class="custom-tone-name">${tone.name}</div>
        <div class="custom-tone-prompt">${tone.prompt}</div>
        <button class="delete-tone-btn" data-id="${tone.id}">×</button>
      `;

      const deleteBtn = toneItem.querySelector('.delete-tone-btn');
      deleteBtn.addEventListener('click', () => this.deleteCustomTone(tone.id));

      customTonesContainer.appendChild(toneItem);
    });
  }

  deleteCustomTone(id) {
    this.customTones = this.customTones.filter(tone => tone.id !== id);
    this.saveSettings();
    this.renderCustomTones();

    // Remove button from main UI
    const button = document.querySelector(`#toneOptions [data-tone="${id}"]`);
    if (button) {
      button.remove();
    }
  }

  loadSettings() {
    chrome.storage.sync.get(['waferSettings', 'waferHistory'], (result) => {
      if (result.waferSettings) {
        const settings = result.waferSettings;
        
        if (settings.temperature) {
          document.getElementById('temperature').value = settings.temperature;
          document.getElementById('temperatureValue').textContent = settings.temperature;
        }
        
        if (settings.customTones) {
          this.customTones = settings.customTones;
          // Add custom tone buttons to main UI
          this.customTones.forEach(tone => {
            this.addCustomToneButton(tone);
          });
        }
      }

      if (result.waferHistory) {
        this.history = result.waferHistory;
        if (this.history.length > 0) {
          this.showHistory();
          this.renderHistory();
        }
      }
    });
  }

  saveSettings() {
    const settings = {
      temperature: document.getElementById('temperature').value,
      customTones: this.customTones
    };

    chrome.storage.sync.set({ waferSettings: settings });
  }

  saveHistory() {
    chrome.storage.sync.set({ waferHistory: this.history });
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WaferApp();
});
