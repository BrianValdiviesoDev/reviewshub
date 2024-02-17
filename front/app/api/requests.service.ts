import axios from './axiosConfig';
import {
  PutRequest,
  Request,
  RequestStatus,
  RequestType,
} from '../entities/request.entity';
import { Product } from '../entities/product.entity';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const findAllRequests = async (): Promise<Request[]> => {
  const response = await axios.get(`${API_URL}/requests`);
  return response.data;
};

export const findRequestsByProduct = async (id: string): Promise<Request[]> => {
  const response = await axios.get(`${API_URL}/requests/product/${id}`);
  return response.data;
};

export const removeRequest = async (id: string): Promise<void> => {
  const response = await axios.delete(`${API_URL}/requests/${id}`);
  return response.data;
};

export const cancelRequest = async (id: string): Promise<Request> => {
  const response = await axios.patch(`${API_URL}/requests/${id}/cancel`);
  return response.data;
};

export const duplicateRequest = async (request: Request): Promise<Request> => {
  const post = {
    url: request.url,
    productId: request.productId,
    type: request.type,
    status: RequestStatus.PENDING,
  };
  const response = await axios.post(`${API_URL}/requests`, post);
  return response.data;
};

export const stopScrapper = async (): Promise<void> => {
  //TODO send a message to the queue to stop the scrappers
  return;
};

export const startScrapper = async (): Promise<void> => {
  //TODO send a message to the queue to start the scrappers
  return;
};

export const scrapeProductInfo = async (product: Product): Promise<Request> => {
  const request: PutRequest = {
    url: product.originUrl,
    type: RequestType.GET_PRODUCT_INFO,
    status: RequestStatus.PENDING,
    productId: product._id,
  };
  const response = await axios.post(`${API_URL}/requests`, request);
  return response.data;
};

export const scrapeReviews = async (product: Product): Promise<Request> => {
  const request: PutRequest = {
    url: product.originUrl,
    type: RequestType.GET_REVIEWS,
    status: RequestStatus.PENDING,
    productId: product._id,
  };
  const response = await axios.post(`${API_URL}/requests`, request);
  return response.data;
};
