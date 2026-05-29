import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

export const API_URL =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    : 'http://localhost:3001';

// ─── Token storage ────────────────────────────────────────────────────────────
export const tokenStorage = {
  getAccess: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('mf_access') : null,

  setAccess: (t: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mf_access', t);
    // Cookie for Next.js middleware edge runtime
    document.cookie = `mf_access=${t}; path=/; max-age=900; SameSite=Strict`;
  },

  getRefresh: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('mf_refresh') : null,

  setRefresh: (t: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mf_refresh', t);
  },

  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('mf_access');
    localStorage.removeItem('mf_refresh');
    document.cookie = 'mf_access=; path=/; max-age=0';
  },
};

// ─── Axios instance ───────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Attach access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
type FailedItem = { resolve: (v: unknown) => void; reject: (e: unknown) => void };
let failedQueue: FailedItem[] = [];

const processQueue = (err: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((p) => (err ? p.reject(err) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);

    const refresh = tokenStorage.getRefresh();
    if (!refresh) {
      tokenStorage.clear();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => failedQueue.push({ resolve, reject })).then(
        (token) => {
          if (original.headers) original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        },
      );
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh });
      tokenStorage.setAccess(data.accessToken);
      tokenStorage.setRefresh(data.refreshToken);
      processQueue(null, data.accessToken);
      if (original.headers) original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (e) {
      processQueue(e as AxiosError, null);
      tokenStorage.clear();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;

// ─── Typed API helpers ────────────────────────────────────────────────────────

export interface LoginResult {
  requiresPasswordReset?: boolean;
  requires2FA?: boolean;
  userId?: string;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface MeResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  twoFactorEnabled: boolean;
  department: { id: string; name: string } | null;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResult>('/auth/login', { email, password }),

  firstPassword: (tempToken: string, newPassword: string) =>
    api.post<LoginResult>('/auth/first-password', { tempToken, newPassword }),

  verify2FA: (userId: string, code: string) =>
    api.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
      '/auth/2fa/verify',
      { userId, code },
    ),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),

  setup2FA: () => api.post<{ secret: string; qrCodeUrl: string }>('/auth/2fa/setup'),

  enable2FA: (code: string) => api.post<{ message: string }>('/auth/2fa/enable', { code }),
};

export const usersApi = {
  getMe: () => api.get<MeResult>('/users/me'),
  updateProfile: (data: { firstName?: string; lastName?: string; departmentId?: string }) =>
    api.patch<MeResult>('/users/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<{ message: string }>('/users/change-password', { currentPassword, newPassword }),
};
