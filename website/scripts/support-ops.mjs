import { defaultStorage } from '../server/src/storage/index.js';

const action = process.argv[2];

if (action === 'list') {
  const requests = await defaultStorage.listSupportRequests(50);
  for (const request of requests) {
    process.stdout.write(`${request.createdAt}  ${request.topic}  ${request.id}\n`);
    process.stdout.write(`Reply: ${request.email || '(none provided)'}\n`);
    process.stdout.write(`${request.message}\n\n`);
  }
  if (!requests.length) process.stdout.write('No support requests.\n');
} else if (action === 'prune') {
  await defaultStorage.pruneSupportRequests(180);
  process.stdout.write('Support requests older than 180 days removed.\n');
} else {
  process.stderr.write('Usage: node scripts/support-ops.mjs <list|prune>\n');
  process.exitCode = 2;
}
