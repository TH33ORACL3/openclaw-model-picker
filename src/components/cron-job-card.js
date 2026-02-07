import { createModelSelect } from './model-select.js';

function formatSchedule(schedule) {
  if (!schedule) return 'Unknown';
  switch (schedule.kind) {
    case 'every': {
      const ms = schedule.everyMs;
      if (ms >= 3600000) return `Every ${ms / 3600000}h`;
      if (ms >= 60000) return `Every ${ms / 60000}m`;
      return `Every ${ms / 1000}s`;
    }
    case 'cron': {
      const expr = schedule.expr || '';
      const parts = expr.split(' ');
      if (parts.length >= 5) {
        const [min, hour] = parts;
        if (parts.slice(2).join(' ') === '* * *') {
          return `Daily at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
        }
      }
      return `Cron: ${expr}`;
    }
    case 'at':
      return 'One-shot';
    default:
      return schedule.kind;
  }
}

function formatTimestamp(ms) {
  if (!ms) return null;
  const d = new Date(ms);
  const now = Date.now();
  const diff = now - ms;

  if (diff >= 0) {
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  }

  const until = -diff;
  if (until < 60000) return 'in <1m';
  if (until < 3600000) return `in ${Math.floor(until / 60000)}m`;
  if (until < 86400000) return `in ${Math.floor(until / 3600000)}h`;
  return d.toLocaleDateString();
}

export function createCronJobCard(job, allModels, modelsRegistry, cronDefault, useDefault, onChange, onToggleDefault) {
  const card = document.createElement('div');
  card.className = `cron-card${job.enabled === false ? ' cron-card-disabled' : ''}`;
  card.dataset.jobId = job.id;

  const header = document.createElement('div');
  header.className = 'cron-card-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'cron-card-title-wrap';

  const title = document.createElement('h3');
  title.textContent = job.name || job.id;
  titleWrap.appendChild(title);

  const headerRight = document.createElement('div');
  headerRight.className = 'cron-card-meta';

  const scheduleBadge = document.createElement('span');
  scheduleBadge.className = 'cron-badge cron-badge-schedule';
  scheduleBadge.textContent = formatSchedule(job.schedule);
  headerRight.appendChild(scheduleBadge);

  if (job.enabled === false) {
    const disabledBadge = document.createElement('span');
    disabledBadge.className = 'cron-badge cron-badge-disabled';
    disabledBadge.textContent = 'Disabled';
    headerRight.appendChild(disabledBadge);
  } else {
    const enabledBadge = document.createElement('span');
    enabledBadge.className = 'cron-badge cron-badge-enabled';
    enabledBadge.textContent = 'Enabled';
    headerRight.appendChild(enabledBadge);
  }

  if (job.state?.lastStatus) {
    const statusBadge = document.createElement('span');
    statusBadge.className = `cron-badge cron-badge-status-${job.state.lastStatus}`;
    statusBadge.textContent = job.state.lastStatus;
    headerRight.appendChild(statusBadge);
  }

  header.appendChild(titleWrap);
  header.appendChild(headerRight);
  card.appendChild(header);

  const details = document.createElement('div');
  details.className = 'cron-card-details';

  const lastRun = formatTimestamp(job.state?.lastRunAtMs);
  if (lastRun) {
    const lastRunEl = document.createElement('span');
    lastRunEl.className = 'cron-detail';
    lastRunEl.innerHTML = `<span class="cron-detail-label">Last run</span> ${lastRun}`;
    details.appendChild(lastRunEl);
  }

  const nextRun = formatTimestamp(job.state?.nextRunAtMs);
  if (nextRun) {
    const nextRunEl = document.createElement('span');
    nextRunEl.className = 'cron-detail';
    nextRunEl.innerHTML = `<span class="cron-detail-label">Next run</span> ${nextRun}`;
    details.appendChild(nextRunEl);
  }

  if (job.state?.lastDurationMs) {
    const dur = job.state.lastDurationMs;
    let durText;
    if (dur < 1000) durText = `${dur}ms`;
    else if (dur < 60000) durText = `${(dur / 1000).toFixed(1)}s`;
    else durText = `${(dur / 60000).toFixed(1)}m`;
    const durEl = document.createElement('span');
    durEl.className = 'cron-detail';
    durEl.innerHTML = `<span class="cron-detail-label">Duration</span> ${durText}`;
    details.appendChild(durEl);
  }

  if (details.children.length > 0) {
    card.appendChild(details);
  }

  const defaultsRow = document.createElement('label');
  defaultsRow.className = 'defaults-toggle';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = useDefault;
  const checkLabel = document.createElement('span');
  checkLabel.textContent = 'Use global default';
  defaultsRow.appendChild(checkbox);
  defaultsRow.appendChild(checkLabel);
  card.appendChild(defaultsRow);

  const body = document.createElement('div');
  body.className = 'cron-card-body';

  function renderBody() {
    body.innerHTML = '';

    if (checkbox.checked) {
      const hint = document.createElement('div');
      hint.className = 'muted defaults-hint';
      hint.textContent = cronDefault
        ? `Using default: ${cronDefault}`
        : 'No cron default set — select one in the panel above.';
      body.appendChild(hint);
      return;
    }

    const label = document.createElement('div');
    label.className = 'field-label';
    label.textContent = 'Model';
    body.appendChild(label);

    const currentModel = job.payload?.model || '';
    body.appendChild(createModelSelect(allModels, modelsRegistry, currentModel, (newModel) => {
      onChange(job.id, newModel);
    }));
  }

  checkbox.addEventListener('change', () => {
    onToggleDefault(job.id, checkbox.checked);
    renderBody();
  });

  renderBody();
  card.appendChild(body);
  return card;
}
