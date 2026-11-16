import type { IInstallModsOptions } from 'bridge/BridgeAPI';
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { computeInstallFingerprint } from '../main/worker/InstallFingerprint';

describe('computeInstallFingerprint', () => {
  let root: string;
  let options: IInstallModsOptions;
  const app = () => path.join(root, 'app');

  beforeEach(() => {
    root = mkdtempSync(path.join(os.tmpdir(), 'd2rmm-fingerprint-'));
    mkdirSync(path.join(app(), 'mods', 'A', 'sub'), { recursive: true });
    mkdirSync(path.join(app(), 'mods', 'B'), { recursive: true });
    writeFileSync(path.join(app(), 'mods', 'A', 'mod.js'), 'a');
    writeFileSync(path.join(app(), 'mods', 'A', 'sub', 'data.txt'), 'data');
    writeFileSync(path.join(app(), 'mods', 'B', 'mod.js'), 'b');
    mkdirSync(path.join(root, 'game', 'mods', 'Out', 'Out.mpq', 'data'), {
      recursive: true,
    });
    writeFileSync(path.join(root, 'game', 'D2R.exe'), 'exe');
    options = {
      gamePath: path.join(root, 'game'),
      isDryRun: false,
      isPreExtractedData: false,
      mergedPath: path.join(root, 'game', 'mods', 'Out', 'Out.mpq', 'data'),
      normalizeOutputCRLF: false,
      outputModName: 'Out',
      preExtractedDataPath: '',
      savesPath: path.join(root, 'saves'),
    };
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  const fp = async (ids = ['A', 'B'], opts = options) =>
    (await computeInstallFingerprint(app(), ids, opts)).fingerprint;

  it('is stable while nothing changes', async () => {
    expect(await fp()).toBe(await fp());
  });

  it('changes when a mod file changes, appears or disappears', async () => {
    const before = await fp();
    writeFileSync(path.join(app(), 'mods', 'A', 'sub', 'data.txt'), 'changed!');
    const changed = await fp();
    expect(changed).not.toBe(before);
    writeFileSync(path.join(app(), 'mods', 'B', 'new.txt'), 'x');
    expect(await fp()).not.toBe(changed);
  });

  it('changes when only the change time of a same-size file changes', async () => {
    const file = path.join(app(), 'mods', 'A', 'mod.js');
    utimesSync(file, new Date(2020, 0, 1), new Date(2020, 0, 1));
    const before = await fp();
    utimesSync(file, new Date(2021, 0, 1), new Date(2021, 0, 1));
    expect(await fp()).not.toBe(before);
  });

  it('changes with the mod list order, the options and the game files', async () => {
    const before = await fp();
    expect(await fp(['B', 'A'])).not.toBe(before);
    expect(
      await fp(['A', 'B'], { ...options, outputModName: 'Other' }),
    ).not.toBe(before);
    writeFileSync(path.join(root, 'game', 'D2R.exe'), 'patched exe');
    expect(await fp()).not.toBe(before);
  });

  it('ignores the one-off output sync request and dry runs', async () => {
    const before = await fp();
    expect(
      await fp(['A', 'B'], { ...options, syncD2RLoaderOutput: true }),
    ).toBe(before);
  });

  it('reports whether the output still exists', async () => {
    const check = () => computeInstallFingerprint(app(), ['A'], options);
    expect((await check()).outputExists).toBe(false);
    writeFileSync(
      path.join(root, 'game', 'mods', 'Out', 'Out.mpq', 'modinfo.json'),
      '{}',
    );
    expect((await check()).outputExists).toBe(true);
  });
});
