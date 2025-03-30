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
    console.log("Starting AI evaluation of page content");
    
    const widget = document.getElementById(widgetContainerId);
    if (!widget) {
      console.error("Widget element not found");
      return;
    }
    
    const originalDisplay = widget.style.display;
    widget.style.display = 'none';
    const contentText = document.body.innerText.slice(0, 10000);
    widget.style.display = originalDisplay;

    console.log(`Sending ${contentText.length} characters for AI evaluation`);

    fetch(`${SERVER_URL}/ai-evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: contentText })
    })
    .then(response => {
      console.log("AI evaluation response received", response.status);
      return response.json();
    })
    .then(data => {
      console.log("AI evaluation result:", data);
      const score = parseFloat(data.score);
      
      const indicator = shadow.getElementById('ai-status-indicator');
      indicator.textContent = `AI Score: ${(score * 100).toFixed(1)}%`;
      
      if (score > 0.9) {
        indicator.classList.add("suspicious");
        indicator.style.color = "#F44336";
      } else if (score > 0.3) {
        indicator.style.color = "#FFC107";
      } else {
        indicator.classList.remove("suspicious");
        indicator.style.color = "#4CAF50";
      }
      
      console.log(`Sending AI score update: ${score}`);
      chrome.runtime.sendMessage({ 
        type: "updateAIStatus", 
        aiScore: score 
      }, response => {
        if (chrome.runtime.lastError) {
          console.error("Error sending AI status:", chrome.runtime.lastError);
        } else {
          console.log("AI status update sent successfully", response);
        }
      });
    })
    .catch(err => {
      console.error("AI evaluation error:", err);
      const indicator = shadow.getElementById('ai-status-indicator');
      indicator.textContent = "AI evaluation failed";
      indicator.style.color = "#999";
    });
  }

  console.log("AI Reporter: Content script loaded, will evaluate page content");

  // Make sure this is called when the page loads
  window.addEventListener('load', function() {
    console.log("AI Reporter: Page loaded, evaluating content");
    evaluatePageContent();
  });

  // Add this at the beginning of the content script
  console.log("AI Reporter content script injected on:", window.location.href);

  // Add a simple test to check if the extension is working
  setTimeout(() => {
    console.log("AI Reporter: Sending test message to background script");
    chrome.runtime.sendMessage({ 
      type: "updateAIStatus", 
      aiScore: 0.5,
      test: true
    }, response => {
      if (chrome.runtime.lastError) {
        console.error("Test message error:", chrome.runtime.lastError);
      } else {
        console.log("Test message response:", response);
      }
    });
  }, 3000);
})();
