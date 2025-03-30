const SERVER_URL = "http://localhost:8080/api";

// Store AI scores for each tab
const tabScores = new Map();

// Update extension icon and badge
function updateIcon(aiScore, tabId) {
  // Ensure aiScore is a number
  aiScore = parseFloat(aiScore);
  
  // Store the score for this tab
  if (tabId) {
    tabScores.set(tabId, aiScore);
    console.log(`Stored score ${aiScore} for tab ${tabId}`);
  }
  
  // Determine color based on score
  let color = "#4CAF50"; // green
  let badgeText = "ok";  // Default text for low scores
  
  // Use more appropriate thresholds:
  // - "ai" for 30-70% report rate
  // - "AI" for >70% report rate
  if (aiScore >= 0.3 && aiScore < 0.7) {
    color = "#FFC107"; // yellow
    badgeText = "ai";
  } else if (aiScore >= 0.7) {
    color = "#F44336"; // red
    badgeText = "AI";
  }
  
  console.log(`Setting badge for score ${aiScore}: ${badgeText}, color: ${color}`);

  // Set badge text (short text that appears on the icon)
  const badgeOptions = tabId ? { text: badgeText, tabId } : { text: badgeText };
  chrome.action.setBadgeText(badgeOptions);
  
  // Set badge background color
  const colorOptions = tabId ? { color: color, tabId } : { color: color };
  chrome.action.setBadgeBackgroundColor(colorOptions);
  
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
  const iconOptions = tabId ? { path: iconPath, tabId } : { path: iconPath };
  chrome.action.setIcon(iconOptions);
}

// Listen for AI evaluation results - improve error handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background script received message:", message);
  
  if (message.type === "updateAIStatus") {
    try {
      const tabId = sender.tab ? sender.tab.id : null;
      
      if (tabId) {
        // Get the URL for this tab
        chrome.tabs.get(tabId, tab => {
          // Always use the server status to update the badge
          updateBadgeFromStatus(tab.url, tabId);
        });
      }
      
      sendResponse({ success: true });
    } catch (error) {
      console.error("Error updating badge:", error);
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

// Modify the onInstalled listener
chrome.runtime.onInstalled.addListener(function() {
  console.log("Extension installed");
  
  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
});

// Add a tab change listener to update the badge when switching tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tabId = activeInfo.tabId;
  console.log(`Tab activated: ${tabId}`);
  
  try {
    // Get the tab URL
    const tab = await chrome.tabs.get(tabId);
    
    // Always use the server status to update the badge
    updateBadgeFromStatus(tab.url, tabId);
  } catch (error) {
    console.error("Error handling tab activation:", error);
    resetTabBadge(tabId);
  }
});

// Helper function to reset badge
function resetTabBadge(tabId) {
  console.log(`No score for tab ${tabId}, using default`);
  // Don't show any badge until we have a score
  chrome.action.setBadgeText({ text: "", tabId });
  chrome.action.setBadgeBackgroundColor({ color: "#4CAF50", tabId });
  chrome.action.setIcon({ 
    path: {
      16: "icons/icon-green-16.png",
      32: "icons/icon-green-32.png",
      48: "icons/icon-green-48.png",
      128: "icons/icon-green-128.png"
    },
    tabId 
  });
}

// Clean up tab scores when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabScores.has(tabId)) {
    console.log(`Removing score for closed tab ${tabId}`);
    tabScores.delete(tabId);
  }
});

// Add this helper function to background.js
async function updateBadgeFromStatus(url, tabId) {
  if (!url || url.startsWith('chrome://')) {
    resetTabBadge(tabId);
    return;
  }
  
  try {
    console.log(`Fetching status for ${url} to update badge`);
    const response = await fetch(`${SERVER_URL}/status?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (!data.success) {
      console.error("Error from status API:", data);
      resetTabBadge(tabId);
      return;
    }
    
    // Calculate score directly from report percentage
    const reportScore = data.totalVisits > 0 
      ? data.reportCount / data.totalVisits 
      : 0;
    
    console.log(`Badge update: URL ${url}, Reports: ${data.reportCount}, Visits: ${data.totalVisits}, Score: ${reportScore}`);
    
    // Update the badge with this score
    updateIcon(reportScore, tabId);
  } catch (error) {
    console.error("Error fetching status for badge update:", error);
    resetTabBadge(tabId);
  }
}

// Listen for URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only run when the URL has changed and loading is complete
  if (changeInfo.status === 'complete' && tab.url) {
    console.log(`Tab ${tabId} updated with new URL: ${tab.url}`);
    updateBadgeFromStatus(tab.url, tabId);
  }
});
