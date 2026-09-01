import { app } from './app.js';
import { env } from './config/env.js';
import { checkConnection } from './config/db.js';

async function start() {
  try {
    await checkConnection();
    console.log('Database connection OK');
  } catch (err) {
    console.warn('Could not reach the database at startup:', err.message);
    console.warn('The server will still start — check DATABASE_URL and run `npm run migrate`.');
  }

  app.listen(env.port, () => {
    console.log(`Citadel API listening on port ${env.port}`);
  });
}

start();
