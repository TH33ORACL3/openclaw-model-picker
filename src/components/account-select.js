import { extractProvider, getProfilesForProvider } from '../utils/providers.js';

export function createAccountSelect(modelId, allProfiles, selectedKey, onChange) {
  const container = document.createElement('div');
  container.className = 'account-select-wrap';

  if (!modelId) {
    container.innerHTML = '<span class="muted">Select a model first</span>';
    return container;
  }

  const provider = extractProvider(modelId);
  const profiles = getProfilesForProvider(provider, allProfiles);

  if (profiles.length === 0) {
    container.innerHTML = '<span class="muted">No auth configured</span>';
    return container;
  }

  const select = document.createElement('select');
  select.className = 'account-select';

  for (const p of profiles) {
    const opt = document.createElement('option');
    opt.value = p.key;
    opt.textContent = p.email || p.key.split(':')[1] || p.key;
    if (p.key === selectedKey) opt.selected = true;
    select.appendChild(opt);
  }

  // Auto-select first if none selected
  if (!selectedKey && profiles.length > 0) {
    select.value = profiles[0].key;
    setTimeout(() => onChange(profiles[0].key), 0);
  }

  select.addEventListener('change', () => onChange(select.value));
  container.appendChild(select);

  if (profiles.length === 1) {
    select.disabled = true;
    const hint = document.createElement('span');
    hint.className = 'muted hint';
    hint.textContent = '(only account)';
    container.appendChild(hint);
  }

  return container;
}
