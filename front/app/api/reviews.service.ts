import axios from './axiosConfig';
import { Review } from '../entities/review.entity';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const findAllReviews = async (): Promise<Review[]> => {
  const response = await axios.get(`${API_URL}/reviews`);
  return response.data;
};

export const findReviewsByProduct = async (
  productId: string,
): Promise<Review[]> => {
  const response = await axios.get(`${API_URL}/reviews/product/${productId}`);
  return response.data;
};
