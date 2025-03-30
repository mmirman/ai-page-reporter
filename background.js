const SERVER_URL = "https://localhost:8080/api";

// Update extension icon and badge
function updateIcon(aiScore) {
  let color = "green";
  if (aiScore > 0.3) color = "yellow";
  if (aiScore > 0.7) color = "red";
  
  console.log(`Updating icon to ${color} with score ${aiScore}`);

  chrome.action.setBadgeText({ text: `icons/icon-${color}.png` });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Listen for AI evaluation results
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "updateAIStatus") {
    updateIcon(message.aiScore);
  }
});

// Listen for reports
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "reportPage") {
    fetch(`${SERVER_URL}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: message.url, aiFlag: message.aiFlag || false, timestamp: Date.now() })
    })
    .then(response => {
      if (!response.ok) throw new Error("Network error");
      return response.json();
    })
    .then(data => sendResponse(data))
    .catch(err => sendResponse({ error: err.toString() }));
    return true;
  }
});

// Create a new background.js file
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'openPopup') {
    chrome.action.openPopup();
  }
});

// Request notification permission when extension is installed
chrome.runtime.onInstalled.addListener(function() {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
});
