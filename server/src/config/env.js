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
  googleClientId: process.env.GOOGLE_CLIENT_ID || null,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || null,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/auth/google/callback',
  sessionSecret: process.env.SESSION_SECRET || null,
};

export const isProduction = env.nodeEnv === 'production';
