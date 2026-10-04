export default {
  testDir: './ui-tests',
  use: {
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    // The app's service worker is a progressive enhancement; keep it out of
    // the way of request mocking (page.route). The manifest test checks it.
    serviceWorkers: 'block',
    baseURL: process.env.UI_BASE || 'http://localhost:3000',
  },
  reporter: 'list',
};
