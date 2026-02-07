import { readFile, writeFile, rename, unlink, access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';

const CRON_PATH = join(homedir(), '.clawdbot', 'cron', 'jobs.json');
const MAX_BACKUPS = 3;

export async function readCronJobs() {
  const raw = await readFile(CRON_PATH, 'utf8');
  return JSON.parse(raw);
}

async function fileExists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function rotateBackups() {
  for (let i = MAX_BACKUPS; i >= 1; i--) {
    const src = i === 1
      ? `${CRON_PATH}.bak`
      : `${CRON_PATH}.bak.${i - 1}`;
    const dst = `${CRON_PATH}.bak.${i}`;
    if (await fileExists(src)) {
      if (i === MAX_BACKUPS) {
        await unlink(src).catch(() => {});
      } else {
        await rename(src, dst).catch(() => {});
      }
    }
  }
  if (await fileExists(CRON_PATH)) {
    await rename(CRON_PATH, `${CRON_PATH}.bak`).catch(() => {});
  }
}

export async function writeCronJobs(patchFn) {
  const current = await readCronJobs();
  const updated = patchFn(current);

  await rotateBackups();

  const tmpPath = `${CRON_PATH}.${randomBytes(6).toString('hex')}.tmp`;
  await writeFile(tmpPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  await rename(tmpPath, CRON_PATH);

  return updated;
}
