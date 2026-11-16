/**
 * Compiled Excel tables (.bin) in the generated output.
 *
 * D2RMM mods edit the .txt tables. If a mod also copies in a compiled .bin of
 * the same table, D2RLoader loads the .bin unless the game runs with -txt, so
 * the mods' changes vanish; and since D2RLoader 1.3.0 a missing, damaged or
 * mixed set of its own BIN tables stops loading altogether. So:
 * - a .bin whose .txt is also in the output is left out;
 * - a .bin without a .txt is kept (it may be a legacy game BIN that D2RLoader
 *   accepts on its own) but reported, since it can stop the game from starting.
 *
 * Paths are output-relative file manager paths (forward slashes).
 */
export function findOutputBinTables(filePaths: string[]): {
  skip: string[];
  kept: string[];
} {
  const isExcel = (filePath: string) =>
    /^(\.\/)?global\/excel\/(.+\/)?[^/]+$/i.test(filePath);
  const txt = new Set(
    filePaths
      .filter((filePath) => isExcel(filePath) && /\.txt$/i.test(filePath))
      .map((filePath) => filePath.toLowerCase()),
  );
  const skip: string[] = [];
  const kept: string[] = [];
  for (const filePath of filePaths) {
    if (!isExcel(filePath) || !/\.bin$/i.test(filePath)) continue;
    const sibling = filePath.replace(/\.bin$/i, '.txt').toLowerCase();
    (txt.has(sibling) ? skip : kept).push(filePath);
  }
  return { skip, kept };
}
