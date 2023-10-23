// Define the URLs to block
var urlsToBlock = [
  "https://www.instagram.com/miss_fegz/",
  "https://www.instagram.com/nextupwithfegz/",
  "https://www.instagram.com/koria.brand/",
  "https://www.instagram.com/being.fitfegz/",
  "https://www.tiktok.com/@beingfitfegz/video/7292715046428413190",
  "https://www.tiktok.com/@wakawakafegz",
  "https://www.instagram.com/koriaofficial/"
];

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
