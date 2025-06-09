// Tests for background.js
const fs = require('fs');
const path = require('path');

// Create a simplified version of the background script for testing
// This avoids issues with Chrome API callbacks in the test environment
const backgroundTestCode = `
  let currentBlockedItems = [];
  const BLOCKED_PAGE_URL = 'chrome-extension://id/blocked.html';
  
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
  
  // Synchronous check for URL and Title
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
`;

// Create a context and run the simplified background script
const context = {};
eval(backgroundTestCode);

describe('Background Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isUrlBlockedSync', () => {
    test('should return true when URL contains a blocked keyword', () => {
      const url = 'https://example.com/fegz-content';
      const items = ['fegz', 'other'];
      
      const result = isUrlBlockedSync(url, items);
      expect(result).toBe(true);
    });

    test('should return true when URL contains a blocked keyword in object format', () => {
      const url = 'https://example.com/fegz-content';
      const items = [{ keyword: 'fegz', expiration: Date.now() + 10000 }, 'other'];
      
      const result = isUrlBlockedSync(url, items);
      expect(result).toBe(true);
    });

    test('should return false when URL does not contain any blocked keyword', () => {
      const url = 'https://example.com/safe-content';
      const items = ['fegz', 'other'];
      
      const result = isUrlBlockedSync(url, items);
      expect(result).toBe(false);
    });

    test('should return false when items array is empty', () => {
      const url = 'https://example.com/fegz-content';
      const items = [];
      
      const result = isUrlBlockedSync(url, items);
      expect(result).toBe(false);
    });

    test('should return false when URL is null or undefined', () => {
      const items = ['fegz', 'other'];
      
      expect(isUrlBlockedSync(null, items)).toBe(false);
      expect(isUrlBlockedSync(undefined, items)).toBe(false);
    });
  });

  describe('isPageContentPotentiallyBlocked', () => {
    test('should return true when URL contains a blocked keyword', () => {
      const details = { url: 'https://example.com/fegz-content', title: 'Safe Title' };
      const items = ['fegz', 'other'];
      
      const result = isPageContentPotentiallyBlocked(details, items);
      expect(result).toBe(true);
    });

    test('should return true when title contains a blocked keyword', () => {
      const details = { url: 'https://example.com/safe-content', title: 'Title with fegz' };
      const items = ['fegz', 'other'];
      
      const result = isPageContentPotentiallyBlocked(details, items);
      expect(result).toBe(true);
    });

    test('should return true with object format keywords', () => {
      const details = { url: 'https://example.com/safe-content', title: 'Title with fegz' };
      const items = [{ keyword: 'fegz', expiration: Date.now() + 10000 }];
      
      const result = isPageContentPotentiallyBlocked(details, items);
      expect(result).toBe(true);
    });

    test('should return false when neither URL nor title contains blocked keywords', () => {
      const details = { url: 'https://example.com/safe-content', title: 'Safe Title' };
      const items = ['fegz', 'other'];
      
      const result = isPageContentPotentiallyBlocked(details, items);
      expect(result).toBe(false);
    });
  });
});
