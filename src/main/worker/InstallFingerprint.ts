import type { IInstallModsOptions, InstallFingerprint } from 'bridge/BridgeAPI';
import { createHash } from 'crypto';
import { existsSync, promises as fs } from 'fs';
import path from 'path';

/**
 * A fingerprint of everything an install reads besides the mod list and its
 * settings (which the renderer already compares): the files of the mods being
 * installed (path, size, change time), the game and loader executables, and
 * the install options. Run D2R compares it with the one taken before the last
 * successful install to tell whether installing again would change anything.
 * Only file metadata is read, not contents.
 */

// install options that change the output (isDryRun and the one-off
// syncD2RLoaderOutput request do not describe the output)
function describeOptions(options: IInstallModsOptions): string {
  return JSON.stringify([
    options.gamePath,
    options.mergedPath,
    options.outputModName,
    options.savesPath,
    options.isPreExtractedData,
    options.preExtractedDataPath,
    options.normalizeOutputCRLF,
    options.useD2RLoader === true,
    [...(options.disabledD2RLoaderSources ?? [])].sort(),
  ]);
}

const GAME_FILES = ['D2R.exe', 'D2RLoader.exe', 'D2RCore.dll', '.build.info'];

async function listFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  const walk = async (dir: string, rel: string): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const childRel = rel === '' ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        await walk(path.join(dir, entry.name), childRel);
      } else if (entry.isFile()) {
        out.push(childRel);
      }
    }
  };
  await walk(root, '');
  return out;
}

async function statLine(filePath: string, label: string): Promise<string> {
  try {
    const stat = await fs.stat(filePath);
    return `${label}\t${stat.size}\t${Math.round(stat.mtimeMs)}`;
  } catch {
    return `${label}\tmissing`;
  }
}

export async function computeInstallFingerprint(
  appPath: string,
  modIDs: string[],
  options: IInstallModsOptions,
): Promise<InstallFingerprint> {
  const hash = createHash('sha256');
  hash.update(`options\t${describeOptions(options)}\n`);
  for (const file of GAME_FILES) {
    hash.update(
      `${await statLine(path.join(options.gamePath, file), `game/${file}`)}\n`,
    );
  }
  for (const modID of modIDs) {
    const modRoot = path.join(appPath, 'mods', modID);
    hash.update(`mod\t${modID}\n`);
    const files = await listFiles(modRoot);
    // stat in small batches: thousands of files, but only metadata
    for (let i = 0; i < files.length; i += 64) {
      const batch = files.slice(i, i + 64);
      const lines = await Promise.all(
        batch.map((rel) => statLine(path.join(modRoot, rel), rel)),
      );
      lines.forEach((line) => hash.update(`${line}\n`));
    }
  }
  return {
    fingerprint: hash.digest('hex'),
    // the output folder can be deleted or emptied outside D2RMM
    outputExists: existsSync(
      path.join(options.mergedPath, '..', 'modinfo.json'),
    ),
  };
}
