import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearResourceCache,
  invalidateResources,
  peekResource,
  preloadResource,
} from '../../clients/shared/resource-cache.js';
import { preloadablePage, preloadRoute } from '../../clients/shared/page-preload.js';

test('preloadResource stores the value for the first render to read', async () => {
  clearResourceCache();
  const value = await preloadResource('topics:maths:u1', async () => ({ strands: {} }));
  assert.deepEqual(value, { strands: {} });
  assert.deepEqual(peekResource('topics:maths:u1'), { strands: {} });
});

test('preloadResource shares one request between concurrent callers', async () => {
  clearResourceCache();
  let calls = 0;
  const fetcher = async () => {
    calls += 1;
    return { ok: true };
  };
  await Promise.all([preloadResource('personal:u1:maths', fetcher), preloadResource('personal:u1:maths', fetcher)]);
  assert.equal(calls, 1);
});

test('a sign-out during a preload discards the previous account\'s response', async () => {
  clearResourceCache();
  let release;
  const pending = preloadResource('personal:u1:english', () => new Promise((resolve) => { release = resolve; }));
  await Promise.resolve();
  clearResourceCache();
  release({ mistakes: [] });
  await pending;
  assert.equal(peekResource('personal:u1:english'), undefined);
});

test('invalidation drops a preloaded value', async () => {
  clearResourceCache();
  await preloadResource('topics:english:u1', async () => ({ sections: {} }));
  invalidateResources('topics:english:');
  assert.equal(peekResource('topics:english:u1'), undefined);
});

test('preloadResource ignores a missing key', async () => {
  assert.equal(await preloadResource(null, async () => 'never'), undefined);
});

test('preloadablePage fetches its chunk once and retries after a failure', async () => {
  let loads = 0;
  const failing = preloadablePage(async () => {
    loads += 1;
    if (loads === 1) throw new Error('offline');
    return { default: () => null };
  });
  await assert.rejects(failing.preload(), /offline/);
  const module = await failing.preload();
  assert.equal(typeof module.default, 'function');
  await failing.preload();
  assert.equal(loads, 2);
});

test('preloadRoute loads the matched page and hands its data loader the route params', async () => {
  const seen = [];
  const page = (name) => preloadablePage(async () => ({
    default: () => null,
    preload: (context) => { seen.push({ name, ...context }); },
  }));
  const routes = [
    { path: '/', page: page('dashboard') },
    { path: '/learn/:topicId', page: page('topic') },
  ];
  await preloadRoute(routes, '/learn/fractions', { userId: 'u1' });
  assert.deepEqual(seen, [{ name: 'topic', userId: 'u1', params: { topicId: 'fractions' } }]);
});

test('preloadRoute tolerates unknown paths and pages without a data loader', async () => {
  const routes = [{ path: '/notebook', page: preloadablePage(async () => ({ default: () => null })) }];
  await preloadRoute(routes, '/nowhere', { userId: 'u1' });
  await preloadRoute(routes, '/notebook', { userId: 'u1' });
});
