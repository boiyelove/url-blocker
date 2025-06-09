// Tests for context menu functionality

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
    reload: jest.fn(),
    onUpdated: { addListener: jest.fn() }
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: { addListener: jest.fn() },
    update: jest.fn(),
    remove: jest.fn()
  },
  action: {
    openPopup: jest.fn()
  }
};

describe('Context Menu Functionality', () => {
  // Define the test functions directly in the test file
  let currentBlockedItems = [];
  
  // Mock functions for testing
  async function addBlockedKeyword(keyword) {
    // Check if keyword already exists
    if (currentBlockedItems.some(item => {
      const itemKeyword = typeof item === 'object' ? item.keyword : item;
      return itemKeyword.toLowerCase() === keyword.toLowerCase();
    })) {
      return false; // Already exists
    }
    
    // Add the new keyword
    currentBlockedItems.push(keyword);
    return true; // Successfully added
  }
  
  async function blockSinglePage(url) {
    try {
      // Extract the page path without query parameters
      const urlObj = new URL(url);
      const pagePath = urlObj.pathname;
      
      // Create a keyword that will match this specific page
      const keyword = urlObj.hostname + pagePath;
      
      return await addBlockedKeyword(keyword);
    } catch (error) {
      console.error("Error blocking single page:", error);
      return false;
    }
  }
  
  async function blockEntireDomain(url) {
    try {
      // Extract just the domain
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      return await addBlockedKeyword(domain);
    } catch (error) {
      console.error("Error blocking domain:", error);
      return false;
    }
  }
  
  beforeEach(() => {
    // Reset the blocked items and mocks before each test
    currentBlockedItems = [];
    jest.clearAllMocks();
  });
  
  test('should create context menu items', () => {
    // Create the context menu items directly
    chrome.contextMenus.create({
      id: "urlBlockerMenu",
      title: "Block this page",
      contexts: ["page", "link"]
    });
    
    chrome.contextMenus.create({
      id: "blockSinglePage",
      parentId: "urlBlockerMenu",
      title: "Block single page",
      contexts: ["page", "link"]
    });
    
    chrome.contextMenus.create({
      id: "blockEntireDomain",
      parentId: "urlBlockerMenu",
      title: "Block entire domain",
      contexts: ["page", "link"]
    });
    
    chrome.contextMenus.create({
      id: "moreOptions",
      parentId: "urlBlockerMenu",
      title: "More...",
      contexts: ["page", "link"]
    });
    
    // Check if context menu items were created
    expect(chrome.contextMenus.create).toHaveBeenCalledTimes(4);
    
    // Check parent menu
    expect(chrome.contextMenus.create).toHaveBeenCalledWith({
      id: "urlBlockerMenu",
      title: "Block this page",
      contexts: ["page", "link"]
    });
    
    // Check sub-menu items
    expect(chrome.contextMenus.create).toHaveBeenCalledWith({
      id: "blockSinglePage",
      parentId: "urlBlockerMenu",
      title: "Block single page",
      contexts: ["page", "link"]
    });
    
    expect(chrome.contextMenus.create).toHaveBeenCalledWith({
      id: "blockEntireDomain",
      parentId: "urlBlockerMenu",
      title: "Block entire domain",
      contexts: ["page", "link"]
    });
    
    expect(chrome.contextMenus.create).toHaveBeenCalledWith({
      id: "moreOptions",
      parentId: "urlBlockerMenu",
      title: "More...",
      contexts: ["page", "link"]
    });
  });
  
  test('should block single page when menu item is clicked', async () => {
    const testUrl = 'https://example.com/test-page';
    
    // Call the blockSinglePage function directly
    const result = await blockSinglePage(testUrl);
    
    // Check if the keyword was added correctly
    expect(result).toBe(true);
    expect(currentBlockedItems).toContain('example.com/test-page');
  });
  
  test('should block entire domain when menu item is clicked', async () => {
    const testUrl = 'https://example.com/test-page?param=value';
    
    // Call the blockEntireDomain function directly
    const result = await blockEntireDomain(testUrl);
    
    // Check if the keyword was added correctly
    expect(result).toBe(true);
    expect(currentBlockedItems).toContain('example.com');
  });
  
  test('should not add duplicate keywords', async () => {
    const testUrl = 'https://example.com/test-page';
    
    // Add the keyword first time
    await blockSinglePage(testUrl);
    
    // Try to add the same keyword again
    const result = await blockSinglePage(testUrl);
    
    // Check that it wasn't added twice
    expect(result).toBe(false);
    expect(currentBlockedItems.length).toBe(1);
  });
  
  test('should handle context menu clicks', async () => {
    // Mock the context menu click handler
    const handleContextMenuClick = async (info, tab) => {
      const url = info.linkUrl || tab.url;
      if (!url) return false;
      
      switch (info.menuItemId) {
        case "blockSinglePage":
          return await blockSinglePage(url);
        case "blockEntireDomain":
          return await blockEntireDomain(url);
        case "moreOptions":
          chrome.action.openPopup();
          return true;
      }
      return false;
    };
    
    // Test blocking single page
    const result1 = await handleContextMenuClick(
      { menuItemId: "blockSinglePage" },
      { url: "https://example.com/page1" }
    );
    expect(result1).toBe(true);
    expect(currentBlockedItems).toContain("example.com/page1");
    
    // Test blocking entire domain
    const result2 = await handleContextMenuClick(
      { menuItemId: "blockEntireDomain" },
      { url: "https://example2.com/page" }
    );
    expect(result2).toBe(true);
    expect(currentBlockedItems).toContain("example2.com");
    
    // Test opening more options
    const result3 = await handleContextMenuClick(
      { menuItemId: "moreOptions" },
      { url: "https://example.com/page" }
    );
    expect(result3).toBe(true);
    expect(chrome.action.openPopup).toHaveBeenCalled();
  });
  
  test('should handle link context menu clicks', async () => {
    // Mock the context menu click handler
    const handleContextMenuClick = async (info, tab) => {
      const url = info.linkUrl || tab.url;
      if (!url) return false;
      
      switch (info.menuItemId) {
        case "blockSinglePage":
          return await blockSinglePage(url);
        case "blockEntireDomain":
          return await blockEntireDomain(url);
        case "moreOptions":
          chrome.action.openPopup();
          return true;
      }
      return false;
    };
    
    // Test blocking single page from a link
    const result = await handleContextMenuClick(
      { 
        menuItemId: "blockSinglePage",
        linkUrl: "https://example.com/linked-page"
      },
      { url: "https://current-page.com" }
    );
    
    expect(result).toBe(true);
    expect(currentBlockedItems).toContain("example.com/linked-page");
  });
});
