import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(config => {
  const { orgUrl, pat } = useAuthStore.getState();

  if (orgUrl) {
    config.baseURL = orgUrl;
  }

  if (pat) {
    // Azure DevOps PAT: Basic auth with empty username
    const token = btoa(`:${pat}`);
    config.headers.Authorization = `Basic ${token}`;
  }

  return config;
});

client.interceptors.response.use(
  res => res,
  error => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      // Session expired — clear PAT but keep orgUrl so login screen can pre-fill it
      useAuthStore.getState().expireSession();
      return Promise.reject(new Error('Session expired. Please sign in again.'));
    }
    const message = error?.response?.data?.message ?? error?.message ?? 'Unknown error';
    return Promise.reject(new Error(message));
  },
);

export default client;
