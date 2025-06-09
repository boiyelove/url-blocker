let currentBlockedItems = [];
const BLOCKED_PAGE_URL = chrome.runtime.getURL("blocked.html");
const DNR_RULE_ID_START = 1; // Start IDs for our dynamic rules
const CHECK_EXPIRATION_INTERVAL = 60000; // Check every minute

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
  return items.some(item => {
    const keyword = typeof item === 'object' ? item.keyword : item;
    return lowerUrl.includes(keyword.toLowerCase());
  });
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

  return items.some(item => {
    const keyword = typeof item === 'object' ? item.keyword : item;
    return lowerUrl.includes(keyword.toLowerCase()) || lowerTitle.includes(keyword.toLowerCase());
  });
}

// --- Context Menu Block Functions ---

// Block a single page URL
async function blockSinglePage(url) {
  try {
    // Extract the page path without query parameters
    const urlObj = new URL(url);
    const pagePath = urlObj.pathname;
    
    // Create a keyword that will match this specific page
    const keyword = urlObj.hostname + pagePath;
    
    await addBlockedKeyword(keyword);
    console.log(`Blocked single page: ${keyword}`);
    
    // Reload the tab if it's the current page
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url.includes(keyword)) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  } catch (error) {
    console.error("Error blocking single page:", error);
  }
}

// Block an entire domain
async function blockEntireDomain(url) {
  try {
    // Extract just the domain
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    await addBlockedKeyword(domain);
    console.log(`Blocked entire domain: ${domain}`);
    
    // Reload the tab if it's on the same domain
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url.includes(domain)) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  } catch (error) {
    console.error("Error blocking domain:", error);
  }
}

// Add a keyword to the blocked list
async function addBlockedKeyword(keyword) {
  // Get current blocked items
  const result = await chrome.storage.sync.get(['blockedItems']);
  const blockedItems = result.blockedItems || [];
  
  // Check if keyword already exists
  if (blockedItems.some(item => {
    const itemKeyword = typeof item === 'object' ? item.keyword : item;
    return itemKeyword.toLowerCase() === keyword.toLowerCase();
  })) {
    console.log(`Keyword already blocked: ${keyword}`);
    return;
  }
  
  // Add the new keyword
  blockedItems.push(keyword);
  
  // Save updated list
  await chrome.storage.sync.set({ blockedItems });
  
  // Update current items and rules
  await loadAndSetBlockedItems();
  await updateDeclarativeNetRequestRules();
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

    // Create rules for each blocked item with unique IDs
    const rulesToAdd = currentBlockedItems.map((item, index) => {
      const keyword = typeof item === 'object' ? item.keyword : item;
      // Ensure each rule has a unique ID by using the index
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
          urlFilter: "*" + keyword.toLowerCase() + "*",
          resourceTypes: ["main_frame"] // Primarily block main page navigations
        }
      };
    });
    
    // Check for duplicate IDs before adding rules
    const uniqueIds = new Set();
    const filteredRules = rulesToAdd.filter(rule => {
      if (uniqueIds.has(rule.id)) {
        console.warn(`Duplicate rule ID found: ${rule.id}. Skipping this rule.`);
        return false;
      }
      uniqueIds.add(rule.id);
      return true;
    });

    // Update the rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIdsToRemove,
      addRules: filteredRules
    });
    
    console.log("Rules updated:", rulesToAdd.length, "rules added for items:", currentBlockedItems);
  } catch (error) {
    console.error("Error updating DNR rules:", error);
  }
}

// Check for and remove expired items
async function checkAndRemoveExpiredItems() {
  try {
    const result = await chrome.storage.sync.get(['blockedItems']);
    const blockedItems = result.blockedItems || [];
    const now = Date.now();
    let hasExpired = false;
    
    // Filter out expired items
    const updatedItems = blockedItems.filter(item => {
      if (typeof item === 'object' && item.expiration && item.expiration <= now) {
        console.log(`Item expired and will be removed: ${item.keyword}`);
        hasExpired = true;
        return false;
      }
      return true;
    });
    
    // If any items expired, update storage and rules
    if (hasExpired) {
      await chrome.storage.sync.set({ blockedItems: updatedItems });
      currentBlockedItems = updatedItems;
      await updateDeclarativeNetRequestRules();
      console.log("Expired items removed, rules updated");
      return true; // Indicates items were removed
    }
    return false; // No items were removed
  } catch (error) {
    console.error("Error checking for expired items:", error);
    return false;
  }
}

