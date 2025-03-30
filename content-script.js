// Add this to your content script
(async function() {
  // Track this page visit
  const currentUrl = window.location.href;
  const isFirstVisit = await trackUrlVisit(currentUrl);
  
  // If it's the first visit and we have notification permission, show a notification
  if (isFirstVisit && Notification.permission === 'granted') {
    const notification = new Notification('AI Reporter', {
      body: 'First time visiting this site! Click to open the extension popup.',
      icon: chrome.runtime.getURL('icons/icon48.png')
    });
    
    notification.onclick = function() {
      chrome.runtime.sendMessage({ action: 'openPopup' });
    };
  }
})(); 