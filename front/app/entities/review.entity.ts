export enum ReviewType {
  MANUAL = 'MANUAL',
  SCRAPPED = 'SCRAPPED',
  GENERATED = 'GENERATED',
}

export interface Review {
  _id: string;
  product: string;
  type: ReviewType;
  title: string;
  url?: string;
  description: string;
  rating?: number;
  user?: string;
  username?: string;
  userAvatar?: string;
  reviewDate?: Date;
  buyDate?: Date;
  images?: string[];
  positiveVotes?: number;
  negativeVotes?: number;
}
