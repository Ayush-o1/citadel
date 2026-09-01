import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';

// In production, a missing CLIENT_ORIGIN must fail startup loudly rather
// than silently fall back to localhost — that fallback would make CORS
// reject every request from the real deployed frontend, which looks like
// a broken app (health check still passes) instead of a clear deploy
// misconfiguration in the logs. Local dev keeps the friendly default.
export const env = {
  nodeEnv,
  port: Number(process.env.PORT) || 4000,
  clientOrigin: nodeEnv === 'production' ? required('CLIENT_ORIGIN') : process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: required('DATABASE_URL'),
  // The full downloaded service-account JSON, as one env var (Render and
  // Vercel both handle multi-line env var values fine via their
  // dashboards — no need to split it into three separate fields). Never
  // committed: the raw file is gitignored (*firebase-adminsdk*.json),
  // and this only ever holds it in-memory via process.env.
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || null,
  sessionSecret: process.env.SESSION_SECRET || null,
};

export const isProduction = env.nodeEnv === 'production';
