import { LogResponseDto } from '../entities/log.entity';
import axios from './axiosConfig';

const SCRAPPER_URL = process.env.NEXT_PUBLIC_SCRAPPER_URL;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const stopScrapper = async (): Promise<void> => {
  const response = await axios.post(`${SCRAPPER_URL}/controls/stop`, {});
  return response.data;
};

export const startScrapper = async (): Promise<void> => {
  const response = await axios.post(`${SCRAPPER_URL}/controls/start`, {});
  return response.data;
};

export const getLogByDate = async (
  fromDate: string,
  toDate: string,
): Promise<LogResponseDto[]> => {
  const response = await axios.post(`${API_URL}/logs`, { fromDate, toDate });
  return response.data;
};

export const checkHealth = async (): Promise<string> => {
  const response = await axios.get(`${SCRAPPER_URL}/controls/health`);
  return response.data;
};
