import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import { app } from '../src/server/app.js';
import { prisma } from '../src/server/db/prisma.js';

let server: any;

beforeAll(async () => {
  server = createServer(app).listen(0);
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

describe('Auth', () => {
  it('signs up and logs in', async () => {
    const email = `user+${Math.random()}@test.com`;
    const password = 'password123';
    const signup = await request(server).post('/api/auth/signup').send({ email, password, name: 'Tester' });
    expect(signup.status).toBe(201);
    expect(signup.body.accessToken).toBeTruthy();
    const login = await request(server).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.refreshToken).toBeTruthy();
  });
});


