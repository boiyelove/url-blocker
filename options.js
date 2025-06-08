// Initialize the options page
document.addEventListener('DOMContentLoaded', function() {
  console.log("Options page loaded");
  
  // Load saved blocked items
  loadBlockedItems();

  // Add event listeners
  document.getElementById('add-button').addEventListener('click', addBlockedItem);
  
  // Add enter key support for the input field
  document.getElementById('block-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addBlockedItem();
    }
  });
});

// Load blocked items from storage
function loadBlockedItems() {
  chrome.storage.sync.get(['blockedItems'], function(result) {
    const blockedItems = result.blockedItems || [];
    console.log("Options page loaded items:", blockedItems);
    displayBlockedItems(blockedItems);
  });
}

// Display blocked items in the list
function displayBlockedItems(blockedItems) {
  const blockedList = document.getElementById('blocked-list');
  blockedList.innerHTML = '';

  if (blockedItems.length === 0) {
    blockedList.innerHTML = '<p>No items in block list.</p>';
    return;
  }

  blockedItems.forEach(function(item, index) {
    const itemElement = document.createElement('div');
    itemElement.className = 'blocked-item';
    itemElement.innerHTML = `
      <span>${item}</span>
      <button class="remove-btn" data-index="${index}">Remove</button>
    `;
    blockedList.appendChild(itemElement);
  });

  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', function() {
      removeBlockedItem(parseInt(this.getAttribute('data-index')));
    });
  });
}

// Add a new item to the block list
function addBlockedItem() {
  const input = document.getElementById('block-input');
  const newItem = input.value.trim();
  
  if (!newItem) {
    return;
  }

  chrome.storage.sync.get(['blockedItems'], function(result) {
    const blockedItems = result.blockedItems || [];
    
    // Check if item already exists
    if (blockedItems.includes(newItem)) {
      showStatus('Item already in block list!');
      return;
    }
    
    // Add the new item
    blockedItems.push(newItem);
    console.log("Adding new item to blocked list:", newItem);
    
    // Save the updated list
    chrome.storage.sync.set({ blockedItems: blockedItems }, function() {
      if (chrome.runtime.lastError) {
        console.error("Error adding item:", chrome.runtime.lastError.message);
        showStatus('Error adding item: ' + chrome.runtime.lastError.message);
        return;
      }
      
      // Update the display
      displayBlockedItems(blockedItems);
      input.value = '';
      showStatus('Item added successfully!');
      
      // Notify the background script to update rules
      chrome.runtime.sendMessage({ action: "updateBlockedItems" }, function(response) {
        console.log("Background script response:", response);
        if (response && response.success) {
          console.log("Rules updated successfully with", response.itemCount, "items");
        } else if (response) {
          console.error("Error updating rules:", response.error);
        }
      });
    });
  });
}

// Remove an item from the block list
function removeBlockedItem(index) {
  chrome.storage.sync.get(['blockedItems'], function(result) {
    const blockedItems = result.blockedItems || [];
    const removedItem = blockedItems[index];
    blockedItems.splice(index, 1);
    console.log("Removing item from blocked list:", removedItem);
    
    chrome.storage.sync.set({ blockedItems: blockedItems }, function() {
      if (chrome.runtime.lastError) {
        console.error("Error removing item:", chrome.runtime.lastError.message);
        showStatus('Error removing item: ' + chrome.runtime.lastError.message);
        return;
      }
      displayBlockedItems(blockedItems);
      showStatus('Item removed successfully!');
      
      // Notify the background script to update rules
      chrome.runtime.sendMessage({ action: "updateBlockedItems" }, function(response) {
        console.log("Background script response:", response);
        if (response && response.success) {
          console.log("Rules updated successfully with", response.itemCount, "items");
        } else if (response) {
          console.error("Error updating rules:", response.error);
        }
      });
    });
  });
}

// Save changes to storage
// This function is currently redundant as add/remove save immediately.
// function saveChanges() {
//   showStatus('Changes saved!'); // Or 'Settings saved!'
// }

// Show status message
function showStatus(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  setTimeout(function() {
    status.textContent = '';
  }, 2000);
}