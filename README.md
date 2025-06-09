# URL Blocker Chrome Extension

A Chrome extension that blocks access to websites containing specific keywords in their URLs or page titles.

## Features

- Block websites based on keywords in URLs or page titles
- Context menu integration for quick blocking:
  - Block single page
  - Block entire domain
  - Access more options
- Simple and intuitive options page to manage blocked keywords
- Add and remove blocked keywords easily
- Set expiration dates for blocked keywords with automatic removal
- Real-time blocking without needing to restart the browser
- Works with both direct navigation and in-page navigation (SPAs)
- Persistent storage of blocked keywords across browser sessions
- Automatic validation of expiration dates (minimum 10 minutes in the future)
- Real-time duration display that updates as you select dates
- Automatic checking of open tabs when new keywords are added
- Automatic removal of expired keywords when visiting pages
- Scheduled cleanup of expired keywords using Chrome alarms
- Comprehensive test suite for reliable functionality

## How to Use

1. Install the extension from the Chrome Web Store or load it as an unpacked extension (pending)
2. Click on the extension icon to open the options page
3. Add keywords you want to block
4. Optionally set an expiration date and time for each keyword
   - The duration is automatically calculated and displayed (e.g., "1 month", "1 week")
   - Expiration dates must be at least 10 minutes in the future
5. Browse the web - any page containing your blocked keywords will be automatically blocked
6. When the expiration date is reached, the keyword is automatically removed
7. Right-click on any page to access quick blocking options:
   - "Block single page" - Blocks only the current page
   - "Block entire domain" - Blocks the entire domain
   - "More..." - Opens the extension options

## Technical Implementation

- Uses Chrome's declarativeNetRequest API for efficient URL blocking
- Monitors page content changes for dynamic blocking
- Automatic removal of expired keywords through multiple mechanisms:
  - When visiting a page (checks for expired keywords first)
  - Periodic checks using setInterval (every minute)
  - Scheduled checks using Chrome's alarms API (every hour)
- Context menu integration for quick blocking actions
- Lightweight with minimal performance impact
- Comprehensive test suite using Jest

## Development

### Testing

The extension includes a comprehensive test suite using Jest:

```bash
# Install dependencies
npm install

# Run tests
npm test
```

The tests cover:
- URL and content matching functionality
- Expiration date validation and formatting
- Automatic removal of expired keywords
- Page blocking behavior
- Context menu functionality

## Todo

- Multi-line add keywords
- Edit capability for existing blocked keywords
- Themes: Default error page, Black, Red
- Custom text on error page
- Sync keywords across devices
- Sync with work schedule using tag groups (other work is the greatest distraction to current work)
- Close tab in 15 seconds with timer. Dispose is closed manually
