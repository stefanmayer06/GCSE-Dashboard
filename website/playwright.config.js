export default {
  testDir: './ui-tests',
  use: {
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    baseURL: process.env.UI_BASE || 'http://localhost:3000',
  },
  reporter: 'list',
};
