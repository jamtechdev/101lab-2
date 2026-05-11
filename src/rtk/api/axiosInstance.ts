import axios from 'axios';

const system_key = import.meta.env.VITE_X_SYSTEM_KEY;
const PRODUCTION_URL = 'https://api.101recycle.greenbidz.com/api/v1/';

// In development (Lovable preview), use Vite proxy to avoid CORS.
// In production, use the real API URL directly.
const isDev = import.meta.env.DEV;
const baseURL = isDev ? '/proxy-api/' : PRODUCTION_URL;

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'x-system-key': system_key,
  },
  withCredentials: !isDev,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  const refresh = localStorage.getItem("refreshToken");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  if (refresh) config.headers["x-refresh-token"] = refresh;
  return config;
});

export default axiosInstance;
