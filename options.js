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
  
  // Add event listeners for expiration date changes
  const expirationInput = document.getElementById('expiration-date');
  expirationInput.addEventListener('change', validateAndUpdateDuration);
  expirationInput.addEventListener('input', updateDurationDisplay); // For real-time updates
  expirationInput.addEventListener('click', updateDurationDisplay); // For clicks on the calendar
  
  // Set default expiration date to tomorrow
  setDefaultExpirationDate();
});

// Set default expiration date to tomorrow
function setDefaultExpirationDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 0, 0);
  
  // Format date for datetime-local input
  const formattedDate = formatDateForInput(tomorrow);
  document.getElementById('expiration-date').value = formattedDate;
  
  // Update duration display
  updateDurationDisplay();
}

// Format date for datetime-local input (YYYY-MM-DDThh:mm)
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Validate expiration date and update duration display
function validateAndUpdateDuration() {
  const expirationInput = document.getElementById('expiration-date');
  const durationDisplay = document.getElementById('duration-display');
  const addButton = document.getElementById('add-button');
  
  if (!expirationInput.value) {
    durationDisplay.textContent = '';
    addButton.disabled = false;
    return;
  }
  
  const expirationDate = new Date(expirationInput.value);
  const now = new Date();
  const minValidTime = new Date(now.getTime() + 10 * 60 * 1000); // Now + 10 minutes
  
  // Check if date is at least 10 minutes in the future
  if (expirationDate < minValidTime) {
    durationDisplay.textContent = '(Invalid: must be at least 10 minutes in the future)';
    durationDisplay.style.color = '#f44336'; // Red color for error
    addButton.disabled = true;
    return;
  }
  
  // Valid date, update duration display
  const durationText = formatDuration(now, expirationDate);
  durationDisplay.textContent = `(${durationText})`;
  durationDisplay.style.color = '#666'; // Reset to normal color
  addButton.disabled = false;
}

// Update the duration display based on selected expiration date
function updateDurationDisplay() {
  const expirationInput = document.getElementById('expiration-date');
  const durationDisplay = document.getElementById('duration-display');
  
  if (!expirationInput.value) {
    durationDisplay.textContent = '';
    return;
  }
  
  const expirationDate = new Date(expirationInput.value);
  const now = new Date();
  
  // Check if date is at least 10 minutes in the future
  const minValidTime = new Date(now.getTime() + 10 * 60 * 1000); // Now + 10 minutes
  if (expirationDate < minValidTime) {
    durationDisplay.textContent = '(Invalid: must be at least 10 minutes in the future)';
    durationDisplay.style.color = '#f44336'; // Red color for error
    return;
  }
  
  const durationText = formatDuration(now, expirationDate);
  durationDisplay.textContent = `(${durationText})`;
  durationDisplay.style.color = '#666'; // Reset to normal color
}

// Format duration between two dates in a human-readable format
function formatDuration(startDate, endDate) {
  // Calculate the difference in milliseconds
  const diff = endDate - startDate;
  
  if (diff <= 0) {
    return 'expired';
  }
  
  // Convert to seconds, minutes, hours, days
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  // Format the duration
  if (years > 0) {
    return years === 1 ? '1 year' : `${years} years`;
  } else if (months > 0) {
    return months === 1 ? '1 month' : `${months} months`;
  } else if (days > 0) {
    return days === 1 ? '1 day' : `${days} days`;
  } else if (hours > 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  } else if (minutes > 0) {
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  } else {
    return seconds === 1 ? '1 second' : `${seconds} seconds`;
  }
}

// Format date for display
function formatDateForDisplay(timestamp) {
  const date = new Date(timestamp);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  };
  return date.toLocaleDateString(undefined, options);
}

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

  // Log the number of items for debugging
  console.log(`Displaying ${blockedItems.length} blocked items`);
  
  // Create a document fragment for better performance
  const fragment = document.createDocumentFragment();
  const now = new Date().getTime();
  
  blockedItems.forEach(function(item, index) {
    const itemElement = document.createElement('div');
    itemElement.className = 'blocked-item';
    
    // Check if item is an object with keyword and expiration
    const keyword = typeof item === 'object' ? item.keyword : item;
    const expiration = typeof item === 'object' ? item.expiration : null;
    
    let expirationHtml = '';
    if (expiration) {
      const expirationDate = new Date(expiration);
      const durationText = formatDuration(new Date(), expirationDate);
      expirationHtml = `<span class="expiration-info">Expires: ${formatDateForDisplay(expiration)} (${durationText})</span>`;
    }
    
    itemElement.innerHTML = `
      <div class="blocked-item-info">
        <span class="keyword-text">${keyword}</span>
        ${expirationHtml}
      </div>
      <div class="item-actions">
        <button class="edit-btn" data-index="${index}">Edit</button>
        <button class="remove-btn" data-index="${index}">Remove</button>
      </div>
    `;
    fragment.appendChild(itemElement);
  });
  
  // Append all items at once
  blockedList.appendChild(fragment);

  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', function() {
      removeBlockedItem(parseInt(this.getAttribute('data-index')));
    });
  });
  
  // Add event listeners to edit buttons
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
      editBlockedItem(parseInt(this.getAttribute('data-index')));
    });
  });
}

