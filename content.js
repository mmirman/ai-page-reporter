(() => {
  const SERVER_URL = "https://your-server.com/api";
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

  // Widget HTML with styling
  const widgetHTML = document.createElement('div');
  widgetHTML.innerHTML = `
    <style>
      #widget-header { background: #f0f0f0; padding: 5px; display: flex; justify-content: space-between; }
      #widget-close { font-size: 16px; cursor: pointer; border: none; background: none; }
      #widget-body { padding: 10px; }
      #ai-comments-section { margin-top: 10px; }
      #comment-input { width: 100%; margin-top: 5px; }
    </style>
    <div id="ai-reporter-widget">
      <div id="widget-header">
        <span id="widget-title">AI Reporter</span>
        <button id="widget-close" title="Close">×</button>
      </div>
      <div id="widget-body">
        <div id="notification"></div>
        <button id="report-ai-btn">Report AI?</button>
        <button id="toggle-comments-btn">Toggle Comments</button>
        <div id="ai-status-indicator" title="AI evaluation status"></div>
        <div id="ai-comments-section" style="display:none;">
          <h3>Comments</h3>
          <div id="comments-container"></div>
          <textarea id="comment-input" placeholder="Add your comment"></textarea>
          <button id="submit-comment-btn">Submit Comment</button>
        </div>
      </div>
    </div>
  `;
  shadow.appendChild(widgetHTML);

  // Toggle widget visibility
  function toggleWidget() {
    console.log("Toggling widget"); // Debug log
    const isHidden = widgetContainer.style.display === 'none';
    widgetContainer.style.display = isHidden ? 'block' : 'none';
    sessionStorage.setItem("ai-widget-hidden", !isHidden);
  }

  // Close button listener
  const closeButton = shadow.getElementById('widget-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      console.log("Close button clicked"); // Debug log
      toggleWidget();
    });
  } else {
    console.error("Close button not found in Shadow DOM");
  }

  // Restore widget state
  widgetContainer.style.display = sessionStorage.getItem("ai-widget-hidden") === "true" ? 'none' : 'block';

  // Toggle comments
  const toggleCommentsBtn = shadow.getElementById('toggle-comments-btn');
  const commentsSection = shadow.getElementById('ai-comments-section');
  toggleCommentsBtn.addEventListener('click', () => {
    console.log("Toggle comments clicked"); // Debug log
    commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
  });

  // Listen for toggle from background
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
