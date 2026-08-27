import { Analytics } from '@vercel/analytics/react';
import { useLocation } from 'react-router-dom';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export default function RouteAnalytics({ basePath = '' }) {
  const location = useLocation();
  if (LOCAL_HOSTS.has(window.location.hostname)) return null;

  const route = location.pathname || '/';
  const path = `${basePath}${route}${location.search || ''}`;
  return <Analytics mode="production" route={route} path={path} />;
}
