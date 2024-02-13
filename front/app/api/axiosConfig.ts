import axios, { InternalAxiosRequestConfig } from 'axios';

const instance = axios.create({});

// Añadir un interceptor para todas las peticiones
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default instance;
