import { createModelSelect } from './model-select.js';
import { createAccountSelect } from './account-select.js';
import { createFallbackList } from './fallback-list.js';

export function createDefaultsPanel(defaultsModel, sidecar, allModels, modelsRegistry, allProfiles, onChange) {
  const panel = document.createElement('div');
  panel.className = 'defaults-panel';

  const header = document.createElement('h2');
  header.textContent = 'Agent Global Default';
  panel.appendChild(header);

  const desc = document.createElement('p');
  desc.className = 'muted';
  desc.textContent = 'Agents without custom model settings will use these defaults.';
  panel.appendChild(desc);

  const defaultsPrefs = sidecar.defaultsAccounts || {};
  const primaryAccount = defaultsPrefs.primary || null;
  const fallbackAccounts = defaultsPrefs.fallbacks || [];

  const body = document.createElement('div');
  body.className = 'defaults-body';

  function renderBody() {
    body.innerHTML = '';

    const primaryLabel = document.createElement('div');
    primaryLabel.className = 'field-label';
    primaryLabel.textContent = 'Primary Model';
    body.appendChild(primaryLabel);

    const primaryRow = document.createElement('div');
    primaryRow.className = 'primary-row';

    const modelWrap = document.createElement('div');
    modelWrap.className = 'primary-model';
    modelWrap.appendChild(createModelSelect(allModels, modelsRegistry, defaultsModel.primary, (newModel) => {
      defaultsModel.primary = newModel;
      onChange(defaultsModel, defaultsPrefs);
      renderBody();
    }));
    primaryRow.appendChild(modelWrap);

    const accountWrap = document.createElement('div');
    accountWrap.className = 'primary-account';
    accountWrap.appendChild(createAccountSelect(defaultsModel.primary, allProfiles, primaryAccount, (key) => {
      defaultsPrefs.primary = key;
      onChange(defaultsModel, defaultsPrefs);
    }));
    primaryRow.appendChild(accountWrap);

    body.appendChild(primaryRow);

    body.appendChild(createFallbackList(defaultsModel.fallbacks, fallbackAccounts, allModels, modelsRegistry, allProfiles, (newFallbacks) => {
      defaultsModel.fallbacks = newFallbacks;
      defaultsPrefs.fallbacks = fallbackAccounts;
      onChange(defaultsModel, defaultsPrefs);
    }));
  }

  renderBody();
  panel.appendChild(body);

  return panel;
}
