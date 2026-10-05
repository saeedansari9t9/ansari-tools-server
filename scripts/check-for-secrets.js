const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const forbiddenTrackedNames = /(^|\/)(\.env($|\.)|.*\.(pem|p12|pfx)|id_rsa($|\.))/i;
const contentRules = [
  {
    name: 'credentialed MongoDB URI',
    pattern: /mongodb(?:\+srv)?:\/\/[^\s:@/'"]+:[^\s@/'"]+@/i,
  },
  {
    name: 'private key block',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
];

let trackedFiles;
try {
  trackedFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
} catch (error) {
  console.error('Unable to list tracked files for secret scanning.');
  process.exit(1);
}

const failures = [];
for (const relativePath of trackedFiles) {
  const normalized = relativePath.replace(/\\/g, '/');
  if (forbiddenTrackedNames.test(normalized) && normalized !== '.env.example') {
    failures.push(`${normalized}: sensitive filename is tracked`);
    continue;
  }

  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).size > 2 * 1024 * 1024) continue;

  const content = fs.readFileSync(absolutePath, 'utf8');
  for (const rule of contentRules) {
    if (rule.pattern.test(content)) failures.push(`${normalized}: ${rule.name}`);
  }
}

if (failures.length) {
  console.error('Secret scan failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Secret scan passed for ${trackedFiles.length} tracked files.`);
