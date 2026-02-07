export function extractProvider(modelId) {
  const idx = modelId.indexOf('/');
  return idx > 0 ? modelId.substring(0, idx) : modelId;
}

export function extractModelName(modelId) {
  const idx = modelId.indexOf('/');
  return idx > 0 ? modelId.substring(idx + 1) : modelId;
}

export function getProfilesForProvider(provider, allProfiles) {
  return Object.entries(allProfiles)
    .filter(([, profile]) => profile.provider === provider)
    .map(([key, profile]) => ({ key, ...profile }));
}

export function groupProfilesByProvider(allProfiles) {
  const grouped = {};
  for (const [key, profile] of Object.entries(allProfiles)) {
    const p = profile.provider;
    if (!grouped[p]) grouped[p] = [];
    grouped[p].push({ key, ...profile });
  }
  return grouped;
}

export function groupModelsByProvider(modelIds) {
  const grouped = {};
  for (const id of modelIds) {
    const provider = extractProvider(id);
    if (!grouped[provider]) grouped[provider] = [];
    grouped[provider].push(id);
  }
  return grouped;
}

export function getDisplayName(modelId, modelsRegistry) {
  const entry = modelsRegistry[modelId];
  if (entry && entry.alias) return entry.alias;
  return extractModelName(modelId);
}
