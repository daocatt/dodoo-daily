/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '..', 'version.json');
const pkgFilePath = path.join(__dirname, '..', 'package.json');

const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
const pkgData = JSON.parse(fs.readFileSync(pkgFilePath, 'utf8'));

// Usage: node update-version.js [major|minor|patch]
const type = process.argv[2] || 'patch';
const [major, minor, patch] = versionData.version.split('.').map(Number);

let newVersion = '';
if (type === 'major') newVersion = `${major + 1}.0.0`;
else if (type === 'minor') newVersion = `${major}.${minor + 1}.0`;
else newVersion = `${major}.${minor}.${patch + 1}`;

// Update both structures
versionData.version = newVersion;
pkgData.version = newVersion;

// Build date using local time
const now = new Date();
versionData.build = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));
fs.writeFileSync(pkgFilePath, JSON.stringify(pkgData, null, 2));

console.log(`Version unified to: ${newVersion} (Build ${versionData.build})`);
