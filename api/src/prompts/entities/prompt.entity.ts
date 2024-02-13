import { Types } from 'mongoose';

export enum PromptTypes {
  GENERATE_FACTS = 'GENERATE_FACTS',
  GENERATE_REVIEWS = 'GENERATE_REVIEWS',
  CHECK_MATCHES = 'CHECK_MATCHES',
}

export class PromptEntity {
  _id: Types.ObjectId;
  name: string;
  prompt: string;
  type: PromptTypes;
}
