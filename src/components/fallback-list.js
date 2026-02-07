import { createModelSelect } from './model-select.js';
import { createAccountSelect } from './account-select.js';

export function createFallbackList(fallbacks, accountPrefs, allModels, modelsRegistry, allProfiles, onChange) {
  const container = document.createElement('div');
  container.className = 'fallback-list';

  const label = document.createElement('div');
  label.className = 'field-label';
  label.textContent = 'Fallbacks';
  container.appendChild(label);

  const list = document.createElement('div');
  list.className = 'fallback-items';
  container.appendChild(list);

  let dragIdx = null;

  function render() {
    list.innerHTML = '';
    if (fallbacks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.textContent = 'No fallbacks configured';
      list.appendChild(empty);
    }

    fallbacks.forEach((modelId, idx) => {
      const row = document.createElement('div');
      row.className = 'fallback-row';
      row.draggable = true;
      row.dataset.idx = idx;

      row.addEventListener('dragstart', (e) => {
        dragIdx = idx;
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        dragIdx = null;
      });
      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        row.classList.add('drag-over');
      });
      row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        if (dragIdx !== null && dragIdx !== idx) {
          const item = fallbacks.splice(dragIdx, 1)[0];
          fallbacks.splice(idx, 0, item);
          onChange(fallbacks);
          render();
        }
      });

      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.textContent = '::';
      row.appendChild(handle);

      const num = document.createElement('span');
      num.className = 'fallback-num';
      num.textContent = `${idx + 1}.`;
      row.appendChild(num);

      const modelWrap = document.createElement('div');
      modelWrap.className = 'fallback-model';
      modelWrap.appendChild(createModelSelect(allModels, modelsRegistry, modelId, (newModel) => {
        fallbacks[idx] = newModel;
        onChange(fallbacks);
        render();
      }));
      row.appendChild(modelWrap);

      const accountKey = accountPrefs[idx] || null;
      const accountWrap = document.createElement('div');
      accountWrap.className = 'fallback-account';
      accountWrap.appendChild(createAccountSelect(modelId, allProfiles, accountKey, (key) => {
        if (!accountPrefs[idx]) accountPrefs[idx] = key;
        accountPrefs[idx] = key;
        onChange(fallbacks);
      }));
      row.appendChild(accountWrap);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-icon btn-remove';
      removeBtn.textContent = '\u00d7';
      removeBtn.title = 'Remove fallback';
      removeBtn.addEventListener('click', () => {
        fallbacks.splice(idx, 1);
        accountPrefs.splice(idx, 1);
        onChange(fallbacks);
        render();
      });
      row.appendChild(removeBtn);

      list.appendChild(row);
    });
  }

  render();

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-small btn-add-fallback';
  addBtn.textContent = '+ Add fallback';
  addBtn.addEventListener('click', () => {
    fallbacks.push(allModels[0] || '');
    accountPrefs.push(null);
    onChange(fallbacks);
    render();
  });
  container.appendChild(addBtn);

  return container;
}
