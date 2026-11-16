import type { IBridgeAPI, Mod } from 'bridge/BridgeAPI';
import type { ConsoleAPI } from 'bridge/ConsoleAPI';
import {
  D2R_LOADER_METADATA_PATH,
  describeInstalledMods,
  ensureD2RLoaderMetadata,
} from '../main/worker/D2RLoaderMetadata';
import {
  isD2RLoaderModConfigPath,
  mergeD2RLoaderToml,
} from '../main/worker/D2RLoaderTomlMerge';
import {
  findGameProcessNames,
  parseTasklistImageNames,
} from '../main/worker/GameProcessGuard';
import { InstallationRuntime } from '../main/worker/InstallationRuntime';
import { findOutputBinTables } from '../main/worker/OutputBinTables';

function mod(id: string, name: string): Mod {
  return { id, info: { name } } as unknown as Mod;
}

function createRuntime(mods: Mod[] = []): {
  runtime: InstallationRuntime;
  log: jest.Mock;
  warn: jest.Mock;
} {
  const log = jest.fn();
  const warn = jest.fn();
  const bridge = {
    isGameFile: jest.fn().mockResolvedValue(false),
  } as unknown as IBridgeAPI;
  const consoleAPI = {
    debug: jest.fn(),
    error: jest.fn(),
    log,
    warn,
  } as unknown as ConsoleAPI;
  return {
    runtime: new InstallationRuntime(
      bridge,
      consoleAPI,
      {
        gamePath: 'fake-game',
        isDryRun: false,
        isPreExtractedData: true,
        mergedPath: 'fake-output',
        normalizeOutputCRLF: false,
        outputModName: 'FakeOutput',
        preExtractedDataPath: 'fake-source',
        savesPath: 'fake-saves',
        useD2RLoader: true,
      },
      mods,
    ),
    log,
    warn,
  };
}

describe('mergeD2RLoaderToml', () => {
  const frankenstein = [
    '[d2rcore.save_format]',
    'mode = "extended"',
    '',
    '[d2rcore.stash]',
    'add_shared_tabs = 200',
    '',
    '# Activate enabled plugins in this order.',
    '[d2rloader.plugins]',
    'load_order = ["mapsense", "fmmp-goblins", "*"]',
    '',
  ].join('\r\n');

  it('combines plugin load orders, keeps one "*" and the earlier order', () => {
    const later = '[d2rloader.plugins]\nload_order = ["alchemy", "*", "petai"]\n';
    const { text, notes } = mergeD2RLoaderToml(frankenstein, later);
    expect(text).toContain(
      'load_order = ["mapsense", "fmmp-goblins", "alchemy", "*", "petai"]',
    );
    expect(notes.join()).toContain('combined');
    // the earlier file's comments and line endings stay
    expect(text).toContain('# Activate enabled plugins in this order.');
    expect(text).toContain('\r\n');
  });

  it('keeps the larger limit and extended saves', () => {
    const later = [
      '[d2rcore.save_format]',
      'mode = "retail"',
      '[d2rcore.stash]',
      'add_shared_tabs = 50',
    ].join('\n');
    const { text, notes } = mergeD2RLoaderToml(frankenstein, later);
    expect(text).toContain('mode = "extended"');
    expect(text).toContain('add_shared_tabs = 200');
    expect(notes.join()).toContain('larger value 200');
  });

  it('adds settings to an existing table or a new table', () => {
    const later = [
      '[d2rcore.stash]',
      'set_materials_limit = 255',
      '[d2rcore.items]',
      'display_item_levels = true',
    ].join('\n');
    const { text } = mergeD2RLoaderToml(frankenstein, later);
    expect(text).toMatch(/add_shared_tabs = 200\r\nset_materials_limit = 255/);
    expect(text).toMatch(/\[d2rcore\.items\]\r\ndisplay_item_levels = true/);
  });

  it('lets the later file win other conflicts and reports nothing for equal files', () => {
    const earlier = '[d2rcore.items]\ndisplay_item_levels = false\n';
    const later = '[d2rcore.items]\ndisplay_item_levels = true\n';
    expect(mergeD2RLoaderToml(earlier, later).text).toContain(
      'display_item_levels = true',
    );
    expect(mergeD2RLoaderToml(frankenstein, frankenstein).notes).toEqual([]);
  });

  it('reads arrays that span several lines', () => {
    const earlier = '[d2rloader.plugins]\nload_order = [\n  "a",\n  "*",\n]\n';
    const later = '[d2rloader.plugins]\nload_order = ["b"]\n';
    const { text } = mergeD2RLoaderToml(earlier, later);
    expect(text).toContain('load_order = ["a", "*", "b"]');
    expect(text).not.toContain('"a",\n');
  });

  it('recognizes the mod-level config path only', () => {
    expect(isD2RLoaderModConfigPath('../../d2rloader/config/d2rloader.toml')).toBe(true);
    expect(isD2RLoaderModConfigPath('../../d2rloader/config/other.toml')).toBe(false);
  });
});

