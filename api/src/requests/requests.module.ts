import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Request, RequestSchema } from './entities/requests.schema';
import { Product, ProductSchema } from 'src/products/entities/products.schema';
import { ProducerService } from 'src/queues/producer.service';
import { QueuesModule } from 'src/queues/queues.module';
import { HttpModule } from '@nestjs/axios';
import { LogsService } from 'src/logs/logs.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Request.name, schema: RequestSchema }]),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    HttpModule,
    QueuesModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService, LogsService, ProducerService],
  exports: [RequestsService, ProducerService],
})
export class RequestsModule {}
