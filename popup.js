// This script runs when the extension's popup is opened
// It can interact with the background script and modify the popup's behavior

console.log("URL Blocker popup script loaded");

// Get the input field and block button elements
var urlInput = document.getElementById("url-input");
var blockButton = document.getElementById("block-button");

// Add a click event listener to the block button
blockButton.addEventListener("click", function() {
  // Get the URL to block from the input field
  var urlToBlock = urlInput.value;

  // Send a message to the background script to block the URL
  chrome.runtime.sendMessage({type: "block-url", url: urlToBlock});
});
