// Define the URLs to block
var urlsToBlock = [  "https://www.instagram.com/miss_fegz/",  "https://www.instagram.com/nextupwithfegz/",  "https://www.instagram.com/koria.brand/", "https://www.instagram.com/being.fitfegz/"];

// Listen for web requests and block URLs that match
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (urlsToBlock.includes(details.url)) {
      return {cancel: true};
    }
  },
  {urls: ["<all_urls>"]},
  ["blocking"]
);