describe('FileManager merges d2rloader.toml written by several mods', () => {
  it('merges instead of replacing and logs what it did', async () => {
    const { runtime, log } = createRuntime();
    const file = '../../d2rloader/config/d2rloader.toml';
    runtime.mod = mod('FrankensteinMod', 'Frankenstein');
    runtime.fileManager.setData(file, Buffer.from('[d2rcore.stash]\nadd_shared_tabs = 200\n'));
    await runtime.fileManager.write(file, 'FrankensteinMod');
    runtime.mod = mod('Other', 'Other');
    runtime.fileManager.setData(file, Buffer.from('[d2rcore.stash]\nadd_shared_tabs = 20\n'));
    await runtime.fileManager.write(file, 'Other');
    expect(runtime.fileManager.getData(file)!.toString()).toContain('add_shared_tabs = 200');
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'worker.fileManager.d2rloaderTomlMerged' }),
    );
  });

  it('leaves a single mod rewriting its own file alone', async () => {
    const { runtime, log } = createRuntime();
    const file = '../../d2rloader/config/d2rloader.toml';
    runtime.mod = mod('A', 'A');
    runtime.fileManager.setData(file, Buffer.from('[x]\nk = 1\n'));
    await runtime.fileManager.write(file, 'A');
    runtime.fileManager.setData(file, Buffer.from('[x]\nk = 0\n'));
    expect(runtime.fileManager.getData(file)!.toString()).toBe('[x]\nk = 0\n');
    expect(log).not.toHaveBeenCalled();
  });
});

describe('d2rloader/metadata.json', () => {
  it('removes a namespace a mod brought into the output', async () => {
    const { runtime, warn } = createRuntime();
    runtime.mod = mod('NsMod', 'Namespaced mod');
    runtime.fileManager.setData(
      D2R_LOADER_METADATA_PATH,
      Buffer.from('{"schemaVersion": 1, "namespace": "nsmod", "metadata": {}}'),
    );
    await runtime.fileManager.write(D2R_LOADER_METADATA_PATH, 'NsMod');
    runtime.mod = null;
    expect(await ensureD2RLoaderMetadata(runtime, () => '1.3.1')).toBe(true);
    const json = JSON.parse(runtime.fileManager.getData(D2R_LOADER_METADATA_PATH)!.toString());
    expect(json).toEqual({ schemaVersion: 1, metadata: {} });
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'worker.d2rloader.metadata.namespaceRemoved' }),
    );
  });

  it('describes the installed mods in a generated file', async () => {
    const { runtime } = createRuntime([mod('a', 'Alpha'), mod('b', 'Beta')]);
    runtime.modsInstalled = ['a', 'b'];
    expect(describeInstalledMods(runtime)).toBe('Generated by D2RMM from 2 mod(s): Alpha, Beta');
    expect(await ensureD2RLoaderMetadata(runtime, () => '1.3.1')).toBe(true);
    const json = JSON.parse(runtime.fileManager.getData(D2R_LOADER_METADATA_PATH)!.toString());
    expect(json.metadata.description).toBe('Generated by D2RMM from 2 mod(s): Alpha, Beta');
    expect(json.namespace).toBeUndefined();
  });
});

describe('compiled tables in the output', () => {
  it('leaves out a .bin whose .txt the mods write and reports the others', () => {
    expect(
      findOutputBinTables([
        'global/excel/skills.txt',
        'global/excel/skills.bin',
        'global/excel/base/missiles.bin',
        'global/ui/layouts/x.bin',
      ]),
    ).toEqual({
      skip: ['global/excel/skills.bin'],
      kept: ['global/excel/base/missiles.bin'],
    });
  });
});

describe('game process guard', () => {
  it('finds D2R and D2RLoader in tasklist output', () => {
    const csv = [
      '"System Idle Process","0","Services","0","8 K"',
      '"D2RLoader.exe","1234","Console","1","90,000 K"',
      '"D2R.exe","1235","Console","1","4,000,000 K"',
      '"d2r.exe","1236","Console","1","1 K"',
      '"D2RMM Custom.exe","2000","Console","1","1 K"',
    ].join('\r\n');
    expect(findGameProcessNames(parseTasklistImageNames(csv))).toEqual([
      'D2RLoader.exe',
      'D2R.exe',
      'd2r.exe',
    ]);
  });
});
