import { loadConfig, saveConfig, loadState, saveState } from './api.js';
import { state, update, subscribe } from './state.js';
import { render, getChanges } from './render.js';
import { showToast } from './components/toast.js';
import { groupModelsByProvider, mergeModels } from './utils/providers.js';
import './style.css';

async function init() {
  try {
    const [configData, sidecarData] = await Promise.all([loadConfig(), loadState()]);

    const agents = configData.agents?.list || [];
    const defaults = configData.agents?.defaults || {};
    const { allModels, modelsRegistry } = mergeModels(configData);
    const allProfiles = configData.auth?.profiles || {};

    const defaultsModel = typeof defaults.model === 'string'
      ? { primary: defaults.model, fallbacks: [] }
      : { primary: defaults.model?.primary || '', fallbacks: defaults.model?.fallbacks || [] };

    update({
      config: configData,
      sidecar: sidecarData,
      allModels,
      modelsRegistry,
      allProfiles,
      agents,
      defaultsModel,
      dirty: false,
      saving: false,
      error: null,
    });

    render();
  } catch (e) {
    update({ error: e.message });
    render();
  }
}

// Save button
document.getElementById('btn-save').addEventListener('click', async () => {
  if (state.saving) return;
  update({ saving: true });

  try {
    const { agentModels, agentAccountPrefs, defaultsAccountPrefs } = getChanges();

    // Build defaults model value
    const dm = state.defaultsModel;
    const defaultsModelValue = dm.fallbacks.length > 0
      ? { primary: dm.primary, fallbacks: dm.fallbacks }
      : dm.primary;

    await saveConfig({
      agentModels,
      defaultsModel: defaultsModelValue,
    });

    // Save sidecar with account prefs
    const sidecar = state.sidecar || {};
    sidecar.agentAccounts = sidecar.agentAccounts || {};
    for (const [id, prefs] of Object.entries(agentAccountPrefs)) {
      sidecar.agentAccounts[id] = prefs;
    }
    if (Object.keys(defaultsAccountPrefs).length > 0) {
      sidecar.defaultsAccounts = defaultsAccountPrefs;
    }
    await saveState(sidecar);

    update({ saving: false, dirty: false, sidecar });
    showToast('Configuration saved');
  } catch (e) {
    update({ saving: false });
    showToast(`Save failed: ${e.message}`, 'error');
  }
});

// Reload button
document.getElementById('btn-reload').addEventListener('click', () => {
  init();
  showToast('Configuration reloaded', 'info');
});

// Update save button state
subscribe((s) => {
  const btn = document.getElementById('btn-save');
  btn.disabled = !s.dirty || s.saving;
  btn.textContent = s.saving ? 'Saving...' : 'Save Changes';
});

init();
