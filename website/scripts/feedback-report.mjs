import { defaultStorage } from '../server/src/storage/index.js';

const sinceDays = process.argv[2] === undefined ? 90 : Number(process.argv[2]);
if (!Number.isInteger(sinceDays) || sinceDays < 1 || sinceDays > 540) {
  process.stderr.write('Usage: npm run feedback:report -- [days from 1 to 540]\n');
  process.exitCode = 2;
} else {
  const report = await defaultStorage.getFeedbackReport(sinceDays);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
