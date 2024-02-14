export enum EventTypes {
  NEW_REQUEST = 'new_request',
  START_SCRAPPERS = 'start_scrappers',
  STOP_SCRAPPERS = 'stop_scrappers',
  GENERATE_PRODUCT_FACTS = 'generate_product_facts',
  GENERATE_REVIEWS = 'generate_reviews',
}

export interface QueueMessage {
  event: EventTypes;
  data?: any;
}
