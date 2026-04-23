import { BaseQueryFn } from '@reduxjs/toolkit/query';
import axios, { AxiosRequestConfig } from 'axios';
import axiosInstance from './axiosInstance';
import { SITE_TYPE } from '@/config/site';

interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: any;
  params?: any;
    headers?: Record<string, string>; 
}




const axiosBaseQuery: BaseQueryFn<AxiosBaseQueryArgs, unknown, unknown> = async ({
  url,
  method = 'GET',
  data,
  params,
  headers
}) => {
  try {
    const result = await axiosInstance({
      url,

      method,
      data,
      params,
      withCredentials: true,
      headers: {
        'x-system-key': import.meta.env.VITE_X_SYSTEM_KEY,
        'x-platform': SITE_TYPE,
        ...headers,
      },
    });

    return { data: result.data };
  } catch (axiosError: any) {
    return {
      error: {
        status: axiosError.response?.status,
        data: axiosError.response?.data || axiosError.message,
      },
    };
  }
};



export default axiosBaseQuery;
