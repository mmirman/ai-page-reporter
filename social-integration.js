/**
 * social-integration.js
 * Integrates AI Reporter with social media platforms
 */

(function() {
  const PLATFORMS = {
    LINKEDIN: 'linkedin',
    TWITTER: 'twitter',
    FACEBOOK: 'facebook',
    REDDIT: 'reddit'
  };

  // Determine current platform
  function getCurrentPlatform() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('linkedin.com')) return PLATFORMS.LINKEDIN;
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return PLATFORMS.TWITTER;
    if (hostname.includes('facebook.com')) return PLATFORMS.FACEBOOK;
    if (hostname.includes('reddit.com')) return PLATFORMS.REDDIT;
    
    return null;
  }

  const currentPlatform = getCurrentPlatform();
  if (!currentPlatform) return; // Not a supported platform

  console.log(`AI Reporter: Initializing on ${currentPlatform}`);

  // Platform-specific selectors
  const SELECTORS = {
    [PLATFORMS.LINKEDIN]: {
      posts: '.feed-shared-update-v2',
      postContent: '.feed-shared-update-v2__description',
      postActions: '.feed-shared-social-actions'
    },
    [PLATFORMS.TWITTER]: {
      posts: '[data-testid="tweet"]',
      postContent: '[data-testid="tweetText"]',
      postActions: '[role="group"]'
    },
    [PLATFORMS.FACEBOOK]: {
      posts: '[role="article"]',
      postContent: '.userContent',
      postActions: '.UFICommentActorAndBody'
    },
    [PLATFORMS.REDDIT]: {
      posts: '.Post',
      postContent: '.RichTextJSON-root',
      postActions: '.commentarea .entry'
    }
  };

  // Add report button to post
  function addReportButton(post, platform) {
    // Check if button already exists
    if (post.querySelector('.ai-reporter-btn')) return;
    
    const actionsContainer = post.querySelector(SELECTORS[platform].postActions);
    if (!actionsContainer) return;
    
    const reportButton = document.createElement('button');
    reportButton.className = 'ai-reporter-btn';
    reportButton.textContent = 'Report AI';
    reportButton.style.fontSize = '12px';
    reportButton.style.padding = '2px 8px';
    reportButton.style.marginLeft = '8px';
    reportButton.style.borderRadius = '4px';
    reportButton.style.border = '1px solid #ccc';
    reportButton.style.backgroundColor = '#f8f8f8';
    reportButton.style.cursor = 'pointer';
    
    reportButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Get post URL
      let postUrl = '';
      try {
        // Different ways to get post URL depending on platform
        if (platform === PLATFORMS.LINKEDIN) {
          const urlElement = post.querySelector('a.app-aware-link');
          if (urlElement) postUrl = urlElement.href;
        } else if (platform === PLATFORMS.TWITTER) {
          const timeElement = post.querySelector('time');
          if (timeElement && timeElement.parentElement && timeElement.parentElement.tagName === 'A') {
            postUrl = timeElement.parentElement.href;
          }
        } else {
          // For other platforms, use current URL as fallback
          postUrl = window.location.href;
        }
      } catch (err) {
        console.error('Error getting post URL:', err);
        postUrl = window.location.href;
      }
      
      // Get post content
      const contentElement = post.querySelector(SELECTORS[platform].postContent);
      const postContent = contentElement ? contentElement.textContent : '';
      
      // Report to server
      reportPost(postUrl, postContent);
      
      // Visual feedback
      reportButton.textContent = 'Reported';
      reportButton.style.backgroundColor = '#ffcccc';
      reportButton.disabled = true;
    });
    
    actionsContainer.appendChild(reportButton);
  }

  // Report post to server
  function reportPost(url, content) {
    fetch('http://localhost:8080/api/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        aiFlag: true,
        timestamp: Date.now(),
        sessionId: crypto.randomUUID(),
        text: content
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Report response:', data);
    })
    .catch(error => {
      console.error('Error reporting post:', error);
    });
  }

  // Process existing posts
  function processExistingPosts() {
    const posts = document.querySelectorAll(SELECTORS[currentPlatform].posts);
    posts.forEach(post => {
      addReportButton(post, currentPlatform);
    });
  }

  // Process new posts as they appear
  document.arrive(SELECTORS[currentPlatform].posts, function() {
    addReportButton(this, currentPlatform);
  });

  // Initial processing
  processExistingPosts();
  
  // Re-process on scroll (for lazy-loaded content)
  window.addEventListener('scroll', function() {
    setTimeout(processExistingPosts, 500);
  });

  console.log(`AI Reporter: Initialized on ${currentPlatform}`);
})();