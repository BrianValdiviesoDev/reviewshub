export enum PromptTypes {
  GENERATE_FACTS = 'GENERATE_FACTS',
  GENERATE_REVIEWS = 'GENERATE_REVIEWS',
  CHECK_MATCHES = 'CHECK_MATCHES',
}

export interface Prompt {
  _id: string;
  name: string;
  prompt: string;
  type: PromptTypes;
}

export interface PostPrompt {
  type: PromptTypes;
  name: string;
  prompt: string;
}
