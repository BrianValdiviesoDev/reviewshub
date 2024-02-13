import { Types } from 'mongoose';

export enum ReviewType {
  MANUAL = 'MANUAL',
  SCRAPPED = 'SCRAPPED',
  GENERATED = 'GENERATED',
}

export class ReviewEntity {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  type: ReviewType;
  url?: string;
  title: string;
  description: string;
  rating?: number;
  user?: Types.ObjectId;
  username?: string;
  userAvatar?: string;
  reviewDate?: Date;
  buyDate?: Date;
  images?: string[];
  positiveVotes?: number;
  negativeVotes?: number;
}
