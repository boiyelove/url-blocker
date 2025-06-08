# URL Blocker Chrome Extension

A Chrome extension that blocks access to websites containing specific keywords in their URLs or page titles.

## Features

- Block websites based on keywords in URLs or page titles
- Simple and intuitive options page to manage blocked keywords
- Add and remove blocked keywords easily
- Real-time blocking without needing to restart the browser
- Works with both direct navigation and in-page navigation (SPAs)
- Persistent storage of blocked keywords across browser sessions

## How to Use

1. Install the extension from the Chrome Web Store or load it as an unpacked extension (pending)
2. Click on the extension icon to open the options page
3. Add keywords you want to block
4. Browse the web - any page containing your blocked keywords will be automatically blocked

## Technical Implementation

- Uses Chrome's declarativeNetRequest API for efficient URL blocking
- Monitors page content changes for dynamic blocking
- Lightweight with minimal performance impact

## Todo

- Multi-line add keywords
- Themes: Default error page, Black, Red
- Custom text on error page
- Add keywords with timers that expire and remove them
- Sync keywords across devices
- Sync with work schedule using tag groups (other work is the greatest distraction to current work).
- Close tab in 15 seconds with timer. Dispose is closed manually.
