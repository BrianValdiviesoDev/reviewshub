import { Module } from '@nestjs/common';
import { OpenAiQueueService } from './queues.openai.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'src/products/entities/products.schema';
import { BullModule } from '@nestjs/bull';
import { QueuesController } from './queues.controller';
import { QueuesService } from './queues.service';
import { RequestsModule } from 'src/requests/requests.module';
import { Review, ReviewSchema } from 'src/reviews/entities/reviews.schema';
import { LogsModule } from 'src/logs/logs.module';
import { LogsService } from 'src/logs/logs.service';
import { Request, RequestSchema } from 'src/requests/entities/requests.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    MongooseModule.forFeature([{ name: Request.name, schema: RequestSchema }]),
    BullModule.registerQueue({
      name: 'openai',
    }),
    RequestsModule,
    HttpModule,
    LogsModule,
  ],
  controllers: [QueuesController],
  providers: [OpenAiQueueService, QueuesService, LogsService],
  exports: [QueuesService],
})
export class QueuesModule {}
