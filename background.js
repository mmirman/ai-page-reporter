const SERVER_URL = "http://localhost:8080/api";

// Update extension icon and badge
function updateIcon(aiScore) {
  // Ensure aiScore is a number
  aiScore = parseFloat(aiScore);
  
  // Determine color based on score
  let color = "#4CAF50"; // green
  let badgeText = "OK";  // Default text for low scores
  
  console.log(`Evaluating score ${aiScore} for badge: ${aiScore > 0.3 ? 'Above 0.3' : 'Below 0.3'}`);
  
  if (aiScore > 0.3) {
    color = "#FFC107"; // yellow
    badgeText = "!";
    console.log("Setting yellow badge");
  }
  if (aiScore > 0.7) {
    color = "#F44336"; // red
    badgeText = "!!";
    console.log("Setting red badge");
  }
  
  console.log(`Final badge settings - score: ${aiScore}, color: ${color}, badge: ${badgeText}`);

  // Set badge text (short text that appears on the icon)
  chrome.action.setBadgeText({ text: badgeText });
  
  // Set badge background color
  chrome.action.setBadgeBackgroundColor({ color: color });
  
  // Change the icon based on score
  let iconPath;
  if (aiScore > 0.7) {
    iconPath = {
      16: "icons/icon-red-16.png",
      32: "icons/icon-red-32.png",
      48: "icons/icon-red-48.png",
      128: "icons/icon-red-128.png"
    };
  } else if (aiScore > 0.3) {
    iconPath = {
      16: "icons/icon-yellow-16.png",
      32: "icons/icon-yellow-32.png",
      48: "icons/icon-yellow-48.png",
      128: "icons/icon-yellow-128.png"
    };
  } else {
    iconPath = {
      16: "icons/icon-green-16.png",
      32: "icons/icon-green-32.png",
      48: "icons/icon-green-48.png",
      128: "icons/icon-green-128.png"
    };
  }
  
  // Update the icon
  chrome.action.setIcon({ path: iconPath });
}

// Listen for AI evaluation results
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "updateAIStatus") {
    console.log("Received AI status update:", message.aiScore);
    updateIcon(message.aiScore);
    return true;
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
