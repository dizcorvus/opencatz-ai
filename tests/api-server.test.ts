import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OpenCatzRESTServer } from '../src/api/server.js';
import { OpenCatzHub } from '../src/orchestrator/hub.js';

describe('OpenCatzRESTServer', () => {
  let server: OpenCatzRESTServer;
  let hub: OpenCatzHub;
  const testPort = 3099;

  beforeEach(() => {
    delete process.env.OPENCATZ_API_KEY;
    hub = new OpenCatzHub();
    server = new OpenCatzRESTServer(testPort);
    server.start(hub);
  });

  afterEach(async () => {
    await server.stop();
  });

  it('responds to GET /health with system status', async () => {
    const res = await fetch(`http://localhost:${testPort}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.status).toBeDefined();
  });

  it('rejects unauthorized requests when OPENCATZ_API_KEY is set', async () => {
    process.env.OPENCATZ_API_KEY = 'secret-passphrase';
    const res = await fetch(`http://localhost:${testPort}/health`);
    expect(res.status).toBe(401);

    const authorizedRes = await fetch(`http://localhost:${testPort}/health`, {
      headers: { 'X-OpenCatz-Api-Key': 'secret-passphrase' },
    });
    expect(authorizedRes.status).toBe(200);
  });
});
