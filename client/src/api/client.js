// Single source of truth for the backend origin — every other file that
// needs to build an API URL (RoleContext.jsx's Google sign-in navigation
// included) imports API_ORIGIN from here instead of reading
// import.meta.env.VITE_API_URL itself. Two independent copies of this
// logic is exactly how a deployed build can silently point Google
// sign-in at the wrong domain while regular fetch() calls still work (or
// vice versa) — see the 2026-09-02 DEPLOYMENT.md entry for the real
// incident this was written for.
export const API_ORIGIN = import.meta.env.VITE_API_URL || '';

// Vite inlines import.meta.env.VITE_* at build time — if VITE_API_URL is
// missing when Vercel builds (not just missing from the dashboard *now*;
// a value added after the last build doesn't apply until the next
// build), every relative /api call in production silently resolves
// against the frontend's own origin instead of the backend, since there
// is no dev-time proxy in a static production build. Loud on purpose:
// this must be visible in the browser console immediately, not
// discovered later as a mysterious 404 on the Google sign-in button.
if (import.meta.env.PROD && !API_ORIGIN) {
  console.error(
    'Citadel misconfiguration: VITE_API_URL is not set in this production build. ' +
      'Every API call (including Google Sign-In) will incorrectly target this frontend\'s own origin instead of the backend. ' +
      'Set VITE_API_URL on Vercel to the deployed backend URL and redeploy — see .ai/DEPLOYMENT.md.'
  );
}

// Thin fetch wrapper: builds the URL, parses JSON, and throws on non-2xx so
// callers can just `await` and catch. No axios needed for this scale.
export async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_ORIGIN}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.error?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return body?.data;
}
