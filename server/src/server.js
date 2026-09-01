import { app } from './app.js';
import { env, isProduction } from './config/env.js';
import { checkConnection } from './config/db.js';

async function start() {
  try {
    await checkConnection();
    console.log('Database connection OK');
  } catch (err) {
    console.warn('Could not reach the database at startup:', err.message);
    console.warn('The server will still start — check DATABASE_URL and run `npm run migrate`.');
  }

  // A real, easy-to-make deploy mistake: GOOGLE_CLIENT_ID/SECRET get set
  // on the host but GOOGLE_REDIRECT_URI is left at its localhost default.
  // Google still shows a valid consent screen (the client id is real), so
  // this doesn't fail loudly — it silently redirects every signed-in user
  // to a URL on their own machine instead of back to the deployed app.
  // Not worth crashing startup over (the rest of the app works fine
  // without Google auth), but worth a loud log line pointing at the fix.
  if (isProduction && env.googleClientId && env.googleRedirectUri.includes('localhost')) {
    console.warn(
      'WARNING: GOOGLE_CLIENT_ID is set but GOOGLE_REDIRECT_URI still looks like the localhost default ' +
        `(${env.googleRedirectUri}). Google Sign-In will silently redirect users to their own machine instead ` +
        'of this deployment. Set GOOGLE_REDIRECT_URI to the real deployed callback URL — see DEPLOYMENT.md.'
    );
  }

  app.listen(env.port, () => {
    console.log(`Citadel API listening on port ${env.port}`);
  });
}

start();
