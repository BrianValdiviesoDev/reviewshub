import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiController } from './openai.controller';
import { Product, ProductSchema } from 'src/products/entities/products.schema';
import { Request, RequestSchema } from 'src/requests/entities/requests.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { LogsService } from 'src/logs/logs.service';
import { ProducerService } from 'src/queues/producer.service';
import { HttpModule } from '@nestjs/axios';
import { ReviewsModule } from 'src/reviews/reviews.module';
import { RequestsModule } from 'src/requests/requests.module';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: Request.name, schema: RequestSchema }]),
    HttpModule,
    ProductsModule,
    ReviewsModule,
    RequestsModule,
  ],
  controllers: [OpenaiController],
  providers: [ProducerService, OpenaiService, LogsService],
})
export class OpenaiModule {}
