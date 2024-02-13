import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entity/users.schema';
import { Model, Types } from 'mongoose';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { JwtDto } from 'src/auth/dto/jwt.dto';
import { UserRole } from './entity/users.entity';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  private saltOrRounds = 10;

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const emailExists = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (emailExists) {
      throw new BadRequestException('This email already exists');
    }
    const hash = await bcrypt.hash(createUserDto.password, this.saltOrRounds);
    const newUser = await this.userModel.create({
      ...createUserDto,
      password: hash,
    });

    const response: UserResponseDto = {
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      rol: newUser.rol,
    };
    return response;
  }

  async setCompany(
    id: string,
    companyId: string,
    token: JwtDto,
  ): Promise<UserResponseDto> {
    if (token.rol !== UserRole.SUPERADMIN && token.sub !== id) {
      throw new ForbiddenException(
        "You don't have permission to read this user",
      );
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.company && token.rol !== UserRole.SUPERADMIN) {
      throw new BadRequestException('This user has a company');
    }

    const updated = await this.userModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), rol: UserRole.MANAGER },
      { company: companyId },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    const response: UserResponseDto = {
      _id: updated._id.toString(),
      name: updated.name,
      email: updated.email,
      rol: updated.rol,
    };

    return response;
  }

  async findAll(): Promise<UserResponseDto[]> {
    const list = await this.userModel.find().populate('company');

    const response: UserResponseDto[] = list.map((user) => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      rol: user.rol,
      company: user.company,
    }));

    return response;
  }

  async findOne(id: string, token: JwtDto): Promise<UserResponseDto> {
    if (token.rol !== UserRole.SUPERADMIN && token.sub !== id) {
      throw new ForbiddenException(
        "You don't have permission to read this user",
      );
    }

    const user = await this.userModel.findById(id).populate('company');

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const response: UserResponseDto = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      rol: user.rol,
    };

    return response;
  }

  async findOneToLogin(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    token: JwtDto,
  ): Promise<UserResponseDto> {
    if (token.rol !== UserRole.SUPERADMIN && token.sub !== id) {
      throw new ForbiddenException(
        "You don't have permission to update this user",
      );
    }

    const update: UpdateUserDto = { name: updateUserDto?.name };
    const updated = await this.userModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
      },
      {
        $set: update,
      },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    const user: UserResponseDto = {
      name: updated.name,
      _id: updated._id.toString(),
      email: updated.email,
      rol: updated.rol,
    };

    return user;
  }

  async remove(id: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userModel.deleteOne({ _id: new Types.ObjectId(id) });
  }
}
