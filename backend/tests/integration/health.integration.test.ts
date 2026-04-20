import request from 'supertest';
import app from '../../src/app';

describe('Integration: health endpoint', () => {
  it('GET /health returns service status payload', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      status: 'ok',
      service: 'TalentIQ API',
      version: '1.0.0',
    }));
    expect(typeof response.body.timestamp).toBe('string');
    expect(['connected', 'disconnected']).toContain(response.body.db);
  });

  it('GET /unknown-route returns 404', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(404);
  });
});
