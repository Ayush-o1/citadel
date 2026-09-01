import { app } from './app.js';
import { env, isProduction } from './config/env.js';
import { checkConnection } from './config/db.js';
import { isFirebaseConfigured } from './config/firebaseAdmin.js';

async function start() {
  try {
    await checkConnection();
    console.log('Database connection OK');
  } catch (err) {
    console.warn('Could not reach the database at startup:', err.message);
    console.warn('The server will still start — check DATABASE_URL and run `npm run migrate`.');
  }

  // Not worth crashing startup over (the rest of the app works fine
  // without Google Sign-In configured), but worth a loud log line —
  // a missing/invalid service account otherwise only surfaces the first
  // time someone actually tries to sign in.
  if (isProduction && !isFirebaseConfigured()) {
    console.warn(
      'WARNING: FIREBASE_SERVICE_ACCOUNT_JSON is not set. Google Sign-In will be unavailable until it is — see DEPLOYMENT.md.'
    );
  } else if (isFirebaseConfigured()) {
    try {
      JSON.parse(env.firebaseServiceAccountJson);
    } catch {
      console.warn(
        'WARNING: FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON — paste the exact contents of the ' +
          'downloaded service account file. Google Sign-In will fail until this is fixed.'
      );
    }
  }

  app.listen(env.port, () => {
    console.log(`Citadel API listening on port ${env.port}`);
  });
}

start();
