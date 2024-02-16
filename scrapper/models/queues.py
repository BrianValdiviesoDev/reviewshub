from enum import Enum

from pydantic import BaseModel

class EventTypes(Enum):
    new_request = 'new_request',
    start_scrappers = 'start_scrappers',
    stop_scrappers = 'stop_scrappers',
    generate_product_facts = 'generate_product_facts',
    product_facts_generated = 'product_facts_generated',
    generate_reviews = 'generate_reviews',
    new_reviews_generated = 'new_reviews_generated',
    new_product = 'new_product',
    new_match = 'new_match',
    check_match = 'check_match',
    request_updated = 'request_updated',
    new_reviews_scrapped = 'new_reviews_scrapped',

class QueueEvent(BaseModel):
    event: EventTypes
    data: dict