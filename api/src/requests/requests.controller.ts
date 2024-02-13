import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  Post,
  Body,
  Req,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserRole } from 'src/users/entity/users.entity';
import { Roles } from 'src/auth/roles.decorator';
import { RequestStatus } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';

@ApiBearerAuth()
@ApiTags('requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() createRequestDto: CreateRequestDto, @Req() req: any) {
    return this.requestsService.create(createRequestDto, req.user);
  }

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @Get()
  findAll(@Req() req: any) {
    return this.requestsService.findAll(req.user);
  }

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.MANAGER)
  @Get('/product/:id')
  findByProduct(@Param('id') id: string, @Req() req: any) {
    return this.requestsService.findByProduct(id, req.user);
  }

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.requestsService.findOne(id, req.user);
  }

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.requestsService.updateStatus(
      id,
      RequestStatus.CANCELED,
      req.user,
    );
  }

  @UseGuards(AuthGuard)
  @Roles(UserRole.SUPERADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.requestsService.remove(id, req.user);
  }
}