// Initialize on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  // Create context menu items
  chrome.contextMenus.create({
    id: "urlBlockerMenu",
    title: "Block this page",
    contexts: ["page", "link"]
  });
  
  // Create sub-menu items
  chrome.contextMenus.create({
    id: "blockSinglePage",
    parentId: "urlBlockerMenu",
    title: "Block single page",
    contexts: ["page", "link"]
  });
  
  chrome.contextMenus.create({
    id: "blockEntireDomain",
    parentId: "urlBlockerMenu",
    title: "Block entire domain",
    contexts: ["page", "link"]
  });
  
  chrome.contextMenus.create({
    id: "moreOptions",
    parentId: "urlBlockerMenu",
    title: "More...",
    contexts: ["page", "link"]
  });

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
  
  // Run initial check for expired items
  await checkAndRemoveExpiredItems();
  
  // Set up periodic check for expired items
  setInterval(checkAndRemoveExpiredItems, CHECK_EXPIRATION_INTERVAL);
  
  // Set up alarm for daily cleanup (more reliable than setInterval for long periods)
  chrome.alarms.create('cleanupExpiredItems', { periodInMinutes: 60 }); // Check every hour
  
  // Log the current state for debugging
  console.log("Extension initialized with blocked items:", currentBlockedItems);
});

// Listen for alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanupExpiredItems') {
    console.log("Running scheduled cleanup of expired items");
    await checkAndRemoveExpiredItems();
  }
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Determine which URL to block based on context
  const url = info.linkUrl || tab.url;
  if (!url) return;
  
  try {
    switch (info.menuItemId) {
      case "blockSinglePage":
        await blockSinglePage(url);
        break;
      case "blockEntireDomain":
        await blockEntireDomain(url);
        break;
      case "moreOptions":
        // Open the extension popup/options
        chrome.action.openPopup();
        break;
    }
  } catch (error) {
    console.error("Error handling context menu click:", error);
  }
});

// Listen for changes in storage to keep currentBlockedItems up-to-date
chrome.storage.onChanged.addListener(async function(changes, namespace) {
  if (namespace === 'sync' && changes.blockedItems) {
    console.log("Storage changed. New blocked items:", changes.blockedItems.newValue);
    currentBlockedItems = changes.blockedItems.newValue || [];
    await updateDeclarativeNetRequestRules();
    
    // Check all open tabs to see if they should be blocked with the new rules
    await checkAllOpenTabs();
  }
});

// Function to check all open tabs against current block rules
async function checkAllOpenTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    console.log(`Checking ${tabs.length} open tabs against updated block rules`);
    
    for (const tab of tabs) {
      // Skip chrome:// URLs and extension pages
      if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
        continue;
      }
      
      if (isPageContentPotentiallyBlocked({ url: tab.url, title: tab.title }, currentBlockedItems)) {
        console.log(`Tab should be blocked: ${tab.url}`);
        chrome.tabs.update(tab.id, { 
          url: BLOCKED_PAGE_URL + "?originalUrl=" + encodeURIComponent(tab.url)
        });
      }
    }
  } catch (error) {
    console.error("Error checking open tabs:", error);
  }
}

// Listen for tab updates to check URL/title (e.g., after page load)
chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith("chrome-extension://")) {
    // First check for expired items
    await checkAndRemoveExpiredItems();
    
    // Then check if the page should be blocked
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
chrome.webNavigation.onHistoryStateUpdated.addListener(async function(details) {
  // Check for expired items first
  await checkAndRemoveExpiredItems();
  
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
