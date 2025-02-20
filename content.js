(() => {
  const SERVER_URL = "https://your-server.com/api";
  const widgetContainerId = "ai-reporter-container";

  if (!document.body || document.getElementById(widgetContainerId)) return;

  const widgetContainer = document.createElement('div');
  widgetContainer.id = widgetContainerId;
  widgetContainer.style.position = 'fixed';
  widgetContainer.style.bottom = '20px';
  widgetContainer.style.right = '20px';
  widgetContainer.style.zIndex = '100000';
  document.body.appendChild(widgetContainer);

  const shadow = widgetContainer.attachShadow({ mode: 'open' });

  const widgetHTML = document.createElement('div');
  widgetHTML.id = 'ai-reporter-widget';
  widgetHTML.innerHTML = `
    <div id="widget-header">
      <span id="widget-title">AI Reporter</span>
      <button id="widget-close" title="Close">&times;</button>
    </div>
    <div id="widget-body">
      <div id="notification"></div>
      <button id="report-ai-btn">Report AI?</button>
      <button id="toggle-comments-btn">Toggle Comments</button>
      <div id="ai-status-indicator"></div>
      <div id="ai-comments-section" style="display:none;">
        <h3>Comments</h3>
        <div id="comments-container"></div>
        <textarea id="comment-input"></textarea>
        <button id="submit-comment-btn">Submit</button>
      </div>
    </div>
  `;
  shadow.appendChild(widgetHTML);

  const style = document.createElement('style');
  style.textContent = `
    #ai-reporter-widget { width: 300px; background: #fff; padding: 10px; }
    button { margin: 5px 0; }
    #ai-status-indicator { width: 20px; height: 20px; background: grey; border-radius: 50%; }
    .suspicious { background: red !important; }
  `;
  shadow.appendChild(style);

  shadow.getElementById('report-ai-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: "reportPage", url: window.location.href }, (response) => {
      console.log(response);
    });
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "triggerReport") {
      shadow.getElementById('report-ai-btn').click();
    }
  });
})();
