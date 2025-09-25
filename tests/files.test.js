import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import { app } from '../src/server/app.js';
import { prisma } from '../src/server/db/prisma.js';
let server;
let accessToken;
beforeAll(async () => {
    server = createServer(app).listen(0);
    await prisma.$connect();
    const email = `fileuser+${Math.random()}@test.com`;
    const password = 'password123';
    const signup = await request(server).post('/api/auth/signup').send({ email, password, name: 'File User' });
    accessToken = signup.body.accessToken;
});
afterAll(async () => {
    await prisma.$disconnect();
    server.close();
});
describe('Files', () => {
    it('lists files (empty)', async () => {
        const res = await request(server).get('/api/files').set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.files)).toBe(true);
    });
});
