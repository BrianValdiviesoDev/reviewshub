import axios from './axiosConfig';
import {
  NewProductWithReviews,
  PostProduct,
  Product,
} from '../entities/product.entity';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getAllProducts = async (): Promise<Product[]> => {
  const response = await axios.get(`${API_URL}/products`);
  return response.data;
};

export const getProduct = async (id: string): Promise<Product> => {
  const response = await axios.get(`${API_URL}/products/${id}`);
  return response.data;
};

export const createProduct = async (product: PostProduct): Promise<Product> => {
  const response = await axios.post(`${API_URL}/products`, product);
  return response.data;
};

export const createProductAndGenerateReviews = async (
  data: NewProductWithReviews,
): Promise<Product> => {
  const response = await axios.post(`${API_URL}/products/generate`, data);
  return response.data;
};

export const updateProduct = async (
  id: string,
  product: PostProduct,
): Promise<Product> => {
  const response = await axios.put(`${API_URL}/products/${id}`, product);
  return response.data;
};

export const verifyProduct = async (
  id: string,
  matchId: string,
): Promise<Product> => {
  const response = await axios.patch(`${API_URL}/products/${id}/verify`, {
    matchId,
  });
  return response.data;
};

export const checkProductMatches = async (
  id: string,
  matchesIds: string[],
): Promise<void> => {
  const response = await axios.post(`${API_URL}/products/${id}/checkMatches`, {
    matches: matchesIds,
  });
  return response.data;
};

export const findProductInMarketplaces = async (id: string): Promise<void> => {
  const response = await axios.patch(
    `${API_URL}/products/${id}/findinmarketplaces`,
  );
  return response.data;
};

export const getProductFacts = async (id: string): Promise<void> => {
  const response = await axios.patch(`${API_URL}/products/${id}/buildFacts`);
  return response.data;
};

export const generateReviews = async (
  id: string,
  number: number,
): Promise<void> => {
  const response = await axios.post(
    `${API_URL}/products/${id}/generateReviews`,
    {
      numberOfReviews: number,
    },
  );
  return response.data;
};
