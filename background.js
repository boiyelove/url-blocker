// Define the keywords to match
var keywordsToMatch = ["miss_fegz","nextupwithfegz","koria.brand", "fegz","being.fitfegz", "fega", "koria"];


// Function to check if a URL, page title, or AJAX request contains keywords
function containsKeywords(details) {
  var url = details.url || "";
  var pageTitle = details.title || "";
  var requestData = details.requestBody ? details.requestBody.formData : {};

  // Check if URL, page title, or request data contains keywords
  return (
    keywordsToMatch.some(keyword => url.includes(keyword)) ||
    keywordsToMatch.some(keyword => pageTitle.includes(keyword)) ||
    Object.values(requestData).some(value =>
      keywordsToMatch.some(keyword => value.includes(keyword))
    )
  );
}

// Listen for web requests and block URLs that match
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (containsKeywords(details)) {
      return { cancel: true };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// Listen for changes in the URL for SPAs
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  if (containsKeywords(details)) {
    chrome.tabs.update(details.tabId, { url: "about:blank" });
  }
});

// Listen for completed AJAX requests
chrome.webRequest.onCompleted.addListener(
  function(details) {
    if (containsKeywords(details)) {
      // Handle the completed AJAX request as needed
      console.log("Blocked AJAX request:", details);
    }
  },
  { urls: ["<all_urls>"] }
);
