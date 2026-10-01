import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AxiosAdapter, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { api, refreshClient, setSessionExpiredHandler } from './client';

function respond(config: InternalAxiosRequestConfig, status: number): Promise<AxiosResponse> {
  const response = { data: {}, status, statusText: '', headers: {}, config };
  if (status < 400) return Promise.resolve(response);
  return Promise.reject(new AxiosError('failed', String(status), config, null, response));
}

describe('api client token refresh', () => {
  let refreshCalls: number;
  let sessionExpired: number;
  let sessionValid: boolean;

  beforeEach(() => {
    refreshCalls = 0;
    sessionExpired = 0;
    sessionValid = false;
    setSessionExpiredHandler(() => sessionExpired++);
    api.defaults.adapter = ((config) => respond(config, sessionValid ? 200 : 401)) as AxiosAdapter;
  });

  afterEach(() => {
    setSessionExpiredHandler(() => {});
  });

  it('shares one refresh between parallel 401s and retries all requests', async () => {
    refreshClient.defaults.adapter = (async (config) => {
      refreshCalls++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      sessionValid = true;
      return respond(config, 200);
    }) as AxiosAdapter;

    const results = await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);

    assert.equal(refreshCalls, 1);
    assert.deepEqual(results.map((r) => r.status), [200, 200, 200]);
  });

  it('reports an expired session and rethrows the 401 when the refresh fails', async () => {
    refreshClient.defaults.adapter = ((config) => {
      refreshCalls++;
      return respond(config, 401);
    }) as AxiosAdapter;

    await assert.rejects(api.get('/a'), (error: AxiosError) => error.response?.status === 401);
    assert.equal(refreshCalls, 1);
    assert.equal(sessionExpired, 1);
  });

  it('does not refresh for other errors', async () => {
    api.defaults.adapter = ((config) => respond(config, 403)) as AxiosAdapter;
    refreshClient.defaults.adapter = ((config) => {
      refreshCalls++;
      return respond(config, 200);
    }) as AxiosAdapter;

    await assert.rejects(api.get('/a'));
    assert.equal(refreshCalls, 0);
  });
});
