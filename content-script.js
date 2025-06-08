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

  for (const keyword of currentBlockedKeywordsCS) {
    const lowerKeyword = keyword.toLowerCase();
    if (pageText.includes(lowerKeyword) || pageTitle.includes(lowerKeyword)) {
      // console.log(`URL Blocker: Blocked keyword found on page: ${keyword}`);
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
    scanPageContent(); // Initial scan after loading keywords
  });

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && changes.blockedItems) {
      currentBlockedKeywordsCS = changes.blockedItems.newValue || [];
      scanPageContent(); // Re-scan if keywords change
    }
  });
}

// Run only in the top-most frame to avoid multiple executions in iframes
if (window.self === window.top) {
    loadKeywordsAndScan();
}

// Example: Modify the background color of all <body> elements
// document.body.style.backgroundColor = "red";
