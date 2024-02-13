import { PostPrompt, Prompt } from '../entities/prompt.entity';
import axios from './axiosConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getAllPrompts = async (): Promise<Prompt[]> => {
  const response = await axios.get(`${API_URL}/prompts`);
  return response.data;
};

export const getPrompt = async (id: string): Promise<Prompt> => {
  const response = await axios.get(`${API_URL}/prompts/${id}`);
  return response.data;
};

export const createPrompt = async (prompt: PostPrompt): Promise<Prompt> => {
  const response = await axios.post(`${API_URL}/prompts`, prompt);
  return response.data;
};

export const updatePrompt = async (
  id: string,
  prompt: PostPrompt,
): Promise<Prompt> => {
  const response = await axios.put(`${API_URL}/prompts/${id}`, prompt);
  return response.data;
};

export const deletePrompt = async (id: string): Promise<Prompt> => {
  const response = await axios.delete(`${API_URL}/prompts/${id}`);
  return response.data;
};
