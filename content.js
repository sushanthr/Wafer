// Content script for Wafer extension
// Handles text selection and communication with background script

let lastSelectedText = '';

// Listen for text selection changes
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (selectedText && selectedText !== lastSelectedText) {
    lastSelectedText = selectedText;
    
    // Store selected text for potential use
    chrome.runtime.sendMessage({
      type: 'TEXT_SELECTED',
      text: selectedText
    });
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_SELECTION') {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    sendResponse({ text: selectedText });
  }
});
