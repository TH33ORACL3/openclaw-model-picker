import { resolveAgentModel } from '../utils/config.js';
import { createModelSelect } from './model-select.js';
import { createAccountSelect } from './account-select.js';
import { createFallbackList } from './fallback-list.js';

export function createAgentCard(agent, defaults, sidecar, allModels, modelsRegistry, allProfiles, onChange) {
  const card = document.createElement('div');
  card.className = 'agent-card';
  card.dataset.agentId = agent.id;

  const resolved = resolveAgentModel(agent, defaults);
  const agentPrefs = sidecar.agentAccounts?.[agent.id] || {};
  const primaryAccount = agentPrefs.primary || null;
  const fallbackAccounts = agentPrefs.fallbacks || [];

  // Header
  const header = document.createElement('div');
  header.className = 'agent-card-header';
  const title = document.createElement('h3');
  const identity = agent.identity || {};
  title.textContent = `${identity.emoji || ''} ${identity.name || agent.name || agent.id}`.trim();
  header.appendChild(title);

  const idBadge = document.createElement('span');
  idBadge.className = 'agent-id';
  idBadge.textContent = agent.id;
  header.appendChild(idBadge);
  card.appendChild(header);

  // Use defaults checkbox
  const defaultsRow = document.createElement('label');
  defaultsRow.className = 'defaults-toggle';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = resolved.usingDefaults;
  const checkLabel = document.createElement('span');
  checkLabel.textContent = 'Use global defaults';
  defaultsRow.appendChild(checkbox);
  defaultsRow.appendChild(checkLabel);
  card.appendChild(defaultsRow);

  const body = document.createElement('div');
  body.className = 'agent-card-body';

  function renderBody() {
    body.innerHTML = '';

    if (checkbox.checked) {
      const hint = document.createElement('div');
      hint.className = 'muted defaults-hint';
      hint.textContent = `Using defaults: ${defaults?.primary || 'none'}`;
      if (defaults?.fallbacks?.length) {
        hint.textContent += ` + ${defaults.fallbacks.length} fallback(s)`;
      }
      body.appendChild(hint);
      return;
    }

    // Primary model
    const primaryLabel = document.createElement('div');
    primaryLabel.className = 'field-label';
    primaryLabel.textContent = 'Primary Model';
    body.appendChild(primaryLabel);

    const primaryRow = document.createElement('div');
    primaryRow.className = 'primary-row';

    const modelWrap = document.createElement('div');
    modelWrap.className = 'primary-model';
    modelWrap.appendChild(createModelSelect(allModels, modelsRegistry, resolved.primary, (newModel) => {
      resolved.primary = newModel;
      onChange(agent.id, resolved, agentPrefs);
      renderBody();
    }));
    primaryRow.appendChild(modelWrap);

    const accountWrap = document.createElement('div');
    accountWrap.className = 'primary-account';
    accountWrap.appendChild(createAccountSelect(resolved.primary, allProfiles, primaryAccount, (key) => {
      agentPrefs.primary = key;
      onChange(agent.id, resolved, agentPrefs);
    }));
    primaryRow.appendChild(accountWrap);

    body.appendChild(primaryRow);

    // Fallbacks
    body.appendChild(createFallbackList(resolved.fallbacks, fallbackAccounts, allModels, modelsRegistry, allProfiles, (newFallbacks) => {
      resolved.fallbacks = newFallbacks;
      agentPrefs.fallbacks = fallbackAccounts;
      onChange(agent.id, resolved, agentPrefs);
    }));
  }

  checkbox.addEventListener('change', () => {
    resolved.usingDefaults = checkbox.checked;
    onChange(agent.id, resolved, agentPrefs);
    renderBody();
  });

  renderBody();
  card.appendChild(body);

  return card;
}
