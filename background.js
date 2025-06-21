// Background service worker for Wafer extension
let selectedText = '';

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'wafer-rewrite',
    title: 'Rewrite with Wafer',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'wafer-rewrite') {
    selectedText = info.selectionText || '';
    
    // Open side panel
    chrome.sidePanel.open({ tabId: tab.id });
    
    // Send selected text to side panel
    chrome.runtime.sendMessage({
      type: 'SELECTED_TEXT',
      text: selectedText
    });
  }
});

// Handle messages from content script and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SELECTED_TEXT') {
    sendResponse({ text: selectedText });
  }
  
  if (message.type === 'OPEN_SIDE_PANEL') {
    chrome.sidePanel.open({ tabId: sender.tab.id });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});
