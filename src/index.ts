import 'dotenv/config';
import { createServer } from 'http';
import { app } from './server/app.js';
import { env } from './server/config/env.js';
import { logger } from './server/config/logger.js';

const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server listening');
});


