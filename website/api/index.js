let appPromise;

function startupCode(error) {
  const rawCode = typeof error?.code === 'string' ? error.code : error?.name;
  return typeof rawCode === 'string' && /^[A-Za-z0-9_-]+$/.test(rawCode) ? rawCode : 'Error';
}

function initializeApp() {
  if (!appPromise) {
    appPromise = Promise.all([
      import('../server/src/app.js'),
      import('../server/src/auth.js'),
    ])
      .then(async ([{ createApp }, { initAuth }]) => {
        await initAuth();
        return createApp({ serveStatic: false });
      })
      .catch((error) => {
        appPromise = null;
        console.error(`[vercel] application initialization failed (${startupCode(error)})`);
        console.error(error?.stack || error);
        throw error;
      });
  }
  return appPromise;
}

module.exports = async function handler(req, res) {
  try {
    const app = await initializeApp();
    return app(req, res);
  } catch {
    if (res.headersSent) return res.end();
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'Service temporarily unavailable' }));
  }
};
