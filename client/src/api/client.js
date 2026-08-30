const BASE_URL = import.meta.env.VITE_API_URL || '';

// Thin fetch wrapper: builds the URL, parses JSON, and throws on non-2xx so
// callers can just `await` and catch. No axios needed for this scale.
export async function apiRequest(path, options = {}) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.error?.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return body?.data;
}
