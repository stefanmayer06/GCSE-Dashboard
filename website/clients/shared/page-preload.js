import { lazy } from 'react';
import { matchRoutes } from 'react-router-dom';

// A code-split route page whose chunk can be fetched before it first renders.
// `load` resolves to a module whose default export is the page. Once the
// chunk has arrived the lazy factory hands React a thenable that resolves
// synchronously, so a preloaded page mounts at once instead of flashing its
// Suspense fallback for a frame.
export function preloadablePage(load) {
  let module = null;
  let pending = null;
  const preload = () => {
    if (module) return Promise.resolve(module);
    if (pending) return pending;
    pending = load().then(
      (loaded) => {
        module = loaded;
        return loaded;
      },
      (error) => {
        pending = null;
        throw error;
      },
    );
    return pending;
  };
  const Page = lazy(() => (module ? { then: (resolve) => resolve(module) } : preload()));
  Page.preload = preload;
  return Page;
}

// Loads everything the page at `pathname` needs for its first render: its
// chunk, then the data its module declares through an optional
// `preload({ userId, params })` export. `routes` is a list of
// { path, page } objects whose pages come from preloadablePage.
export async function preloadRoute(routes, pathname, context = {}) {
  const matches = matchRoutes(routes, pathname);
  const match = matches?.[matches.length - 1];
  if (!match) return;
  const module = await match.route.page.preload();
  await module.preload?.({ ...context, params: match.params });
}
