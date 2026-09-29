// Browser entry for npm run social:build. Renders one post (?post=<id>)
// after the self-hosted faces load, because explainer boards measure real
// text metrics, then flags the page as ready to capture.
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { POSTS } from './posts.jsx';

const FACES = [
  '700 40px "Unbounded Variable"',
  '800 40px "Unbounded Variable"',
  '400 20px "Atkinson Hyperlegible Next Variable"',
  '700 20px "Atkinson Hyperlegible Next Variable"',
  '800 20px "Atkinson Hyperlegible Next Variable"',
  '700 20px "Atkinson Hyperlegible Mono Variable"',
  '800 20px "Atkinson Hyperlegible Mono Variable"',
];

async function main() {
  const id = new URLSearchParams(window.location.search).get('post');
  const post = POSTS.find((row) => row.id === id);
  if (!post) throw new Error(`Unknown post "${id}"`);
  await Promise.all(FACES.map((spec) => document.fonts.load(spec)));
  const Post = post.Component;
  flushSync(() => createRoot(document.getElementById('root')).render(<Post facts={window.__FACTS__} />));
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.dataset.ready = 'true';
  }));
}

main().catch((error) => {
  document.body.dataset.error = String(error?.stack || error);
});
