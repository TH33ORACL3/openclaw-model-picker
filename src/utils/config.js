export function resolveAgentModel(agent, defaults) {
  if (!agent.model) {
    return {
      usingDefaults: true,
      primary: defaults?.primary || '',
      fallbacks: defaults?.fallbacks || [],
    };
  }
  if (typeof agent.model === 'string') {
    return {
      usingDefaults: false,
      primary: agent.model,
      fallbacks: [],
    };
  }
  return {
    usingDefaults: false,
    primary: agent.model.primary || '',
    fallbacks: agent.model.fallbacks || [],
  };
}

export function serializeAgentModel(resolved) {
  if (resolved.usingDefaults) return null;
  if (resolved.fallbacks.length === 0) return resolved.primary;
  return { primary: resolved.primary, fallbacks: [...resolved.fallbacks] };
}
