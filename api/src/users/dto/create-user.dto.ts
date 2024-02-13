import { Allow, IsNotEmpty } from 'class-validator';
import { UserRole } from '../entity/users.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: Object.values(UserRole) })
  @IsNotEmpty()
  rol: UserRole;

  @ApiProperty()
  @Allow()
  company?: string;
}
