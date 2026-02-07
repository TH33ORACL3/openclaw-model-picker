import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const STATE_PATH = join(homedir(), '.openclaw', 'model-picker-state.json');

export async function readState() {
  try {
    const raw = await readFile(STATE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { version: 1, agentAccounts: {} };
  }
}

export async function writeState(data) {
  data.version = 1;
  data.lastSaved = new Date().toISOString();
  await writeFile(STATE_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return data;
}
