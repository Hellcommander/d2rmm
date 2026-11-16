import { execFile } from 'child_process';

/**
 * Installing rewrites the generated mod output: the old output is deleted
 * first, then the new files are written. While the game runs, D2RLoader holds
 * its plugin DLLs open, so the rewrite stops half way (EPERM) and leaves the
 * output empty. Installs therefore refuse to start while one of these runs.
 */
const GAME_PROCESS_NAMES = ['d2r.exe', 'd2rloader.exe'];

// tasklist /FO CSV /NH: "Image Name","PID","Session Name","Session#","Mem Usage"
export function parseTasklistImageNames(csv: string): string[] {
  return csv
    .split(/\r?\n/)
    .map((line) => /^"([^"]+)"/.exec(line.trim())?.[1])
    .filter((name): name is string => name != null);
}

export function findGameProcessNames(imageNames: string[]): string[] {
  const found = imageNames.filter((name) =>
    GAME_PROCESS_NAMES.includes(name.toLowerCase()),
  );
  return [...new Set(found)];
}

export async function findRunningGameProcesses(): Promise<string[]> {
  if (process.platform !== 'win32') {
    return [];
  }
  const csv = await new Promise<string | null>((resolve) => {
    execFile(
      'tasklist',
      ['/FO', 'CSV', '/NH'],
      { windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
      (error, stdout) => {
        if (error != null) {
          // never block an install because the check itself failed
          console.debug('GameProcessGuard', 'tasklist failed', String(error));
          resolve(null);
        } else {
          resolve(stdout);
        }
      },
    );
  });
  return csv == null ? [] : findGameProcessNames(parseTasklistImageNames(csv));
}
