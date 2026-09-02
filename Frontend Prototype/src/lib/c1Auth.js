/** Component 1 API login — shared session cookies are set on localhost:8000 for the clinical app. */
const C1_API_URL = import.meta.env.VITE_C1_API_URL || 'http://localhost:8000';

export async function loginC1Doctor(email, password, remember = true) {
  const response = await fetch(`${C1_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      remember_me: remember,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Invalid email or password');
  }

  return response.json();
}

export function storeC1Session(csrfToken) {
  if (csrfToken) {
    localStorage.setItem('fednutri_c1_csrf', csrfToken);
  }
}

export function readStoredC1Csrf() {
  return localStorage.getItem('fednutri_c1_csrf') || '';
}

export function buildC1EntryUrl(path = '/auth/hub') {
  const base = import.meta.env.VITE_C1_APP_URL || 'http://localhost:3000';
  const csrf = readStoredC1Csrf();
  const url = new URL(path, base);
  if (csrf) {
    url.hash = `csrf=${encodeURIComponent(csrf)}`;
  }
  return url.toString();
}
