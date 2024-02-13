import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @Allow()
  sku?: string;

  @ApiProperty()
  @Allow()
  properties: string;

  @ApiProperty()
  @Allow()
  originUrl?: string;

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
