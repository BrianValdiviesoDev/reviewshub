import axios from 'axios';
import { Login, LoginResponse } from '../entities/auth.entity';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const login = async (user: Login): Promise<LoginResponse> => {
  const response = await axios.post(`${API_URL}/auth/login`, user);
  return response.data;
};
