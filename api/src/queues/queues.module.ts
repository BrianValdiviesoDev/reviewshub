import { Module } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { LogsService } from 'src/logs/logs.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [ProducerService, LogsService],
  exports: [ProducerService],
})
export class QueuesModule {}
