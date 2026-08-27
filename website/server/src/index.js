import { createApp } from './app.js';
import { initAuth, oauthConfigured } from './auth.js';

const PORT = Number(process.env.PORT) || 3000;

await initAuth();

const app = createApp();
app.listen(PORT, () => {
  console.log(`[server] GCSE Study Desk on http://localhost:${PORT}`);
  console.log('[subjects] MathsMate Foundation at /maths/ | MathsMate Higher at /maths-higher/ | EnglishMate at /english/');
  console.log(`[auth] login ready | OAuth ${oauthConfigured() ? 'configured' : 'not configured (password login only)'}`);
});
