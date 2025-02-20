const SERVER_URL = "https://your-server.com/api";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "reportPage") {
    fetch(`${SERVER_URL}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: message.url,
        aiFlag: message.aiFlag || false,
        timestamp: Date.now()
      })
    })
      .then(response => response.ok ? response.json() : Promise.reject("Network error"))
      .then(data => sendResponse(data))
      .catch(err => sendResponse({ error: err.toString() }));

    return true; // Keep the message channel open for async response
  }
});
