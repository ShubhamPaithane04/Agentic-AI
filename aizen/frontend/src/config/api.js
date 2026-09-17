export const API_BASE_URL = "http://localhost:5000";

/**
 * Enhanced fetch wrapper that automatically attaches the
 * JWT Authorization header if a user is logged in.
 */
export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('aizen_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  return fetch(url, {
    ...options,
    headers,
  });
}
