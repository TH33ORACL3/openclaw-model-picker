import { groupModelsByProvider, getDisplayName, extractProvider } from '../utils/providers.js';

export function createModelSelect(allModels, modelsRegistry, selectedModel, onChange) {
  const wrapper = document.createElement('div');
  wrapper.className = 'model-picker-dropdown';

  const grouped = groupModelsByProvider(allModels);
  const providers = Object.keys(grouped).sort();

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'model-picker-trigger';

  function setTriggerLabel(modelId) {
    if (!modelId) {
      trigger.textContent = 'Select model...';
      return;
    }
    const provider = extractProvider(modelId);
    const display = getDisplayName(modelId, modelsRegistry);
    trigger.innerHTML = '';
    const provTag = document.createElement('span');
    provTag.className = 'model-picker-provider-tag';
    provTag.textContent = provider;
    trigger.appendChild(provTag);
    trigger.appendChild(document.createTextNode(display));
  }

  setTriggerLabel(selectedModel);
  wrapper.appendChild(trigger);

  const panel = document.createElement('div');
  panel.className = 'model-picker-panel';
  panel.style.display = 'none';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'model-picker-search';
  searchInput.placeholder = 'Search models...';
  searchInput.autocomplete = 'off';
  panel.appendChild(searchInput);

  const listContainer = document.createElement('div');
  listContainer.className = 'model-picker-list';
  panel.appendChild(listContainer);

  let currentValue = selectedModel;
  let focusedIndex = -1;
  let visibleItems = [];

  function buildList(filter) {
    listContainer.innerHTML = '';
    visibleItems = [];
    focusedIndex = -1;
    const query = (filter || '').toLowerCase();

    for (const provider of providers) {
      const models = grouped[provider].sort();
      const matching = models.filter(id => {
        if (!query) return true;
        const display = getDisplayName(id, modelsRegistry).toLowerCase();
        return id.toLowerCase().includes(query) || display.includes(query) || provider.toLowerCase().includes(query);
      });

      if (matching.length === 0) continue;

      const groupHeader = document.createElement('div');
      groupHeader.className = 'model-picker-group';
      groupHeader.textContent = provider;
      listContainer.appendChild(groupHeader);

      for (const modelId of matching) {
        const item = document.createElement('div');
        item.className = 'model-picker-item';
        if (modelId === currentValue) item.classList.add('selected');
        item.textContent = getDisplayName(modelId, modelsRegistry);
        item.dataset.value = modelId;

        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          selectItem(modelId);
        });

        item.addEventListener('mouseenter', () => {
          clearFocus();
          focusedIndex = visibleItems.indexOf(item);
          item.classList.add('focused');
        });

        listContainer.appendChild(item);
        visibleItems.push(item);
      }
    }

    if (visibleItems.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'model-picker-empty';
      empty.textContent = 'No models found';
      listContainer.appendChild(empty);
    }
  }

  function clearFocus() {
    for (const item of visibleItems) item.classList.remove('focused');
  }

  function scrollFocusedIntoView() {
    if (focusedIndex >= 0 && focusedIndex < visibleItems.length) {
      visibleItems[focusedIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  function selectItem(modelId) {
    currentValue = modelId;
    setTriggerLabel(modelId);
    closePanel();
    onChange(modelId);
  }

  function openPanel() {
    panel.style.display = '';
    searchInput.value = '';
    buildList('');
    wrapper.classList.add('open');

    const selectedEl = listContainer.querySelector('.model-picker-item.selected');
    if (selectedEl) {
      requestAnimationFrame(() => selectedEl.scrollIntoView({ block: 'nearest' }));
    }

    requestAnimationFrame(() => searchInput.focus());
  }

  function closePanel() {
    panel.style.display = 'none';
    wrapper.classList.remove('open');
    searchInput.value = '';
    focusedIndex = -1;
  }

  function isOpen() {
    return panel.style.display !== 'none';
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen()) {
      closePanel();
    } else {
      openPanel();
    }
  });

  searchInput.addEventListener('input', () => {
    buildList(searchInput.value);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      clearFocus();
      focusedIndex = Math.min(focusedIndex + 1, visibleItems.length - 1);
      if (visibleItems[focusedIndex]) visibleItems[focusedIndex].classList.add('focused');
      scrollFocusedIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      clearFocus();
      focusedIndex = Math.max(focusedIndex - 1, 0);
      if (visibleItems[focusedIndex]) visibleItems[focusedIndex].classList.add('focused');
      scrollFocusedIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < visibleItems.length) {
        selectItem(visibleItems[focusedIndex].dataset.value);
      }
    } else if (e.key === 'Escape') {
      closePanel();
      trigger.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (isOpen() && !wrapper.contains(e.target)) {
      closePanel();
    }
  });

  wrapper.appendChild(panel);
  return wrapper;
}
