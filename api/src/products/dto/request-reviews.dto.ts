import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsNotEmpty } from 'class-validator';
import { CreateProductDto } from './create-product.dto';

export class RequestNewsReviewsDto {
  @ApiProperty()
  @IsNotEmpty()
  product: CreateProductDto;

  @ApiProperty()
  @IsNotEmpty()
  numberOfReviews: number;

  @ApiProperty()
  @Allow()
  webhookUrl: string;

  @ApiProperty()
  @Allow()
  factsPrompt?: string;

  @ApiProperty()
  @Allow()
  reviewsPrompt?: string;
}
