const listeners = new Set();

export const state = {
  config: null,
  sidecar: null,
  dirty: false,
  saving: false,
  error: null,
  // Derived data (set during init)
  allModels: [],
  modelsRegistry: {},
  allProfiles: {},
  providerProfiles: {},
  agents: [],
  defaultsModel: { primary: '', fallbacks: [] },
  // Cron jobs
  cronJobs: [],
  cronDefault: '',
  cronJobUseDefaults: {},
  activeView: 'agents',
};

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function update(patch) {
  Object.assign(state, patch);
  for (const fn of listeners) fn(state);
}

export function markDirty() {
  if (!state.dirty) update({ dirty: true });
}