// Add a new item to the block list
function addBlockedItem() {
  const input = document.getElementById('block-input');
  const expirationInput = document.getElementById('expiration-date');
  const newKeyword = input.value.trim();
  
  if (!newKeyword) {
    return;
  }

  // Get expiration date if set
  let expiration = null;
  if (expirationInput.value) {
    expiration = new Date(expirationInput.value).getTime();
    
    // Validate expiration date is at least 10 minutes in the future
    const now = Date.now();
    const minValidTime = now + 10 * 60 * 1000; // Now + 10 minutes
    
    if (expiration < minValidTime) {
      showStatus('Expiration date must be at least 10 minutes in the future!');
      return;
    }
  }

  chrome.storage.sync.get(['blockedItems'], function(result) {
    const blockedItems = result.blockedItems || [];
    
    // Check if item already exists
    const existingIndex = blockedItems.findIndex(item => {
      const keyword = typeof item === 'object' ? item.keyword : item;
      return keyword.toLowerCase() === newKeyword.toLowerCase();
    });
    
    if (existingIndex !== -1) {
      showStatus('Item already in block list!');
      return;
    }
    
    // Create the new item object
    const newItem = expiration ? { keyword: newKeyword, expiration } : newKeyword;
    
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
      setDefaultExpirationDate(); // Reset expiration date to default
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

// Show status message
function showStatus(message) {
  const status = document.getElementById('status');
  status.textContent = message;
  setTimeout(function() {
    status.textContent = '';
  }, 2000);
}
// Edit a blocked item
function editBlockedItem(index) {
  chrome.storage.sync.get(['blockedItems'], function(result) {
    const blockedItems = result.blockedItems || [];
    const item = blockedItems[index];
    
    // Check if item is an object with keyword and expiration
    const keyword = typeof item === 'object' ? item.keyword : item;
    const expiration = typeof item === 'object' ? item.expiration : null;
    
    // Fill the input fields with the item's data
    document.getElementById('block-input').value = keyword;
    
    if (expiration) {
      const expirationDate = new Date(expiration);
      document.getElementById('expiration-date').value = formatDateForInput(expirationDate);
    } else {
      setDefaultExpirationDate();
    }
    
    // Update the UI to show we're in edit mode
    const addButton = document.getElementById('add-button');
    addButton.textContent = 'Update Item';
    addButton.dataset.editIndex = index;
    
    // Remove the normal add event listener and add the update event listener
    addButton.removeEventListener('click', addBlockedItem);
    addButton.addEventListener('click', updateBlockedItem);
    
    // Add a cancel button
    const inputGroup = document.querySelector('.input-group');
    if (!document.getElementById('cancel-edit-button')) {
      const cancelButton = document.createElement('button');
      cancelButton.id = 'cancel-edit-button';
      cancelButton.textContent = 'Cancel';
      cancelButton.style.marginLeft = '10px';
      cancelButton.style.backgroundColor = '#f44336';
      cancelButton.addEventListener('click', cancelEdit);
      inputGroup.appendChild(cancelButton);
    }
    
    // Update duration display
    updateDurationDisplay();
    
    // Scroll to the top of the page
    window.scrollTo(0, 0);
    
    // Focus on the input field
    document.getElementById('block-input').focus();
  });
}

// Update a blocked item
function updateBlockedItem() {
  const input = document.getElementById('block-input');
  const expirationInput = document.getElementById('expiration-date');
  const addButton = document.getElementById('add-button');
  const index = parseInt(addButton.dataset.editIndex);
  const newKeyword = input.value.trim();
  
  if (!newKeyword) {
    return;
  }
  
  // Get expiration date if set
  let expiration = null;
  if (expirationInput.value) {
    expiration = new Date(expirationInput.value).getTime();
    
    // Validate expiration date is at least 10 minutes in the future
    const now = Date.now();
    const minValidTime = now + 10 * 60 * 1000; // Now + 10 minutes
    
    if (expiration < minValidTime) {
      showStatus('Expiration date must be at least 10 minutes in the future!');
      return;
    }
  }
  
  chrome.storage.sync.get(['blockedItems'], function(result) {
    const blockedItems = result.blockedItems || [];
    
    // Check if the new keyword already exists in another item
    const existingIndex = blockedItems.findIndex((item, i) => {
      if (i === index) return false; // Skip the item being edited
      const keyword = typeof item === 'object' ? item.keyword : item;
      return keyword.toLowerCase() === newKeyword.toLowerCase();
    });
    
    if (existingIndex !== -1) {
      showStatus('Item already in block list!');
      return;
    }
    
    // Create the updated item object
    const updatedItem = expiration ? { keyword: newKeyword, expiration } : newKeyword;
    
    // Update the item
    blockedItems[index] = updatedItem;
    console.log("Updating blocked item:", updatedItem);
    
    // Save the updated list
    chrome.storage.sync.set({ blockedItems: blockedItems }, function() {
      if (chrome.runtime.lastError) {
        console.error("Error updating item:", chrome.runtime.lastError.message);
        showStatus('Error updating item: ' + chrome.runtime.lastError.message);
        return;
      }
      
      // Update the display
      displayBlockedItems(blockedItems);
      
      // Reset the form
      cancelEdit();
      
      showStatus('Item updated successfully!');
      
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

// Cancel edit mode
function cancelEdit() {
  const addButton = document.getElementById('add-button');
  addButton.textContent = 'Add to Block List';
  delete addButton.dataset.editIndex;
  
  // Remove the update event listener and add back the normal add event listener
  addButton.removeEventListener('click', updateBlockedItem);
  addButton.addEventListener('click', addBlockedItem);
  
  // Remove the cancel button
  const cancelButton = document.getElementById('cancel-edit-button');
  if (cancelButton) {
    cancelButton.remove();
  }
  
  // Clear the input fields
  document.getElementById('block-input').value = '';
  setDefaultExpirationDate();
}
