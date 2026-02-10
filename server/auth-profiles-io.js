import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';

function authProfilesPath(agentId) {
  return join(homedir(), '.openclaw', 'agents', agentId, 'agent', 'auth-profiles.json');
}

export async function readAuthProfiles(agentId) {
  const raw = await readFile(authProfilesPath(agentId), 'utf8');
  return JSON.parse(raw);
}

export async function reorderAuthProfiles(agentId, providerOrders) {
  const filePath = authProfilesPath(agentId);

  await mkdir(dirname(filePath), { recursive: true });

  let data;
  try {
    const raw = await readFile(filePath, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') {
      data = { version: 1, profiles: {}, order: {}, lastGood: {}, usageStats: {} };
    } else {
      throw e;
    }
  }

  if (!data.order) data.order = {};

  for (const [provider, preferredProfileId] of Object.entries(providerOrders)) {
    const existing = data.order[provider] || [];
    if (existing.includes(preferredProfileId)) {
      data.order[provider] = [
        preferredProfileId,
        ...existing.filter(id => id !== preferredProfileId)
      ];
    } else {
      data.order[provider] = [preferredProfileId, ...existing];
    }
  }

  const tmpPath = `${filePath}.${randomBytes(6).toString('hex')}.tmp`;
  await writeFile(tmpPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await rename(tmpPath, filePath);

  return data;
}
