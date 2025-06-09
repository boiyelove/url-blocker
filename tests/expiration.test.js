// Tests for expiration functionality

// Mock Chrome API
global.chrome = {
  runtime: {
    getURL: jest.fn().mockReturnValue('chrome-extension://id/blocked.html'),
    onInstalled: { addListener: jest.fn() },
    onMessage: { addListener: jest.fn() },
    lastError: null,
    sendMessage: jest.fn()
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
    onChanged: { addListener: jest.fn() }
  },
  tabs: {
    query: jest.fn(),
    update: jest.fn(),
    get: jest.fn(),
    onUpdated: { addListener: jest.fn() }
  },
  alarms: {
    create: jest.fn(),
    onAlarm: { addListener: jest.fn() },
    clear: jest.fn()
  }
};

describe('Expiration Functionality', () => {
  // Define the test functions directly in the test file
  let currentBlockedItems = [];
  const BLOCKED_PAGE_URL = 'chrome-extension://id/blocked.html';
  
  // Check for and remove expired items
  async function checkAndRemoveExpiredItems() {
    try {
      const blockedItems = [...currentBlockedItems]; // Create a copy to avoid mutation during iteration
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
      
      // If any items expired, update the list
      if (hasExpired) {
        currentBlockedItems = updatedItems;
        return true; // Indicates items were removed
      }
      return false; // No items were removed
    } catch (error) {
      console.error("Error checking for expired items:", error);
      return false;
    }
  }
  
  // Simulate a page visit and check for expired items
  async function simulatePageVisit(url) {
    // First check if any items have expired
    const itemsRemoved = await checkAndRemoveExpiredItems();
    
    // Then check if the page should be blocked
    const shouldBlock = currentBlockedItems.some(item => {
      const keyword = typeof item === 'object' ? item.keyword : item;
      return url.toLowerCase().includes(keyword.toLowerCase());
    });
    
    return {
      itemsRemoved,
      shouldBlock
    };
  }
  
  beforeEach(() => {
    // Reset the blocked items before each test
    currentBlockedItems = [];
  });
  
  test('should remove expired items during page visit', async () => {
    const now = Date.now();
    
    // Set up test data with one expired item and one valid item
    currentBlockedItems = [
      { keyword: 'expired', expiration: now - 10000 }, // Expired 10 seconds ago
      { keyword: 'valid', expiration: now + 10000 },   // Expires in 10 seconds
      'noexpiry'                                       // No expiration
    ];
    
    // Simulate visiting a page
    const result = await simulatePageVisit('https://example.com/test');
    
    // Check that expired item was removed
    expect(currentBlockedItems.length).toBe(2);
    expect(currentBlockedItems.find(item => 
      typeof item === 'object' && item.keyword === 'expired'
    )).toBeUndefined();
    
    // Valid items should still be there
    expect(currentBlockedItems.find(item => 
      typeof item === 'object' && item.keyword === 'valid'
    )).toBeDefined();
    expect(currentBlockedItems.includes('noexpiry')).toBe(true);
    
    // The result should indicate items were removed
    expect(result.itemsRemoved).toBe(true);
  });
  
  test('should not remove non-expired items', async () => {
    const now = Date.now();
    
    // Set up test data with only valid items
    currentBlockedItems = [
      { keyword: 'valid1', expiration: now + 10000 },  // Expires in 10 seconds
      { keyword: 'valid2', expiration: now + 20000 },  // Expires in 20 seconds
      'noexpiry'                                       // No expiration
    ];
    
    // Simulate visiting a page
    const result = await simulatePageVisit('https://example.com/test');
    
    // Check that no items were removed
    expect(currentBlockedItems.length).toBe(3);
    expect(result.itemsRemoved).toBe(false);
  });
  
  test('should block page with matching keyword after removing expired items', async () => {
    const now = Date.now();
    
    // Set up test data with one expired item and one valid matching item
    currentBlockedItems = [
      { keyword: 'expired', expiration: now - 10000 }, // Expired 10 seconds ago
      { keyword: 'test', expiration: now + 10000 },    // Expires in 10 seconds
      'noexpiry'                                       // No expiration
    ];
    
    // Simulate visiting a page that matches a valid keyword
    const result = await simulatePageVisit('https://example.com/test-page');
    
    // Check that expired item was removed
    expect(currentBlockedItems.length).toBe(2);
    
    // The result should indicate the page should be blocked
    expect(result.shouldBlock).toBe(true);
  });
  
  test('should not block page after its keyword has expired', async () => {
    const now = Date.now();
    
    // Set up test data with an expired matching keyword
    currentBlockedItems = [
      { keyword: 'test', expiration: now - 10000 },    // Expired 10 seconds ago
      { keyword: 'other', expiration: now + 10000 },   // Expires in 10 seconds
      'noexpiry'                                       // No expiration
    ];
    
    // Simulate visiting a page that matches the expired keyword
    const result = await simulatePageVisit('https://example.com/test-page');
    
    // Check that expired item was removed
    expect(currentBlockedItems.length).toBe(2);
    expect(currentBlockedItems.find(item => 
      typeof item === 'object' && item.keyword === 'test'
    )).toBeUndefined();
    
    // The result should indicate the page should not be blocked
    expect(result.shouldBlock).toBe(false);
  });
});
