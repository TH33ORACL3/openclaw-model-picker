# OpenClaw Model Picker

A local web UI for configuring which AI models your [OpenClaw](https://github.com/nichochar/openclaw) agents and cron jobs use. Manage global defaults, per-agent overrides, fallback chains, and cron job model assignments from a single dashboard instead of editing JSON by hand.

![OpenClaw Model Picker](docs/screenshot.png)

## Features

### Agents

- **Global defaults** with primary model and ordered fallback chain
- **Per-agent overrides** or inherit from defaults with a single checkbox
- **Multi-account support** per provider with automatic filtering
- **Drag-and-drop fallback ordering**

### Cron Jobs

- **Cron-specific global default** (single model, no fallback chain)
- **Per-job model assignment** or inherit from cron default with a toggle
- **Job metadata at a glance** -- schedule, status, enabled/disabled, last run, next run, duration
- **Independent from agent defaults** -- changing one never affects the other

### General

- **Sidebar navigation** between Agents and Cron Jobs views
- **Searchable model dropdowns** with type-to-filter, keyboard navigation, and provider grouping
- **Auto-discovery of custom providers** (e.g. Ollama, local models) alongside built-in models
- **Live reload** from config files -- no restart needed
- **Safe writes** with atomic file operations and rotating backups
- **Light and dark mode** via `prefers-color-scheme`

![Searchable dropdown](docs/screenshot-search.png)

## Quick Start

```bash
git clone https://github.com/TH33ORACL3/openclaw-model-picker.git
cd openclaw-model-picker
pnpm install
pnpm dev
```

Open [http://localhost:5199](http://localhost:5199) in your browser.

## Prerequisites

- **Node.js** 18+
- **pnpm** (or npm/yarn)
- An existing [OpenClaw](https://github.com/nichochar/openclaw) installation with `~/.openclaw/openclaw.json`
- *(Optional)* An OpenClaw cron configuration at `~/.openclaw/cron/jobs.json` for cron job management

## How It Works

```
Browser (localhost:5199)
        |
        |  GET/POST /api/config   (agents, models, auth)
        |  GET/POST /api/state    (UI preferences)
        |  GET/POST /api/cron     (cron job models)
        v
Vite Dev Server (plugin middleware)
        |
        |  read/write
        v
~/.openclaw/openclaw.json            <- agent config (models, agents, auth)
~/.openclaw/model-picker-state.json  <- UI state (account selections, cron defaults)
~/.openclaw/cron/jobs.json           <- cron job config (schedules, models, state)
```

### Save Behavior

**Agent config** (`openclaw.json`):

1. Written atomically (write to `.tmp`, then rename)
2. Previous config is backed up (`.bak`, `.bak.1`, ... `.bak.5`)
3. `meta.lastTouchedAt` is updated, triggering the OpenClaw gateway's file watcher
4. Gateway auto-reloads -- no manual restart needed

**Cron job config** (`jobs.json`):

1. Written atomically (same tmp+rename pattern)
2. Backed up with 3-generation rotation (`.bak`, `.bak.1`, `.bak.2`)
3. Jobs with "Use global default" toggled on get the default model written directly into their `payload.model` field

**UI state** (`model-picker-state.json`):

Persists account selections, cron global default, and per-job default toggles across reloads.

## Model Sources

The picker merges models from two places in `openclaw.json`:

| Source | Path | Purpose |
|--------|------|---------|
| Built-in registry | `agents.defaults.models` | Models from OpenClaw's known providers |
| Custom providers | `models.providers.*` | Self-hosted or third-party models (Ollama, etc.) |

Models are deduplicated by canonical ID (`provider/model-id`). If a model exists in both sources, the registry entry takes priority.

## Project Structure

```
model-picker/
  index.html                          # Shell HTML (header, sidebar, footer)
  vite.config.js                      # Vite config with API plugin
  package.json
  public/
    logo.png                          # AZ Labs logo
  server/
    plugin.js                         # Vite middleware: /api/config, /api/state, /api/cron
    config-io.js                      # Read/write openclaw.json (5-gen backups)
    state-io.js                       # Read/write model-picker-state.json
    cron-io.js                        # Read/write jobs.json (3-gen backups)
  src/
    main.js                           # Entry point, init, save/reload orchestration
    state.js                          # Reactive state store (subscribe/update)
    render.js                         # DOM rendering, sidebar navigation, view switching
    api.js                            # Fetch client for all /api endpoints
    style.css                         # All styles (light/dark, responsive)
    components/
      defaults-panel.js               # Agent global defaults (primary + fallbacks)
      cron-defaults-panel.js          # Cron global default (single model)
      agent-card.js                   # Per-agent config card
      cron-job-card.js                # Per-cron-job card (model + metadata)
      model-select.js                 # Searchable model dropdown
      account-select.js               # Auth profile picker
      fallback-list.js                # Drag-sortable fallback chain
      toast.js                        # Notification toasts
    utils/
      config.js                       # Model resolution/serialization helpers
      providers.js                    # Provider parsing, grouping, model merging
```

## Configuration Reference

### Agent Defaults (`openclaw.json`)

```jsonc
// agents.defaults.model
{
  "primary": "google-antigravity/claude-sonnet-4-5",
  "fallbacks": [
    "google-antigravity/gemini-3-flash",
    "google-antigravity/gemini-3-pro-low"
  ]
}
```

### Per-Agent Override (`openclaw.json`)

```jsonc
// agents.list[]
{
  "id": "richard",
  "model": "github-copilot/grok-code-fast-1"
  // omit "model" to inherit global defaults
}
```

### Custom Providers (`openclaw.json`)

```jsonc
// models.providers
{
  "ollama": {
    "api": "openai-completions",
    "baseUrl": "http://127.0.0.1:11434/v1",
    "models": [
      {
        "id": "qwen3-coder-next:cloud",
        "contextWindow": 131072,
        "maxTokens": 16384
      }
    ]
  }
}
```

### Cron Jobs (`~/.openclaw/cron/jobs.json`)

```jsonc
{
  "jobs": [
    {
      "id": "daily-digest",
      "name": "Daily Digest",
      "enabled": true,
      "schedule": { "type": "interval", "intervalMs": 86400000 },
      "payload": {
        "model": "google-antigravity/gemini-3-flash"
      },
      "state": {
        "lastRunAtMs": 1738800000000,
        "nextRunAtMs": 1738886400000,
        "lastDurationMs": 12340,
        "status": "ok"
      }
    }
  ]
}
```

The cron global default and per-job toggle states are stored in the UI sidecar (`model-picker-state.json`), not in `jobs.json`. On save, jobs with "Use global default" enabled get the default model written directly into their `payload.model` field.

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/config` | Read agent config (agents, auth, models) |
| `POST` | `/api/config` | Write agent model assignments and defaults |
| `GET` | `/api/state` | Read UI state (account prefs, cron defaults) |
| `POST` | `/api/state` | Write UI state |
| `GET` | `/api/cron` | Read cron job definitions |
| `POST` | `/api/cron` | Write cron job model assignments |

## Tech Stack

- **[Vite](https://vitejs.dev/)** -- dev server + build tooling
- **Vanilla JS** -- no framework, no build-time dependencies
- **CSS custom properties** -- theming via `light-dark()` and `color-scheme`

## License

MIT -- Created by [AZ Labs](https://azlabs.ai)
