import { createModelSelect } from './model-select.js';

export function createCronDefaultsPanel(cronDefault, allModels, modelsRegistry, onChange) {
  const panel = document.createElement('div');
  panel.className = 'defaults-panel';

  const header = document.createElement('h2');
  header.textContent = 'Cron Job Global Default';
  panel.appendChild(header);

  const desc = document.createElement('p');
  desc.className = 'muted';
  desc.textContent = 'Cron jobs without custom model settings will use this default.';
  panel.appendChild(desc);

  const body = document.createElement('div');
  body.className = 'defaults-body';

  const label = document.createElement('div');
  label.className = 'field-label';
  label.textContent = 'Model';
  body.appendChild(label);

  body.appendChild(createModelSelect(allModels, modelsRegistry, cronDefault || '', (newModel) => {
    onChange(newModel);
  }));

  panel.appendChild(body);

  return panel;
}
