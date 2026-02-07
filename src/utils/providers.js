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

/**
 * Merges models from two sources:
 * 1. agents.defaults.models (registry) - known models with optional aliases
 * 2. models.providers.*.models - custom provider definitions
 * 
 * Returns { allModels: string[], modelsRegistry: object }
 * 
 * Deduplication: Uses canonical model ID (provider/model-id) as key.
 * Priority: Registry entries win over provider entries (preserves custom aliases).
 */
export function mergeModels(configData) {
  const merged = new Map();
  
  const registryModels = configData.agents?.defaults?.models || {};
  for (const [modelId, metadata] of Object.entries(registryModels)) {
    merged.set(modelId, {
      alias: metadata.alias || null,
      source: 'registry',
      ...metadata
    });
  }
  
  const providers = configData.models?.providers || {};
  for (const [providerName, providerConfig] of Object.entries(providers)) {
    const models = providerConfig.models || [];
    for (const model of models) {
      const canonicalId = `${providerName}/${model.id}`;
      
      if (!merged.has(canonicalId)) {
        merged.set(canonicalId, {
          alias: model.name || model.alias || null,
          source: 'provider',
          contextWindow: model.contextWindow,
          maxTokens: model.maxTokens
        });
      }
    }
  }
  
  const allModels = Array.from(merged.keys()).sort();
  const modelsRegistry = {};
  for (const [id, metadata] of merged.entries()) {
    modelsRegistry[id] = metadata;
  }
  
  return { allModels, modelsRegistry };
}
