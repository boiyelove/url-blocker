// This script runs when the extension's popup is opened
document.addEventListener('DOMContentLoaded', function() {
  // Get the input field and block button elements
  var urlInput = document.getElementById("url-input");
  var blockButton = document.getElementById("block-button");
  var optionsLink = document.getElementById("options-link");
  var statusMessage = document.getElementById("status-message"); // Assuming you add <p id="status-message"></p> to popup.html

  // Add a click event listener to the block button
  blockButton.addEventListener("click", function() {
    // Get the URL to block from the input field
    var itemToBlock = urlInput.value.trim();
    
    if (!itemToBlock) {
      return;
    }

    // Add the item to the blocked list
    chrome.storage.sync.get(['blockedItems'], function(result) {
      const blockedItems = result.blockedItems || [];
      
      // Check if item already exists
      if (blockedItems.includes(itemToBlock)) {
        showStatus('Item already blocked!');
        return;
      }
      
      blockedItems.push(itemToBlock);
      chrome.storage.sync.set({ blockedItems: blockedItems }, function() {
        if (chrome.runtime.lastError) {
          console.error("Error adding item from popup:", chrome.runtime.lastError.message);
          showStatus('Error: ' + chrome.runtime.lastError.message);
          return;
        }
        urlInput.value = '';
        showStatus('Item blocked successfully!');
        
        // Notify the background script to update rules
        chrome.runtime.sendMessage({ action: "updateBlockedItems" });
      });
    });
  });

  // Add a click event listener to the options link
  optionsLink.addEventListener("click", function() {
    chrome.runtime.openOptionsPage();
  });

  function showStatus(message) {
    if (statusMessage) {
      statusMessage.textContent = message;
      setTimeout(function() {
        statusMessage.textContent = '';
      }, 2000);
    } else {
      console.log(message); // Fallback if status element doesn't exist
    }
  }
});