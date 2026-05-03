// Environment-based API configuration
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API = API_BASE;
export const authHeaders = () => ({
  'Authorization': `Token ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json',
});

// Prevents concurrent 401 responses from each dispatching their own logout event.
// One dispatch per logout cycle is enough; the flag resets after App.jsx has had
// time to clear state and show the login screen.
let _authExpiredFired = false;

/**
 * Drop-in replacement for fetch() that fires 'cimore:auth-expired' on 401.
 * App.jsx listens for this event and calls handleLogout automatically.
 * Guards:
 *  1. Only fires if a token is present (real 401, not "already logged out").
 *  2. Deduplicates so concurrent 401s don't each trigger a separate logout.
 */
export async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 401) {
    const token = localStorage.getItem('authToken');
    if (token && !_authExpiredFired) {
      _authExpiredFired = true;
      window.dispatchEvent(new CustomEvent('cimore:auth-expired'));
      // Reset after handleLogout has cleared state and the login view has rendered
      setTimeout(() => { _authExpiredFired = false; }, 5000);
    }
  }
  return response;
}

/**
 * Reads the `exp` claim from a JWT stored in localStorage.
 * Returns a Date, or null if the token is missing, opaque, or malformed.
 */
export function getTokenExpiry() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null; // Not a JWT (e.g. DRF opaque token)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return null;
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}
