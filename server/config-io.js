import { readFile, writeFile, rename, unlink, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { randomBytes } from 'node:crypto';

const CONFIG_PATH = '/Users/TH33_ORACL3/.openclaw/openclaw.json';
const MAX_BACKUPS = 5;

export async function readConfig() {
  const raw = await readFile(CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

async function fileExists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function rotateBackups() {
  for (let i = MAX_BACKUPS; i >= 1; i--) {
    const src = i === 1
      ? `${CONFIG_PATH}.bak`
      : `${CONFIG_PATH}.bak.${i - 1}`;
    const dst = `${CONFIG_PATH}.bak.${i}`;
    if (await fileExists(src)) {
      if (i === MAX_BACKUPS) {
        await unlink(src).catch(() => {});
      } else {
        await rename(src, dst).catch(() => {});
      }
    }
  }
  if (await fileExists(CONFIG_PATH)) {
    await rename(CONFIG_PATH, `${CONFIG_PATH}.bak`).catch(() => {});
  }
}

export async function writeConfig(patchFn) {
  const current = await readConfig();
  const updated = patchFn(current);
  updated.meta = updated.meta || {};
  updated.meta.lastTouchedAt = new Date().toISOString();

  await rotateBackups();

  const tmpPath = `${CONFIG_PATH}.${randomBytes(6).toString('hex')}.tmp`;
  await writeFile(tmpPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  await rename(tmpPath, CONFIG_PATH);

  return updated;
}
