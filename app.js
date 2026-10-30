const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const candidates = [
  __dirname,
  path.join(__dirname, 'server'),
  path.join(__dirname, '..'),
];

const serverDir = candidates.find((dir) => {
  const packageJson = path.join(dir, 'package.json');
  const distApp = path.join(dir, 'dist', 'app.js');
  return fs.existsSync(packageJson) && fs.existsSync(distApp);
});

if (!serverDir) {
  throw new Error(
    'Unable to find the Abmiti server app. Expected a server/package.json and server/dist/app.js near this app.js.'
  );
}

process.chdir(serverDir);
require(path.join(serverDir, 'dist', 'app.js'));
