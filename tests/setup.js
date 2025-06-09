// Jest setup file for Chrome extension testing

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
  declarativeNetRequest: {
    getDynamicRules: jest.fn().mockResolvedValue([]),
    updateDynamicRules: jest.fn().mockResolvedValue()
  },
  webNavigation: {
    onHistoryStateUpdated: { addListener: jest.fn() }
  }
};
