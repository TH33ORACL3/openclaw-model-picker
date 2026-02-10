import { loadConfig, saveConfig, loadState, saveState, loadCronJobs, saveCronJobs, saveAuthProfileOrder } from './api.js';
import { state, update, subscribe } from './state.js';
import { render, getChanges, resetChanges } from './render.js';
import { showToast } from './components/toast.js';
import { groupModelsByProvider, mergeModels } from './utils/providers.js';
import './style.css';

async function init() {
  try {
    const [configData, sidecarData, cronData] = await Promise.all([
      loadConfig(),
      loadState(),
      loadCronJobs().catch(() => ({ jobs: [] })),
    ]);

    const agents = configData.agents?.list || [];
    const defaults = configData.agents?.defaults || {};
    const { allModels, modelsRegistry } = mergeModels(configData);
    const allProfiles = configData.auth?.profiles || {};

    resetChanges();

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
      cronJobs: cronData.jobs || [],
      cronDefault: sidecarData.cronDefault || '',
      cronJobUseDefaults: sidecarData.cronJobUseDefaults || {},
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

document.getElementById('btn-save').addEventListener('click', async () => {
  if (state.saving) return;
  update({ saving: true });

  try {
    const { agentModels, agentAccountPrefs, defaultsAccountPrefs, cronJobModels, cronJobDefaultToggles } = getChanges();

    const dm = state.defaultsModel;
    const defaultsModelValue = { primary: dm.primary, fallbacks: dm.fallbacks || [] };

    await saveConfig({
      agentModels,
      defaultsModel: defaultsModelValue,
    });

    const sidecar = state.sidecar || {};
    sidecar.agentAccounts = sidecar.agentAccounts || {};
    for (const [id, prefs] of Object.entries(agentAccountPrefs)) {
      sidecar.agentAccounts[id] = prefs;
    }
    if (Object.keys(defaultsAccountPrefs).length > 0) {
      sidecar.defaultsAccounts = defaultsAccountPrefs;
    }
    sidecar.cronDefault = state.cronDefault || '';
    const mergedUseDefaults = { ...(state.cronJobUseDefaults || {}), ...cronJobDefaultToggles };
    sidecar.cronJobUseDefaults = mergedUseDefaults;
    await saveState(sidecar);

    // Reorder auth-profiles.json for each agent based on account selections
    const agentOrders = {};

    // Defaults map to the "main" agent
    if (defaultsAccountPrefs.primary) {
      const profileProvider = defaultsAccountPrefs.primary.split(':')[0];
      if (!agentOrders.main) agentOrders.main = {};
      agentOrders.main[profileProvider] = defaultsAccountPrefs.primary;
    }

    for (const [agentId, prefs] of Object.entries(agentAccountPrefs)) {
      if (prefs.primary) {
        const profileProvider = prefs.primary.split(':')[0];
        if (!agentOrders[agentId]) agentOrders[agentId] = {};
        agentOrders[agentId][profileProvider] = prefs.primary;
      }
    }

    const authProfilesChanged = Object.keys(agentOrders).length > 0;
    if (authProfilesChanged) {
      await saveAuthProfileOrder(agentOrders).catch(e => {
        console.warn('Auth profile reorder partial failure:', e.message);
      });
    }

    const cronDefault = state.cronDefault;
    const jobModelsToSave = [];

    for (const [jobId, checked] of Object.entries(cronJobDefaultToggles)) {
      if (checked && cronDefault) {
        jobModelsToSave.push({ id: jobId, model: cronDefault });
      }
    }
    for (const [jobId, model] of Object.entries(cronJobModels)) {
      const isUsingDefault = cronJobDefaultToggles[jobId] !== undefined
        ? cronJobDefaultToggles[jobId]
        : !!mergedUseDefaults[jobId];
      if (!isUsingDefault) {
        jobModelsToSave.push({ id: jobId, model });
      }
    }

    if (jobModelsToSave.length > 0) {
      await saveCronJobs({ jobModels: jobModelsToSave });
    }

    update({ saving: false, dirty: false, sidecar });
    if (authProfilesChanged) {
      showToast('Saved. Account changes take effect on new sessions.', 'info');
    } else {
      showToast('Configuration saved');
    }
  } catch (e) {
    update({ saving: false });
    showToast(`Save failed: ${e.message}`, 'error');
  }
});

document.getElementById('btn-reload').addEventListener('click', () => {
  init();
  showToast('Configuration reloaded', 'info');
});

subscribe((s) => {
  const btn = document.getElementById('btn-save');
  btn.disabled = !s.dirty || s.saving;
  btn.textContent = s.saving ? 'Saving...' : 'Save Changes';

  const sidebarItems = document.querySelectorAll('.sidebar-item');
  sidebarItems.forEach(item => {
    const isAgents = item.querySelector('span').textContent.startsWith('Agents');
    const isActive = (s.activeView === 'agents' && isAgents) || 
                     (s.activeView === 'cron' && !isAgents);
    item.classList.toggle('active', isActive);
  });
});

init();
