import { Types } from 'mongoose';

export enum RequestStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  ERROR = 'ERROR',
  IN_PROGRESS = 'IN_PROGRESS',
}

export enum RequestType {
  FIND_PRODUCT = 'FIND_PRODUCT',
  GET_REVIEWS = 'GET_REVIEWS',
  GET_PRODUCT_INFO = 'GET_PRODUCT_INFO',
}
export class RequestEntity {
  _id: Types.ObjectId;
  url: string;
  type: RequestType;
  status: RequestStatus;
  productId: Types.ObjectId;
  company?: Types.ObjectId;
  executionDate: Date;
}
