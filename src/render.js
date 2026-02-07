import { state, markDirty } from './state.js';
import { createDefaultsPanel } from './components/defaults-panel.js';
import { createAgentCard } from './components/agent-card.js';
import { serializeAgentModel } from './utils/config.js';

let agentModels = {};
let agentAccountPrefs = {};
let defaultsAccountPrefs = {};

export function getChanges() {
  return { agentModels, agentAccountPrefs, defaultsAccountPrefs };
}

export function render() {
  const content = document.getElementById('content');
  content.innerHTML = '';

  agentModels = {};
  agentAccountPrefs = {};
  defaultsAccountPrefs = {};

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

  const { allModels, modelsRegistry, allProfiles, agents } = state;
  const defaults = state.defaultsModel;
  const sidecar = state.sidecar || {};

  // Defaults panel
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

  // Agent divider
  const agentsHeader = document.createElement('h2');
  agentsHeader.className = 'agents-header';
  agentsHeader.textContent = 'Agents';
  content.appendChild(agentsHeader);

  // Agent cards
  const grid = document.createElement('div');
  grid.className = 'agents-grid';

  for (const agent of agents) {
    grid.appendChild(createAgentCard(
      agent,
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
}
