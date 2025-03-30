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

document.addEventListener('DOMContentLoaded', async function() {
  // Get the current tab URL
  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  const currentUrl = tabs[0].url;
  
  // Track this visit and check if it's the first time
  const isFirstVisit = await trackUrlVisit(currentUrl);
  
  // If it's the first visit, show a notification and prompt for reporting
  if (isFirstVisit) {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'first-visit-notification';
    notificationDiv.textContent = 'First time visiting this site! Would you like to report it?';
    
    const reportButton = document.createElement('button');
    reportButton.textContent = 'Report';
    reportButton.addEventListener('click', function() {
      // Show report form
      document.getElementById('report-form').style.display = 'block';
      notificationDiv.style.display = 'none';
    });
    
    const dismissButton = document.createElement('button');
    dismissButton.textContent = 'Dismiss';
    dismissButton.addEventListener('click', function() {
      notificationDiv.style.display = 'none';
    });
    
    notificationDiv.appendChild(reportButton);
    notificationDiv.appendChild(dismissButton);
    
    // Add to the popup
    document.body.insertBefore(notificationDiv, document.body.firstChild);
  }
  
  // Update the status display
  updateStatusDisplay(currentUrl);
});

// Function to update the status display
async function updateStatusDisplay(url) {
  const status = await getPostStatus(url);
  
  const statusElement = document.getElementById('status-display') || document.createElement('div');
  statusElement.id = 'status-display';
  
  statusElement.innerHTML = `
    <p>URL: ${url}</p>
    <p>Reported: ${status.reported ? 'Yes' : 'No'}</p>
    <p>Total Visits: ${status.totalVisits}</p>
    <p>Report Count: ${status.reportCount}</p>
    <p>Report Percentage: ${status.reportPercentage.toFixed(2)}%</p>
  `;
  
  if (!document.getElementById('status-display')) {
    document.body.appendChild(statusElement);
  }
}

async function trackUrlVisit(url) {
  try {
    console.log('Tracking visit for:', url);
    const response = await fetch('http://localhost:8080/api/trackVisit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Track visit response:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown error');
    }
    
    return data.isFirstVisit;
  } catch (error) {
    console.error('Error tracking visit:', error);
    // Don't throw the error, return false to continue execution
    return false;
  }
}

async function getPostStatus(url) {
  try {
    const response = await fetch(`http://localhost:8080/api/status?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    return {
      reported: data.reported || false,
      totalVisits: data.totalVisits || 0,
      reportCount: data.reportCount || 0,
      reportPercentage: data.reportPercentage || 0
    };
  } catch (error) {
    console.error('Error getting status:', error);
    return {
      reported: false,
      totalVisits: 0,
      reportCount: 0,
      reportPercentage: 0
    };
  }
}
