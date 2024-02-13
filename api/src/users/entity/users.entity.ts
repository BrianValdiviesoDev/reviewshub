import { Types } from 'mongoose';

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  MANAGER = 'MANAGER',
  REVIEWER = 'REVIEWER',
}
export interface UserEntity {
  _id: Types.ObjectId;
  name: string;
  company?: Types.ObjectId;
  email: string;
  password: string;
  rol: UserRole;
}
