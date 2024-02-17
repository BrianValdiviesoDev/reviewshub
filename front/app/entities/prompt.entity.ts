export enum PromptTypes {
  GENERATE_FACTS = 'GENERATE_FACTS',
  GENERATE_REVIEWS = 'GENERATE_REVIEWS',
  CHECK_MATCHES = 'CHECK_MATCHES',
}

export enum PromptModels {
  GPT_4_0125_PREVIEW = 'gpt-4-0125-preview',
  GPT_4_TURBO_PREVIEW = 'gpt-4-turbo-preview',
  GPT_4_1106_PREVIEW = 'gpt-4-1106-preview',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_3_5_TURBO_1106 = 'gpt-3.5-turbo-1106',
  GPT_3_5_TURBO_0125 = 'gpt-3.5-turbo-0125',
}

export interface Prompt {
  _id: string;
  name: string;
  prompt: string;
  type: PromptTypes;
  model: PromptModels;
  preprompt?: string;
}

export interface PostPrompt {
  type: PromptTypes;
  name: string;
  prompt: string;
  model: PromptModels;
  preprompt?: string;
}
