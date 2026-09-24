export const BOOT_LOGO = '/AgentBlazer_Logo.png';
const RESOURCE_NAMES = ['logo', 'fonts', 'document'] as const;
export const BOOT_RESOURCE_COUNT = RESOURCE_NAMES.length;

export interface BootResourceState {
  settled: number;
  failed: number;
  finished: boolean;
}

interface BootResourceHost {
  document: Pick<Document, 'fonts' | 'readyState'>;
  window: Pick<Window, 'addEventListener' | 'removeEventListener' | 'setTimeout' | 'clearTimeout'>;
  createImage: () => HTMLImageElement;
}

/** Check real resources independently of the decorative boot diagnostics. */
export function startBootResourceChecks(
  onChange: (state: BootResourceState) => void,
  host: BootResourceHost = { document, window, createImage: () => new Image() },
) {
  let cancelled = false;
  let failures = 0;
  let safetyTimer: number;
  const completed = new Set<string>();
  const settle = (name: string, failed = false) => {
    if (cancelled || completed.has(name)) return;
    completed.add(name);
    if (failed) failures += 1;
    const finished = completed.size === BOOT_RESOURCE_COUNT;
    onChange({ settled: completed.size, failed: failures, finished });
    if (finished) host.window.clearTimeout(safetyTimer);
  };
  const handleWindowLoad = () => settle('document');
  const logo = host.createImage();
  // Attach handlers first: an image may be cached when its source is assigned.
  logo.onload = () => settle('logo');
  logo.onerror = () => settle('logo', true);
  safetyTimer = host.window.setTimeout(() => {
    // Unlock stalled sessions, but retain the number of unavailable resources.
    RESOURCE_NAMES.forEach(name => settle(name, true));
  }, 10000);
  logo.src = BOOT_LOGO;
  if (host.document.fonts?.ready) {
    host.document.fonts.ready.then(() => settle('fonts'), () => settle('fonts', true));
  } else {
    settle('fonts');
  }
  if (host.document.readyState === 'complete') handleWindowLoad();
  else host.window.addEventListener('load', handleWindowLoad, { once: true });

  return () => {
    cancelled = true;
    logo.onload = null;
    logo.onerror = null;
    host.window.clearTimeout(safetyTimer);
    host.window.removeEventListener('load', handleWindowLoad);
  };
}
