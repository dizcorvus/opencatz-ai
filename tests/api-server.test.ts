import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AthenaRESTServer } from '../src/api/server.js';
import { AthenaHub } from '../src/orchestrator/hub.js';

describe('AthenaRESTServer', () => {
  let server: AthenaRESTServer;
  let hub: AthenaHub;
  const testPort = 3099;

  beforeEach(() => {
    delete process.env.ATHENA_API_KEY;
    hub = new AthenaHub();
    server = new AthenaRESTServer(testPort);
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

  it('rejects unauthorized requests when ATHENA_API_KEY is set', async () => {
    process.env.ATHENA_API_KEY = 'secret-passphrase';
    const res = await fetch(`http://localhost:${testPort}/health`);
    expect(res.status).toBe(401);

    const authorizedRes = await fetch(`http://localhost:${testPort}/health`, {
      headers: { 'X-Athena-Api-Key': 'secret-passphrase' },
    });
    expect(authorizedRes.status).toBe(200);
  });
});
