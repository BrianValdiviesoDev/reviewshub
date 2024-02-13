import { Body, Controller, Get, Post } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogFilterDto } from './dto/log-filter.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('logs')
@ApiBearerAuth()
@ApiTags('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Post()
  find(@Body() filter: LogFilterDto) {
    return this.logsService.find(
      filter.fromDate,
      filter.toDate,
      filter.type,
      filter.requestId,
      filter.productId,
    );
  }
}
