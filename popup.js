// Report current page
document.getElementById("report-current-page").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "triggerReport" }, (response) => {
        if (chrome.runtime.lastError) {
          document.getElementById("status").textContent = "Error: " + chrome.runtime.lastError.message;
        } else if (response && response.success) {
          document.getElementById("status").textContent = "Report triggered!";
          setTimeout(() => { document.getElementById("status").textContent = ""; }, 3000);
        }
      });
    }
  });
});

// Toggle widget
document.getElementById("toggle-widget").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "toggleWidget" }, (response) => {
        if (chrome.runtime.lastError) {
          document.getElementById("status").textContent = "Error: " + chrome.runtime.lastError.message;
        } else if (response && response.success) {
          document.getElementById("status").textContent = "Widget toggled!";
          setTimeout(() => { document.getElementById("status").textContent = ""; }, 3000);
        }
      });
    }
  });
});
