// The install fingerprint (bridge InstallFingerprint) taken before the last
// fully successful install. Read and written at the moment it is needed rather
// than through React state, so the install hook and the Run button always see
// the same value.
const KEY = 'installed-fingerprint';

export function getInstalledFingerprint(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setInstalledFingerprint(fingerprint: string | null): void {
  try {
    if (fingerprint == null) {
      localStorage.removeItem(KEY);
    } else {
      localStorage.setItem(KEY, fingerprint);
    }
  } catch (error) {
    console.error(error);
  }
}
