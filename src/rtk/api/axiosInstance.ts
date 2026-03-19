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
  withCredentials: !isDev, // credentials not needed through proxy
});

export default axiosInstance;
