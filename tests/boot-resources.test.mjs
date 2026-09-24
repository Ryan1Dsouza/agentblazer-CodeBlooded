import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOT_LOGO, BOOT_RESOURCE_COUNT, startBootResourceChecks } from '../src/components/loading/bootResources.ts';

function createHost({ cached = false, documentReady = false, fontsAvailable = true } = {}) {
  const images = [], updates = [], listeners = new Set(), timers = new Map();
  let resolveFonts, rejectFonts, timerId = 0;
  const fontsReady = new Promise((resolve, reject) => { resolveFonts = resolve; rejectFonts = reject; });
  const host = {
    document: { readyState: documentReady ? 'complete' : 'loading', fonts: fontsAvailable ? { ready: fontsReady } : undefined },
    window: {
      addEventListener(event, callback) { assert.equal(event, 'load'); listeners.add(callback); },
      removeEventListener(event, callback) { assert.equal(event, 'load'); listeners.delete(callback); },
      setTimeout(callback, delay) { assert.equal(delay, 10000); timers.set(++timerId, callback); return timerId; },
      clearTimeout(id) { timers.delete(id); },
    },
    createImage() {
      const image = { onload: null, onerror: null };
      Object.defineProperty(image, 'src', { set(value) { assert.equal(value, BOOT_LOGO); assert.equal(typeof image.onload, 'function'); assert.equal(typeof image.onerror, 'function'); if (cached) image.onload(); } });
      images.push(image);
      return image;
    },
  };
  return { host, images, updates, listeners, timers, resolveFonts, rejectFonts, start: () => startBootResourceChecks(state => updates.push(state), host), load: () => [...listeners].forEach(callback => callback()), timeout: () => [...timers.values()].forEach(callback => callback()) };
}

test('cached image and ready document still wait for fonts, then clear the timeout', async () => {
  const boot = createHost({ cached: true, documentReady: true });
  const cleanup = boot.start();
  assert.deepEqual(boot.updates.at(-1), { settled: 2, failed: 0, finished: false });
  boot.resolveFonts();
  await Promise.resolve();
  assert.deepEqual(boot.updates.at(-1), { settled: BOOT_RESOURCE_COUNT, failed: 0, finished: true });
  assert.equal(boot.timers.size, 0);
  cleanup();
});

test('failed image and fonts unlock with accurate fallback counts', async () => {
  const boot = createHost();
  const cleanup = boot.start();
  boot.images[0].onerror();
  boot.rejectFonts(new Error('Fonts unavailable'));
  boot.load();
  await Promise.resolve();
  assert.deepEqual(boot.updates.at(-1), { settled: 3, failed: 2, finished: true });
  cleanup();
});

test('duplicate image or document events cannot prematurely finish loading', async () => {
  const boot = createHost();
  const cleanup = boot.start();
  boot.images[0].onload();
  boot.images[0].onerror();
  boot.load(); boot.load();
  assert.equal(boot.updates.length, 2);
  assert.deepEqual(boot.updates.at(-1), { settled: 2, failed: 0, finished: false });
  boot.resolveFonts();
  await Promise.resolve();
  assert.equal(boot.updates.at(-1).finished, true);
  cleanup();
});

test('timeout settles only pending checks and late completions cannot change the result', async () => {
  const boot = createHost();
  const cleanup = boot.start();
  boot.images[0].onload();
  boot.timeout();
  assert.deepEqual(boot.updates.at(-1), { settled: 3, failed: 2, finished: true });
  const updateCount = boot.updates.length;
  boot.load(); boot.resolveFonts(); boot.images[0].onerror();
  await Promise.resolve();
  assert.equal(boot.updates.length, updateCount);
  assert.equal(boot.timers.size, 0);
  cleanup();
});

test('cleanup ignores pending promises and callbacks; a Strict Mode remount can finish', async () => {
  const boot = createHost();
  const cleanup = boot.start();
  const staleImageLoad = boot.images[0].onload;
  cleanup();
  assert.equal(boot.listeners.size, 0);
  assert.equal(boot.timers.size, 0);
  assert.equal(boot.images[0].onload, null);
  const cleanupRemount = boot.start();
  staleImageLoad();
  boot.resolveFonts();
  await Promise.resolve();
  assert.equal(boot.updates.length, 1);
  boot.images[1].onload(); boot.load();
  assert.deepEqual(boot.updates.at(-1), { settled: 3, failed: 0, finished: true });
  cleanupRemount();
});

test('browsers without the font loading API can complete', () => {
  const boot = createHost({ cached: true, documentReady: true, fontsAvailable: false });
  const cleanup = boot.start();
  assert.deepEqual(boot.updates.at(-1), { settled: 3, failed: 0, finished: true });
  cleanup();
});
