import request from 'supertest';
import app from '../../src/app';

describe('Integration: API docs', () => {
  it('GET /api/docs.json returns OpenAPI spec', async () => {
    const response = await request(app).get('/api/docs.json');
    expect(response.status).toBe(200);
    expect(response.body.openapi).toBeDefined();
    expect(response.body.info?.title).toBe('TalentIQ API');
  });
});

