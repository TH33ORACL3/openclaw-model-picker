import { readFile, writeFile } from 'node:fs/promises';

const STATE_PATH = '/Users/TH33_ORACL3/.openclaw/model-picker/model-picker-state.json';

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
