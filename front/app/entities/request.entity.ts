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
export interface Request {
  _id: string;
  url: string;
  type: RequestType;
  status: RequestStatus;
  productId: string;
  executionDate: Date;
}

export interface PutRequest {
  url?: string;
  type?: RequestType;
  status?: RequestStatus;
  productId?: string;
}
