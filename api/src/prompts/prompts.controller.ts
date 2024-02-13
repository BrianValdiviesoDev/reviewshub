import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/entity/users.entity';

@ApiBearerAuth()
@ApiTags('products')
@Controller('prompts')
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @Post()
  create(@Body() createPromptDto: CreatePromptDto, @Req() req: any) {
    return this.promptsService.create(createPromptDto, req.user);
  }

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @Get()
  findAll(@Req() req: any) {
    return this.promptsService.findAll(req.user);
  }

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.promptsService.findOne(id, req.user);
  }

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updatePromptDto: UpdatePromptDto,
    @Req() req: any,
  ) {
    return this.promptsService.update(id, updatePromptDto, req.user);
  }

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.promptsService.remove(id, req.user);
  }
}
