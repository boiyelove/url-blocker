let currentBlockedItems = [];
const BLOCKED_PAGE_URL = chrome.runtime.getURL("blocked.html");
const DNR_RULE_ID_START = 1; // Start IDs for our dynamic rules

// Function to load/reload blocked items into currentBlockedItems
function loadAndSetBlockedItems() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['blockedItems'], function(result) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching blockedItems:", chrome.runtime.lastError.message);
        currentBlockedItems = []; // Fallback
        reject(chrome.runtime.lastError);
        return;
      }
      currentBlockedItems = result.blockedItems || [];
      console.log("Loaded blocked items:", currentBlockedItems);
      resolve(currentBlockedItems);
    });
  });
}

// Function for synchronous URL checking
function isUrlBlockedSync(url, items) {
  if (!url || !items || items.length === 0) {
    return false;
  }
  const lowerUrl = url.toLowerCase();
  return items.some(keyword => lowerUrl.includes(keyword.toLowerCase()));
}

// Synchronous check for URL and Title (used by onUpdated, onHistoryStateUpdated)
function isPageContentPotentiallyBlocked(details, items) {
  const url = details.url || "";
  const pageTitle = details.title || "";

  if (!items || items.length === 0) {
    return false;
  }
  const lowerUrl = url.toLowerCase();
  const lowerTitle = pageTitle.toLowerCase();

  return items.some(keyword => lowerUrl.includes(keyword.toLowerCase())) ||
         items.some(keyword => lowerTitle.includes(keyword.toLowerCase()));
}

// --- DeclarativeNetRequest Rule Management ---
async function updateDeclarativeNetRequestRules() {
  try {
    // Check if the API is available
    if (!chrome.declarativeNetRequest) {
      console.error("declarativeNetRequest API is not available.");
      return;
    }

    // Get existing rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = existingRules
      .filter(rule => rule.id >= DNR_RULE_ID_START) // Remove only our rules
      .map(rule => rule.id);

    // Create rules for each blocked item
    const rulesToAdd = currentBlockedItems.map((item, index) => {
      return {
        id: DNR_RULE_ID_START + index,
        priority: 1,
        action: {
          type: "redirect",
          redirect: {
            url: BLOCKED_PAGE_URL + "?originalUrl={url}"
          }
        },
        condition: {
          urlFilter: item.toLowerCase(),
          resourceTypes: ["main_frame"] // Primarily block main page navigations
        }
      };
    });

    // Update the rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIdsToRemove,
      addRules: rulesToAdd
    });
    
    console.log("Rules updated:", rulesToAdd.length, "rules added for items:", currentBlockedItems);
  } catch (error) {
    console.error("Error updating DNR rules:", error);
  }
}

// Initialize on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    const result = await chrome.storage.sync.get(['blockedItems']);
    if (!result || !result.blockedItems) {
      const defaultItems = ["miss_fegz", "nextupwithfegz", "koria.brand", "fegz", "being.fitfegz", "fega", "koria"];
      await chrome.storage.sync.set({ blockedItems: defaultItems });
      console.log("Default blocked items set.");
    }
  }
  // Always ensure currentBlockedItems is populated after install/update
  await loadAndSetBlockedItems().catch(err => console.error("Failed to load items after install/update", err));
  
  // Initialize declarativeNetRequest rules
  await updateDeclarativeNetRequestRules();
  
  // Log the current state for debugging
  console.log("Extension initialized with blocked items:", currentBlockedItems);
});

// Listen for changes in storage to keep currentBlockedItems up-to-date
chrome.storage.onChanged.addListener(async function(changes, namespace) {
  if (namespace === 'sync' && changes.blockedItems) {
    console.log("Storage changed. New blocked items:", changes.blockedItems.newValue);
    currentBlockedItems = changes.blockedItems.newValue || [];
    await updateDeclarativeNetRequestRules();
  }
});

// Listen for tab updates to check URL/title (e.g., after page load)
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith("chrome-extension://")) {
    if (isPageContentPotentiallyBlocked({ url: tab.url, title: tab.title }, currentBlockedItems)) {
      // Check if the tab still exists and its URL hasn't changed to the blocked page already
      chrome.tabs.get(tabId, function(updatedTabInfo) {
        if (chrome.runtime.lastError || !updatedTabInfo) return; // Tab closed or error
        if (updatedTabInfo.url && !updatedTabInfo.url.startsWith(BLOCKED_PAGE_URL)) {
           chrome.tabs.update(tabId, { 
             url: BLOCKED_PAGE_URL + "?originalUrl=" + encodeURIComponent(tab.url)
           });
        }
      });
    }
  }
});

// Listen for changes in the URL for SPAs
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  // Check only for main frame updates and relevant URLs
  if (details.frameId === 0 && details.url && !details.url.startsWith("chrome-extension://")) {
    chrome.tabs.get(details.tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) return; // Tab closed or error
      if (isPageContentPotentiallyBlocked({ url: details.url, title: tab.title }, currentBlockedItems)) {
         if (tab.url && !tab.url.startsWith(BLOCKED_PAGE_URL)) {
          chrome.tabs.update(details.tabId, { 
            url: BLOCKED_PAGE_URL + "?originalUrl=" + encodeURIComponent(details.url)
          });
         }
      }
    });
  }
});

// Listen for messages from content scripts and options page
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Handle content script blocking request
  if (request.action === "contentBlocked") {
    if (sender.tab && sender.tab.id) {
      chrome.tabs.get(sender.tab.id, function(tabInfo) {
        if (chrome.runtime.lastError || !tabInfo) return; // Tab closed or error
        if (tabInfo.url && !tabInfo.url.startsWith(BLOCKED_PAGE_URL)) {
          chrome.tabs.update(sender.tab.id, {
            url: BLOCKED_PAGE_URL + "?originalUrl=" + encodeURIComponent(request.originalUrl || sender.tab.url)
          });
        }
      });
    }
    return true; // Indicates you might send a response asynchronously
  }
  
  // Handle options page update request
  if (request.action === "updateBlockedItems") {
    console.log("Received updateBlockedItems message");
    loadAndSetBlockedItems()
      .then(() => {
        console.log("Items loaded from storage:", currentBlockedItems);
        return updateDeclarativeNetRequestRules();
      })
      .then(() => {
        if (sendResponse) {
          sendResponse({success: true, itemCount: currentBlockedItems.length});
        }
      })
      .catch(err => {
        console.error("Failed to update blocked items:", err);
        if (sendResponse) {
          sendResponse({success: false, error: err.message});
        }
      });
    return true; // Keep the message channel open for sendResponse
  }
});