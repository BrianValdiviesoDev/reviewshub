import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty()
  @Allow()
  name?: string;
}
