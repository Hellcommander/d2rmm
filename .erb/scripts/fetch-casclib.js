/**
 * Makes sure the CascLib sources are in node_modules/CascLib and returns that folder.
 *
 * CascLib used to be an npm git dependency, but npm 12 (Node 26) refuses git dependencies by
 * default (EALLOWGIT), so the CascLib build scripts fetch it themselves. Set CASCLIB_REPO to use
 * another fork (CI uses olegbl/CascLib).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEFAULT_REPO = 'https://github.com/ladislav-zezula/CascLib.git';

module.exports = function fetchCascLib() {
  const root = path.join(__dirname, '../..');
  const cascLibDir = path.join(root, 'node_modules', 'CascLib');
  if (fs.existsSync(path.join(cascLibDir, 'CMakeLists.txt'))) return cascLibDir;
  const repo = process.env.CASCLIB_REPO || DEFAULT_REPO;
  fs.mkdirSync(path.dirname(cascLibDir), { recursive: true });
  fs.rmSync(cascLibDir, { recursive: true, force: true });
  console.log(`Cloning CascLib from ${repo}`);
  execSync(`git clone --depth 1 "${repo}" "${cascLibDir}"`, { stdio: 'inherit' });
  return cascLibDir;
};
