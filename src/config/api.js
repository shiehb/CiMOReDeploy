// Environment-based API configuration
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API = API_BASE;
export const authHeaders = () => ({
  'Authorization': `Token ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json',
});

/**
 * Drop-in replacement for fetch() that fires 'cimore:auth-expired' on 401.
 * App.jsx listens for this event and calls handleLogout automatically.
 */
export async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('cimore:auth-expired'));
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
