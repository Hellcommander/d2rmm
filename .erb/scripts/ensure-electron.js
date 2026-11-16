/**
 * Makes sure node_modules/electron holds a complete Electron binary.
 *
 * Under Node 26, Electron's own install script (node_modules/electron/
 * install.js) downloads the zip but its unzip step (extract-zip) stops after
 * the first folder and the process exits with code 0, leaving a dist folder
 * with only "locales" and no path.txt ("Electron failed to install
 * correctly"). This finishes the job with the bundled 7-Zip: the same zip from
 * Electron's download cache (checksum-verified by @electron/get), extracted
 * into dist, plus path.txt. Nothing happens when Electron is already complete.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const electronDir = path.join(__dirname, '../../node_modules/electron');

function platformPath() {
  switch (process.platform) {
    case 'win32':
      return 'electron.exe';
    case 'darwin':
      return 'Electron.app/Contents/MacOS/Electron';
    default:
      return 'electron';
  }
}

function isComplete(version) {
  try {
    const distVersion = fs
      .readFileSync(path.join(electronDir, 'dist', 'version'), 'utf8')
      .replace(/^v/, '')
      .trim();
    const recorded = fs.readFileSync(path.join(electronDir, 'path.txt'), 'utf8');
    return (
      distVersion === version &&
      recorded === platformPath() &&
      fs.existsSync(path.join(electronDir, 'dist', platformPath()))
    );
  } catch {
    return false;
  }
}

async function main() {
  if (!fs.existsSync(path.join(electronDir, 'package.json'))) return;
  if (process.env.ELECTRON_SKIP_BINARY_DOWNLOAD) return;
  const { version } = require(path.join(electronDir, 'package.json'));
  if (isComplete(version)) return;

  console.log(`ensure-electron: completing Electron ${version}`);
  const { downloadArtifact } = require('@electron/get');
  const zipPath = await downloadArtifact({
    version,
    artifactName: 'electron',
    platform: process.env.npm_config_platform || process.platform,
    arch: process.env.npm_config_arch || process.arch,
    checksums: require(path.join(electronDir, 'checksums.json')),
  });
  const { path7za } = require('7zip-bin');
  if (process.platform !== 'win32') fs.chmodSync(path7za, 0o755);
  const distDir = path.join(electronDir, 'dist');
  fs.rmSync(distDir, { recursive: true, force: true });
  execFileSync(path7za, ['x', '-y', `-o${distDir}`, zipPath], {
    stdio: 'ignore',
  });
  const typeDefs = path.join(distDir, 'electron.d.ts');
  if (fs.existsSync(typeDefs)) {
    fs.renameSync(typeDefs, path.join(electronDir, 'electron.d.ts'));
  }
  fs.writeFileSync(path.join(electronDir, 'path.txt'), platformPath());
  if (!isComplete(version)) {
    throw new Error('Electron is still incomplete after extraction.');
  }
  console.log(`ensure-electron: Electron ${version} is complete`);
}

main().catch((error) => {
  console.error(`ensure-electron: ${error.message}`);
  process.exit(1);
});
