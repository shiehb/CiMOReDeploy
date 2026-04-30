// Environment-based API configuration
const API_BASE = import.meta.env.VITE_API_URL || 'https://ci-mo-re-deploy-isra.vercel.app';

export const API = API_BASE;
export const authHeaders = () => ({
  'Authorization': `Token ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json',
});
