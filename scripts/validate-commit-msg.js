const fs = require('fs');

const msgPath = process.argv[2];
const msg = fs.readFileSync(msgPath, 'utf-8').trim();

const commitMessageRegex = /^(feat|fix|docs|style|refactor|perf|test|chore): .{1,}$/;

if (!commitMessageRegex.test(msg)) {
  console.error(
    `Invalid commit message format.\n\n` +
      `Please use the following format:\n` +
      `type(scope): description\n` +
      `\n` +
      `Example:\n` +
      `feat(login): add login functionality`
  );
  process.exit(1);
}
