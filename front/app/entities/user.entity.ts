export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  MANAGER = 'MANAGER',
  REVIEWER = 'REVIEWER',
}

export interface User {
  _id: string;
  email: string;
  name: string;
  rol: UserRole;
  company?: string;
}
