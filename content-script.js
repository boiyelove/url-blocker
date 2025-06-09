let currentBlockedKeywordsCS = [];
const CS_BLOCKED_PAGE_URL_FRAGMENT = chrome.runtime.getURL("blocked.html").split('/').pop();

function scanPageContent() {
  if (currentBlockedKeywordsCS.length === 0) {
    return;
  }

  // Avoid scanning if already on the blocked page
  if (window.location.href.includes(CS_BLOCKED_PAGE_URL_FRAGMENT)) {
    return;
  }

  const pageText = document.body.innerText.toLowerCase();
  const pageTitle = document.title.toLowerCase();

  for (const item of currentBlockedKeywordsCS) {
    // Handle both string keywords and object format with expiration
    const keyword = typeof item === 'object' ? item.keyword : item;
    const lowerKeyword = keyword.toLowerCase();
    
    if (pageText.includes(lowerKeyword) || pageTitle.includes(lowerKeyword)) {
      console.log(`URL Blocker: Blocked keyword found on page: ${keyword}`);
      chrome.runtime.sendMessage({
        action: "contentBlocked",
        originalUrl: window.location.href,
        keywordFound: keyword
      });
      return; // Stop scanning once a keyword is found and message sent
    }
  }
}

function loadKeywordsAndScan() {
  chrome.storage.sync.get(['blockedItems'], function(result) {
    if (chrome.runtime.lastError) {
      console.error("ContentScript: Error loading blockedItems", chrome.runtime.lastError.message);
      return;
    }
    currentBlockedKeywordsCS = result.blockedItems || [];
    console.log("ContentScript: Loaded blocked items:", currentBlockedKeywordsCS);
    scanPageContent(); // Initial scan after loading keywords
  });

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && changes.blockedItems) {
      currentBlockedKeywordsCS = changes.blockedItems.newValue || [];
      console.log("ContentScript: Updated blocked items:", currentBlockedKeywordsCS);
      scanPageContent(); // Re-scan if keywords change
    }
  });
}

// Set up a mutation observer to detect content changes
function setupMutationObserver() {
  const observer = new MutationObserver(function(mutations) {
    // Debounce the scan to avoid excessive processing
    if (window.scanTimeout) {
      clearTimeout(window.scanTimeout);
    }
    window.scanTimeout = setTimeout(scanPageContent, 500);
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    characterData: true
  });
}

// Run only in the top-most frame to avoid multiple executions in iframes
if (window.self === window.top) {
  // Wait for the DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      loadKeywordsAndScan();
      setupMutationObserver();
    });
  } else {
    loadKeywordsAndScan();
    setupMutationObserver();
  }
}
