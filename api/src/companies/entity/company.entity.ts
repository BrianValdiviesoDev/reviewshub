import { Types } from 'mongoose';

export interface CompanyEntity {
  _id: Types.ObjectId;
  name: string;
}
