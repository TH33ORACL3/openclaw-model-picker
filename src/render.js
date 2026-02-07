import { state, markDirty, update } from './state.js';
import { createDefaultsPanel } from './components/defaults-panel.js';
import { createCronDefaultsPanel } from './components/cron-defaults-panel.js';
import { createAgentCard } from './components/agent-card.js';
import { createCronJobCard } from './components/cron-job-card.js';
import { serializeAgentModel } from './utils/config.js';

let agentModels = {};
let agentAccountPrefs = {};
let defaultsAccountPrefs = {};
let cronJobModels = {};
let cronJobDefaultToggles = {};

export function resetChanges() {
  agentModels = {};
  agentAccountPrefs = {};
  defaultsAccountPrefs = {};
  cronJobModels = {};
  cronJobDefaultToggles = {};
}

export function getChanges() {
  return { agentModels, agentAccountPrefs, defaultsAccountPrefs, cronJobModels, cronJobDefaultToggles };
}

export function render() {
  renderSidebar();
  const content = document.getElementById('content');
  content.innerHTML = '';

  if (state.error) {
    const err = document.createElement('div');
    err.className = 'error-banner';
    err.textContent = `Error: ${state.error}`;
    content.appendChild(err);
    return;
  }

  if (!state.config) {
    content.innerHTML = '<div class="loading">Loading configuration...</div>';
    return;
  }

  const { allModels, modelsRegistry, allProfiles, agents, cronJobs, activeView, cronDefault } = state;
  const defaults = state.defaultsModel;
  const originalSidecar = state.sidecar || {};
  
  const sidecar = {
    ...originalSidecar,
    defaultsAccounts: Object.keys(defaultsAccountPrefs).length > 0 ? defaultsAccountPrefs : originalSidecar.defaultsAccounts,
    agentAccounts: {
      ...(originalSidecar.agentAccounts || {}),
      ...agentAccountPrefs
    }
  };

  if (activeView === 'agents') {
    content.appendChild(createDefaultsPanel(
      { primary: defaults.primary, fallbacks: [...defaults.fallbacks] },
      sidecar,
      allModels,
      modelsRegistry,
      allProfiles,
      (newDefaults, newPrefs) => {
        state.defaultsModel.primary = newDefaults.primary;
        state.defaultsModel.fallbacks = newDefaults.fallbacks;
        defaultsAccountPrefs = newPrefs;
        markDirty();
      }
    ));

    const grid = document.createElement('div');
    grid.className = 'agents-grid';

    for (const agent of agents) {
      const agentToRender = { ...agent };
      if (agentModels[agent.id] !== undefined) {
        agentToRender.model = agentModels[agent.id];
      }

      grid.appendChild(createAgentCard(
        agentToRender,
        defaults,
        sidecar,
        allModels,
        modelsRegistry,
        allProfiles,
        (agentId, resolved, prefs) => {
          agentModels[agentId] = serializeAgentModel(resolved);
          agentAccountPrefs[agentId] = prefs;
          markDirty();
        }
      ));
    }
    content.appendChild(grid);

  } else if (activeView === 'cron') {
    content.appendChild(createCronDefaultsPanel(
      cronDefault,
      allModels,
      modelsRegistry,
      (newModel) => {
        update({ cronDefault: newModel });
        markDirty();
        render();
      }
    ));

    if (cronJobs && cronJobs.length > 0) {
      const cronGrid = document.createElement('div');
      cronGrid.className = 'agents-grid';

      const cronJobUseDefaults = state.cronJobUseDefaults || {};

      for (const job of cronJobs) {
        const jobToRender = { ...job };
        if (cronJobModels[job.id] !== undefined) {
          jobToRender.payload = { ...jobToRender.payload, model: cronJobModels[job.id] };
        }

        const jobUseDefault = cronJobDefaultToggles[job.id] !== undefined
          ? cronJobDefaultToggles[job.id]
          : !!cronJobUseDefaults[job.id];

        cronGrid.appendChild(createCronJobCard(
          jobToRender,
          allModels,
          modelsRegistry,
          cronDefault,
          jobUseDefault,
          (jobId, newModel) => {
            cronJobModels[jobId] = newModel;
            markDirty();
          },
          (jobId, checked) => {
            cronJobDefaultToggles[jobId] = checked;
            markDirty();
          }
        ));
      }
      content.appendChild(cronGrid);
    }
  }
}

export function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.innerHTML = '';

  const { agents, cronJobs, activeView } = state;

  const items = [
    { id: 'agents', label: 'Agents', count: agents.length },
    { id: 'cron', label: 'Cron Jobs', count: cronJobs.length },
  ];

  for (const item of items) {
    const el = document.createElement('div');
    el.className = `sidebar-item ${activeView === item.id ? 'active' : ''}`;
    
    const label = document.createElement('span');
    label.textContent = item.label;
    el.appendChild(label);

    const count = document.createElement('span');
    count.className = 'sidebar-count';
    count.textContent = item.count;
    el.appendChild(count);

    el.addEventListener('click', () => {
      update({ activeView: item.id });
      render();
    });

    sidebar.appendChild(el);
  }
}
