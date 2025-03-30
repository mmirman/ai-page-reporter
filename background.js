const SERVER_URL = "http://localhost:8080/api";

// Update extension icon and badge
function updateIcon(aiScore) {
  // Ensure aiScore is a number
  aiScore = parseFloat(aiScore);
  
  // Determine color based on score
  let color = "#4CAF50"; // green
  let badgeText = "ok";  // Default text for low scores
  
  console.log(`Evaluating score ${aiScore} for badge: ${aiScore > 0.3 ? 'Above 0.3' : 'Below 0.3'}`);
  
  if (aiScore > 0.3) {
    color = "#FFC107"; // yellow
    badgeText = "ai";
    console.log("Setting yellow badge");
  }
  if (aiScore > 0.7) {
    color = "#F44336"; // red
    badgeText = "AI";
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

// Listen for AI evaluation results - improve error handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background script received message:", message);
  
  if (message.type === "updateAIStatus") {
    try {
      console.log("Processing AI status update:", message.aiScore);
      updateIcon(message.aiScore);
      sendResponse({ success: true });
    } catch (error) {
      console.error("Error updating icon:", error);
      sendResponse({ success: false, error: error.message });
    }
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

// Test function to manually update the icon
function testIconUpdate() {
  console.log("Testing icon update with different scores");
  
  // Test with low score
  setTimeout(() => {
    console.log("Testing low score (0.1)");
    updateIcon(0.1);
  }, 2000);
  
  // Test with medium score
  setTimeout(() => {
    console.log("Testing medium score (0.5)");
    updateIcon(0.5);
  }, 4000);
  
  // Test with high score
  setTimeout(() => {
    console.log("Testing high score (0.8)");
    updateIcon(0.8);
  }, 6000);
}

// Run the test when extension is installed
chrome.runtime.onInstalled.addListener(function() {
  console.log("Extension installed, running icon test");
  testIconUpdate();
  
  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
});
