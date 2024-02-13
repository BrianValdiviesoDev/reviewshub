import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { PromptTypes } from '../entities/prompt.entity';

export class UpdatePromptDto {
  @ApiProperty()
  @Allow()
  name?: string;

  @ApiProperty()
  @Allow()
  type?: PromptTypes;

  @ApiProperty()
  @Allow()
  prompt?: string;
}
