import type { User, EmailJob, ScheduleEmailRequest } from '../types';

const API_BASE = '';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    getMe: () => fetchApi<{ user: User }>('/auth/me'),
    logout: () => fetchApi<{ message: string }>('/auth/logout', { method: 'POST' }),
  },
  emails: {
    schedule: (data: ScheduleEmailRequest) =>
      fetchApi<{ message: string; jobs: EmailJob[] }>('/emails/schedule', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getScheduled: () => fetchApi<{ emails: EmailJob[] }>('/emails/scheduled'),
    getSent: () => fetchApi<{ emails: EmailJob[] }>('/emails/sent'),
    getById: (id: string) => fetchApi<{ email: EmailJob }>(`/emails/${id}`),
  },
};
