/**
 * Merges two versions of a mod-level d2rloader.toml.
 *
 * Several D2RMM mods (and converted data mods) ship their own
 * d2rloader/config/d2rloader.toml. They all land on the same output file, so
 * without a merge the last mod silently replaces the settings of every mod
 * before it (extended saves, extra stash tabs, plugin load order...).
 *
 * Rules, per setting:
 * - only in one file: kept;
 * - string lists (e.g. [d2rloader.plugins] load_order): combined, earlier
 *   entries first, one "*" at most;
 * - whole numbers (limits such as add_shared_tabs): the larger value;
 * - [d2rcore.save_format] mode: "extended" if either file asks for it, since a
 *   mod that needs wider ids cannot run in the retail save format;
 * - anything else: the later file wins.
 *
 * The earlier file's layout and comments are kept; changed settings are
 * rewritten in place and new ones are added to their table.
 */

export type D2RLoaderTomlMergeResult = {
  text: string;
  notes: string[];
};

type Entry = {
  table: string;
  key: string;
  value: string;
  startLine: number;
  endLine: number;
};

type Parsed = {
  lines: string[];
  entries: Entry[];
  tableHeaderLine: Map<string, number>;
  hasArrayTables: boolean;
};

const SAVE_FORMAT_TABLE = 'd2rcore.save_format';

function stripComment(line: string): string {
  let inString: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inString != null) {
      if (c === '\\' && inString === '"') {
        i++;
      } else if (c === inString) {
        inString = null;
      }
    } else if (c === '"' || c === "'") {
      inString = c;
    } else if (c === '#') {
      return line.slice(0, i);
    }
  }
  return line;
}

function bracketBalance(text: string): number {
  let balance = 0;
  let inString: string | null = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString != null) {
      if (c === '\\' && inString === '"') {
        i++;
      } else if (c === inString) {
        inString = null;
      }
    } else if (c === '"' || c === "'") {
      inString = c;
    } else if (c === '[') {
      balance++;
    } else if (c === ']') {
      balance--;
    }
  }
  return balance;
}

function parse(text: string): Parsed {
  const lines = text.split(/\r?\n/);
  const entries: Entry[] = [];
  const tableHeaderLine = new Map<string, number>();
  let table = '';
  let hasArrayTables = false;
  for (let i = 0; i < lines.length; i++) {
    const code = stripComment(lines[i]).trim();
    if (code === '') continue;
    if (code.startsWith('[[')) {
      hasArrayTables = true;
      continue;
    }
    const header = /^\[\s*([^\]]+?)\s*\]$/.exec(code);
    if (header != null) {
      table = header[1].replace(/\s+/g, '');
      if (!tableHeaderLine.has(table)) tableHeaderLine.set(table, i);
      continue;
    }
    const keyLine = /^("[^"]+"|[A-Za-z0-9_.-]+)\s*=\s*(.*)$/.exec(code);
    if (keyLine == null) continue;
    let value = keyLine[2].trim();
    let endLine = i;
    while (bracketBalance(value) > 0 && endLine + 1 < lines.length) {
      endLine++;
      value += ` ${stripComment(lines[endLine]).trim()}`;
    }
    entries.push({
      table,
      key: keyLine[1].replace(/^"|"$/g, ''),
      value: value.trim(),
      startLine: i,
      endLine,
    });
    i = endLine;
  }
  return { lines, entries, tableHeaderLine, hasArrayTables };
}

function parseStringArray(value: string): string[] | null {
  if (!/^\[[\s\S]*\]$/.test(value)) return null;
  const inner = value.slice(1, -1).trim();
  if (inner === '') return [];
  const items: string[] = [];
  const re = /\s*(?:"((?:[^"\\]|\\.)*)"|'([^']*)')\s*(,|$)/y;
  let index = 0;
  while (index < inner.length) {
    re.lastIndex = index;
    const m = re.exec(inner);
    if (m == null) return null;
    items.push(m[1] != null ? JSON.parse(`"${m[1]}"`) : m[2]);
    index = re.lastIndex;
    if (m[3] === '') break;
  }
  return items;
}

function formatStringArray(items: string[]): string {
  return `[${items.map((item) => JSON.stringify(item)).join(', ')}]`;
}

