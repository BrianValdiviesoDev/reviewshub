import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsNotEmpty } from 'class-validator';
import { MarketPlaces, Matches } from '../entities/products.entity';

export class UpdateProductDto {
  @ApiProperty()
  @Allow()
  name?: string;

  @ApiProperty()
  @Allow()
  marketplace?: MarketPlaces;

  @ApiProperty()
  @Allow()
  image?: string;

  @ApiProperty()
  @Allow()
  originUrl?: string;

  @ApiProperty()
  @Allow()
  matches?: Matches[];

  @ApiProperty()
  @Allow()
  properties?: string;

  @ApiProperty()
  @Allow()
  metadata?: any;

  @ApiProperty()
  @Allow()
  price?: number;

  @ApiProperty()
  @Allow()
  rating?: number;

  @ApiProperty()
  @Allow()
  reviews?: number;

  @ApiProperty()
  @Allow()
  checkMatchesPrompt?: string;

  @ApiProperty()
  @Allow()
  factsPrompt?: string;

  @ApiProperty()
  @Allow()
  reviewsPrompt?: string;
}

export class verifyProductDto {
  @ApiProperty()
  @IsNotEmpty()
  matchId: string;
}
