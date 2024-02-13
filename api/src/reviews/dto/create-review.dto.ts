import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  product: string;

  @ApiProperty()
  @IsNotEmpty()
  url: string;

  @ApiProperty()
  @Allow()
  rating: string;

  @ApiProperty()
  @Allow()
  username: string;

  @ApiProperty()
  @Allow()
  userAvatar: string;

  @ApiProperty()
  @Allow()
  reviewDate: Date;

  @ApiProperty()
  @Allow()
  buyDate: Date;

  @ApiProperty()
  @Allow()
  images: string[];

  @ApiProperty()
  @Allow()
  positiveVotes: number;

  @ApiProperty()
  @Allow()
  negativeVotes: number;
}
