import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtDto } from './dto/jwt.dto';
import { AuthResponse } from './dto/auth.entity';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.findOneToLogin(email);
    if (!user) {
      throw new UnauthorizedException('User or password invalid');
    }
    const correctPassword = await bcrypt.compare(password, user.password);
    if (!correctPassword) {
      throw new UnauthorizedException('User or password invalid');
    }

    const payload: JwtDto = {
      sub: user._id.toString(),
      username: user.name,
      rol: user.rol,
      email: user.email,
      company: user.company?._id.toString(),
    };
    const token = await this.jwtService.signAsync(payload);
    const userResponse: UserResponseDto = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      rol: user.rol,
    };

    const response: AuthResponse = {
      token,
      user: userResponse,
    };
    return response;
  }
}