function combineLists(earlier: string[], later: string[]): string[] {
  const result = earlier.slice();
  const laterStar = later.indexOf('*');
  later.forEach((item, index) => {
    if (result.includes(item)) return;
    const resultStar = result.indexOf('*');
    if (item !== '*' && resultStar >= 0 && laterStar >= 0 && index < laterStar) {
      // the later file wanted it before its "*": keep it before ours too
      result.splice(resultStar, 0, item);
    } else {
      result.push(item);
    }
  });
  return result;
}

function unquote(value: string): string {
  return value.replace(/^"(.*)"$|^'(.*)'$/, '$1$2');
}

function decide(
  table: string,
  key: string,
  earlier: string,
  later: string,
): { value: string; note: string } {
  const name = `[${table}] ${key}`;
  const earlierList = parseStringArray(earlier);
  const laterList = parseStringArray(later);
  if (earlierList != null && laterList != null) {
    const combined = formatStringArray(combineLists(earlierList, laterList));
    return { value: combined, note: `${name}: combined to ${combined}` };
  }
  if (/^[+-]?\d+$/.test(earlier) && /^[+-]?\d+$/.test(later)) {
    const larger = Number(earlier) >= Number(later) ? earlier : later;
    return {
      value: larger,
      note: `${name}: kept the larger value ${larger} (${earlier} and ${later})`,
    };
  }
  if (table === SAVE_FORMAT_TABLE && key === 'mode') {
    const extended = [earlier, later].find(
      (value) => unquote(value).toLowerCase() === 'extended',
    );
    if (extended != null) {
      return {
        value: extended,
        note: `${name}: "extended", because a mod needs it (characters saved in the extended format cannot be loaded without it)`,
      };
    }
  }
  return { value: later, note: `${name}: ${later} replaces ${earlier}` };
}

export function mergeD2RLoaderToml(
  earlierText: string,
  laterText: string,
): D2RLoaderTomlMergeResult {
  const later = parse(laterText);
  let current = parse(earlierText);
  if (current.hasArrayTables || later.hasArrayTables) {
    return {
      text: laterText,
      notes: ['uses [[array tables]], which are not merged: the later file replaces the earlier one'],
    };
  }
  const eol = /\r\n/.test(earlierText) ? '\r\n' : '\n';
  const notes: string[] = [];
  let lines = current.lines.slice();

  for (const entry of later.entries) {
    const existing = current.entries.find(
      (e) => e.table === entry.table && e.key === entry.key,
    );
    if (existing != null) {
      if (existing.value.replace(/\s+/g, '') === entry.value.replace(/\s+/g, '')) {
        continue;
      }
      const { value, note } = decide(entry.table, entry.key, existing.value, entry.value);
      notes.push(note);
      if (value.replace(/\s+/g, '') === existing.value.replace(/\s+/g, '')) {
        continue;
      }
      const indent = /^\s*/.exec(lines[existing.startLine])?.[0] ?? '';
      lines.splice(
        existing.startLine,
        existing.endLine - existing.startLine + 1,
        `${indent}${entry.key} = ${value}`,
      );
    } else {
      notes.push(`[${entry.table}] ${entry.key} = ${entry.value}: added`);
      const newLine = `${entry.key} = ${entry.value}`;
      const sameTable = current.entries.filter((e) => e.table === entry.table);
      if (sameTable.length > 0) {
        lines.splice(sameTable[sameTable.length - 1].endLine + 1, 0, newLine);
      } else if (current.tableHeaderLine.has(entry.table)) {
        lines.splice(current.tableHeaderLine.get(entry.table)! + 1, 0, newLine);
      } else if (entry.table === '') {
        lines.splice(0, 0, newLine);
      } else {
        while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
          lines.pop();
        }
        lines.push('', `[${entry.table}]`, newLine, '');
      }
    }
    current = parse(lines.join(eol));
    lines = current.lines.slice();
  }
  return { text: lines.join(eol), notes };
}

export function isD2RLoaderModConfigPath(normalizedFilePath: string): boolean {
  return /(^|\/)d2rloader\/config\/d2rloader\.toml$/i.test(normalizedFilePath);
}
