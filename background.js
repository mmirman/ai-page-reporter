const SERVER_URL = "https://your-server.com/api";

// Update extension icon and badge
function updateIcon(aiScore) {
  let color = "green";
  if (aiScore > 0.3) color = "yellow";
  if (aiScore > 0.7) color = "red";
  
  console.log(`Updating icon to ${color} with score ${aiScore}`); // Debug log
  chrome.action.setIcon({ path: {
    "16": `icons/icon-${color}-16.png`,
    "32": `icons/icon-${color}-32.png`,
    "48": `icons/icon-${color}-48.png`,
    "128": `icons/icon-${color}-128.png`
  }});
  chrome.action.setBadgeText({ text: Math.round(aiScore * 100).toString() });
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

// Toggle widget on icon click
chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked"); // Debug log
  chrome.tabs.sendMessage(tab.id, { type: "toggleWidget" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error toggling widget:", chrome.runtime.lastError.message);
    } else {
      console.log("Widget toggle response:", response);
    }
  });
});
