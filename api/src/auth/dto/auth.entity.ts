import { UserResponseDto } from 'src/users/dto/user-response.dto';

export interface AuthResponse {
  token: string;
  user: UserResponseDto;
}
