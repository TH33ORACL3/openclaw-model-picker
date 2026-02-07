import { groupModelsByProvider, getDisplayName } from '../utils/providers.js';

export function createModelSelect(allModels, modelsRegistry, selectedModel, onChange) {
  const select = document.createElement('select');
  select.className = 'model-select';

  const grouped = groupModelsByProvider(allModels);
  const providers = Object.keys(grouped).sort();

  for (const provider of providers) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = provider;
    for (const modelId of grouped[provider].sort()) {
      const opt = document.createElement('option');
      opt.value = modelId;
      opt.textContent = getDisplayName(modelId, modelsRegistry);
      if (modelId === selectedModel) opt.selected = true;
      optgroup.appendChild(opt);
    }
    select.appendChild(optgroup);
  }

  select.addEventListener('change', () => onChange(select.value));
  return select;
}
