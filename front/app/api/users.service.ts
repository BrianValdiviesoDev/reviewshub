import axios from './axiosConfig';
import { User } from '../entities/user.entity';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getUser = async (id: string): Promise<User> => {
  const response = await axios.get(`${API_URL}/users/${id}`);
  return response.data;
};
