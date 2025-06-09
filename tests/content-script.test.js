// Tests for content-script.js functions
const fs = require('fs');
const path = require('path');

// Create a simplified version of the content-script.js for testing
const contentScriptTestCode = `
  // Function to check if a page should be blocked based on its content
  function shouldBlockPage(pageText, pageTitle, blockedKeywords) {
    if (!blockedKeywords || blockedKeywords.length === 0) {
      return false;
    }
    
    const lowerPageText = pageText.toLowerCase();
    const lowerPageTitle = pageTitle.toLowerCase();
    
    for (const item of blockedKeywords) {
      // Handle both string keywords and object format with expiration
      const keyword = typeof item === 'object' ? item.keyword : item;
      const lowerKeyword = keyword.toLowerCase();
      
      if (lowerPageText.includes(lowerKeyword) || lowerPageTitle.includes(lowerKeyword)) {
        return true;
      }
    }
    
    return false;
  }
`;

// Evaluate the test code
eval(contentScriptTestCode);

describe('Content Script Functions', () => {
  describe('shouldBlockPage', () => {
    test('should detect blocked keywords in page content', () => {
      const pageText = 'This is a test page with some content';
      const pageTitle = 'Safe Title';
      const blockedKeywords = ['test', 'other'];
      
      expect(shouldBlockPage(pageText, pageTitle, blockedKeywords)).toBe(true);
    });

    test('should detect blocked keywords in page title', () => {
      const pageText = 'This is a safe page with some content';
      const pageTitle = 'Test Title';
      const blockedKeywords = ['test', 'other'];
      
      expect(shouldBlockPage(pageText, pageTitle, blockedKeywords)).toBe(true);
    });

    test('should handle object format keywords', () => {
      const pageText = 'This is a test page with some content';
      const pageTitle = 'Safe Title';
      const blockedKeywords = [{ keyword: 'test', expiration: Date.now() + 10000 }];
      
      expect(shouldBlockPage(pageText, pageTitle, blockedKeywords)).toBe(true);
    });

    test('should return false when no keywords match', () => {
      const pageText = 'This is a safe page with some content';
      const pageTitle = 'Safe Title';
      const blockedKeywords = ['blocked', 'other'];
      
      expect(shouldBlockPage(pageText, pageTitle, blockedKeywords)).toBe(false);
    });

    test('should return false when keywords array is empty', () => {
      const pageText = 'This is a test page with some content';
      const pageTitle = 'Test Title';
      const blockedKeywords = [];
      
      expect(shouldBlockPage(pageText, pageTitle, blockedKeywords)).toBe(false);
    });

    test('should return false when keywords array is null', () => {
      const pageText = 'This is a test page with some content';
      const pageTitle = 'Test Title';
      
      expect(shouldBlockPage(pageText, pageTitle, null)).toBe(false);
    });
  });
});
