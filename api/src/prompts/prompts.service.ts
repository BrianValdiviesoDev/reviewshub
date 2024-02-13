import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Prompt, PromptDocument } from './entities/prompt.schema';
import { Model } from 'mongoose';
import { JwtDto } from 'src/auth/dto/jwt.dto';
import { UserRole } from 'src/users/entity/users.entity';

@Injectable()
export class PromptsService {
  constructor(@InjectModel(Prompt.name) private promptModel: Model<Prompt>) {}

  async create(
    createPromptDto: CreatePromptDto,
    user: JwtDto,
  ): Promise<PromptDocument> {
    if (user.rol !== UserRole.SUPERADMIN) {
      throw new ForbiddenException(
        'You are not allowed to access this resource',
      );
    }
    return await this.promptModel.create(createPromptDto);
  }

  async findAll(user: JwtDto): Promise<PromptDocument[]> {
    if (user.rol !== UserRole.SUPERADMIN) {
      throw new ForbiddenException(
        'You are not allowed to access this resource',
      );
    }
    return await this.promptModel.find();
  }

  async findOne(id: string, user: JwtDto): Promise<PromptDocument> {
    if (user.rol !== UserRole.SUPERADMIN) {
      throw new ForbiddenException(
        'You are not allowed to access this resource',
      );
    }
    const prompt = await this.promptModel.findById(id);

    if (!prompt) {
      throw new ForbiddenException('Prompt not found');
    }

    return prompt;
  }

  async update(id: string, updatePromptDto: UpdatePromptDto, user: JwtDto) {
    if (user.rol !== UserRole.SUPERADMIN) {
      throw new ForbiddenException(
        'You are not allowed to access this resource',
      );
    }
    const update = await this.promptModel.findByIdAndUpdate(
      id,
      updatePromptDto,
    );

    if (!update) {
      throw new ForbiddenException('Prompt not found');
    }

    return update;
  }

  async remove(id: string, user: JwtDto) {
    if (user.rol !== UserRole.SUPERADMIN) {
      throw new ForbiddenException(
        'You are not allowed to access this resource',
      );
    }
    return await this.promptModel.findByIdAndDelete(id);
  }
}
