import { Types } from 'mongoose';
import { Review } from 'src/reviews/entities/reviews.schema';

export enum MarketPlaces {
  AMAZON = 'AMAZON',
  PCCOMPONENTES = 'PCCOMPONENTES',
  MEDIAMARKT = 'MEDIAMARKT',
  ELCORTEINGLES = 'ELCORTEINGLES',
  ALIEXPRESS = 'ALIEXPRESS',
  MANOMANO = 'MANOMANO',
  EBAY = 'EBAY',
  FNAC = 'FNAC',
}

export interface Matches {
  product: Types.ObjectId;
  percentage: any[];
}

export enum ProductType {
  MANUAL = 'MANUAL',
  SCRAPPED = 'SCRAPPED',
}

export enum ProductStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  ERROR = 'ERROR',
}

export interface Pipeline {
  findInMarketplaces: boolean;
  readProducts: boolean;
  matching: boolean;
  readReviews: boolean;
  buildFacts: boolean;
  done: boolean;
}

export class ProductEntity {
  _id: Types.ObjectId;
  type: ProductType;
  name: string;
  company?: Types.ObjectId;
  marketplace?: MarketPlaces;
  image?: string;
  originUrl: string;
  matches?: Matches[];
  properties?: string;
  metadata?: object;
  price?: string;
  rating?: string;
  reviews?: string;
  facts?: string[];
  pendingReviews: number;
  webhookUrl?: string;
  checkMatchesPrompt: Types.ObjectId;
  factsPrompt: Types.ObjectId;
  reviewsPrompt: Types.ObjectId;
  pipeline: Pipeline;
}

export class ProductResponse extends ProductEntity {
  status: ProductStatus;
  scrappedReviews?: Review[];
}
