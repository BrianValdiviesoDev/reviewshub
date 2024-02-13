import uuid
from pydantic import BaseModel, Field


class MarketPlaces:
    AMAZON = 'AMAZON'
    PCCOMPONENTES = 'PCCOMPONENTES'
    MEDIAMARKT = 'MEDIAMARKT'
    ELCORTEINGLES = 'ELCORTEINGLES'
    ALIEXPRESS = 'ALIEXPRESS'
    MANOMANO = 'MANOMANO'
    EBAY = 'EBAY'
    FNAC = 'FNAC'


class ProductType:
    MANUAL = 'MANUAL'
    SCRAPPED = 'SCRAPPED'


class Product(BaseModel):
    id: str = Field(default_factory=uuid.uuid4, alias="_id")
    type: str = Field(default=ProductType.SCRAPPED)
    marketplace: str = Field(default=None)
    name: str = Field(default=None)
    image: str = Field(default=None)
    originUrl: str = Field(default=None)
    properties: str = Field(default=None)
    metadata: object = Field(default=None)
    rating: float = Field(default=None)
    reviews: int = Field(default=None)
