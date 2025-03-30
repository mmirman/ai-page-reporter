(() => {
  const SERVER_URL = "http://localhost:8080/api";
  const widgetContainerId = "ai-reporter-container";

  if (!document.body || document.getElementById(widgetContainerId)) return;

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = widgetContainerId;
  widgetContainer.style.position = 'fixed';
  widgetContainer.style.bottom = '20px';
  widgetContainer.style.right = '20px';
  widgetContainer.style.zIndex = '100000';
  document.body.appendChild(widgetContainer);

  // Attach Shadow DOM
  const shadow = widgetContainer.attachShadow({ mode: 'open' });

  // Widget HTML
  const widgetHTML = document.createElement('div');
  widgetHTML.innerHTML = `
    <style>
      #widget-header { background: #f0f0f0; padding: 5px; display: flex; justify-content: space-between; }
      #widget-close { font-size: 16px; cursor: pointer; border: none; background: none; }
      #widget-body { padding: 10px; }
      #report-ai-btn { margin: 5px 0; }
      .reported { background-color: red; color: white; padding: 5px; }
    </style>
    <div id="ai-reporter-widget">
      <div id="widget-header">
        <span id="widget-title">AI Reporter</span>
        <button id="widget-close" title="Close">×</button>
      </div>
      <div id="widget-body">
        <div id="notification"></div>
        <button id="report-ai-btn">Report as AI</button>
        <span id="report-status"></span>
        <div id="ai-status-indicator" title="AI evaluation status"></div>
      </div>
    </div>
  `;
  shadow.appendChild(widgetHTML);

  // Toggle widget visibility
  function toggleWidget() {
    console.log("Toggling widget");
    const isHidden = widgetContainer.style.display === 'none' || widgetContainer.style.display === '';
    widgetContainer.style.display = isHidden ? 'block' : 'none';
    chrome.storage.local.set({ "ai-widget-hidden": !isHidden });
  }

  // Close button listener
  const closeButton = shadow.getElementById('widget-close');
  closeButton.addEventListener('click', () => {
    console.log("Close button clicked");
    toggleWidget();
  });

  // Restore widget state
  chrome.storage.local.get(["ai-widget-hidden"], (result) => {
    widgetContainer.style.display = result["ai-widget-hidden"] ? 'none' : 'block';
  });

  // Report button logic
  const reportButton = shadow.getElementById('report-ai-btn');
  const reportStatus = shadow.getElementById('report-status');
  reportButton.addEventListener('click', async () => {
    console.log("Report as AI clicked");
    try {
      const response = await fetch(`${SERVER_URL}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: window.location.href,
          aiFlag: true,
          timestamp: Date.now(),
          sessionId: crypto.randomUUID() // Add a session ID
        })
      });

      const data = await response.json();
      if (data.success) {
        const widgetBody = shadow.getElementById('widget-body');
        widgetBody.classList.add('reported');
        reportStatus.textContent = "Reported successfully!";
        reportButton.disabled = true;
      } else {
        reportStatus.textContent = "Error: " + (data.message || "Failed to report");
      }
    } catch (error) {
      console.error("Report error:", error);
      reportStatus.textContent = "Error: Failed to connect to server";
    }
  });

  // Handle messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "toggleWidget") {
      toggleWidget();
      sendResponse({ success: true });
    }
  });

  // AI Evaluation
  function evaluatePageContent() {
    const widget = document.getElementById(widgetContainerId);
    const originalDisplay = widget.style.display;
    widget.style.display = 'none';
    const contentText = document.body.innerText.slice(0, 10000);
    widget.style.display = originalDisplay;

    fetch(`${SERVER_URL}/ai-evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: contentText })
    })
    .then(response => response.json())
    .then(data => {
      const indicator = shadow.getElementById('ai-status-indicator');
      if (data.score > 0.9) indicator.classList.add("suspicious");
      else indicator.classList.remove("suspicious");
      chrome.runtime.sendMessage({ type: "updateAIStatus", aiScore: data.score });
    })
    .catch(err => console.error("AI evaluation error:", err));
  }

  window.addEventListener('load', evaluatePageContent);
})();
