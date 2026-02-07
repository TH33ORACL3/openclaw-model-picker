import { readConfig, writeConfig } from './config-io.js';
import { readState, writeState } from './state-io.js';
import { readCronJobs, writeCronJobs } from './cron-io.js';

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(e); }
    });
  });
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export function modelPickerApi() {
  return {
    name: 'model-picker-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/config' && req.method === 'GET') {
          try {
            const config = await readConfig();
            sendJson(res, {
              agents: config.agents,
              auth: config.auth,
              models: config.models
            });
          } catch (e) {
            sendJson(res, { error: e.message }, 500);
          }
          return;
        }

        if (req.url === '/api/config' && req.method === 'POST') {
          try {
            const body = await parseBody(req);
            const updated = await writeConfig(current => {
              // Update agent model fields
              if (body.agentModels) {
                for (const [agentId, modelValue] of Object.entries(body.agentModels)) {
                  const agent = current.agents.list.find(a => a.id === agentId);
                  if (agent) {
                    if (modelValue === null || modelValue === undefined) {
                      delete agent.model;
                    } else {
                      agent.model = modelValue;
                    }
                  }
                }
              }
              // OpenClaw schema requires { primary: string, fallbacks: string[] }
              if (body.defaultsModel !== undefined) {
                if (typeof body.defaultsModel === 'string') {
                  current.agents.defaults.model = {
                    primary: body.defaultsModel,
                    fallbacks: []
                  };
                } else {
                  current.agents.defaults.model = {
                    primary: body.defaultsModel.primary || '',
                    fallbacks: Array.isArray(body.defaultsModel.fallbacks)
                      ? body.defaultsModel.fallbacks
                      : []
                  };
                }
              }
              // Update auth order
              if (body.authOrder !== undefined) {
                current.auth.order = body.authOrder;
              }
              return current;
            });
            sendJson(res, { ok: true });
          } catch (e) {
            sendJson(res, { error: e.message }, 500);
          }
          return;
        }

        if (req.url === '/api/state' && req.method === 'GET') {
          try {
            const state = await readState();
            sendJson(res, state);
          } catch (e) {
            sendJson(res, { error: e.message }, 500);
          }
          return;
        }

        if (req.url === '/api/state' && req.method === 'POST') {
          try {
            const body = await parseBody(req);
            const state = await writeState(body);
            sendJson(res, { ok: true });
          } catch (e) {
            sendJson(res, { error: e.message }, 500);
          }
          return;
        }

        if (req.url === '/api/cron' && req.method === 'GET') {
          try {
            const data = await readCronJobs();
            sendJson(res, data);
          } catch (e) {
            sendJson(res, { error: e.message }, 500);
          }
          return;
        }

        if (req.url === '/api/cron' && req.method === 'POST') {
          try {
            const body = await parseBody(req);
            await writeCronJobs(current => {
              if (body.jobModels) {
                for (const { id, model } of body.jobModels) {
                  const job = current.jobs.find(j => j.id === id);
                  if (job && job.payload) {
                    job.payload.model = model;
                  }
                }
              }
              return current;
            });
            sendJson(res, { ok: true });
          } catch (e) {
            sendJson(res, { error: e.message }, 500);
          }
          return;
        }

        next();
      });
    }
  };
}
