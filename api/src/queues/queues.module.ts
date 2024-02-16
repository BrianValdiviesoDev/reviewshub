import { Module } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { LogsService } from 'src/logs/logs.service';
import { HttpModule } from '@nestjs/axios';
import { ConsumerService } from './consumer.service';
import { OpenaiService } from 'src/openai/openai.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'src/products/entities/products.schema';
import { Request, RequestSchema } from 'src/requests/entities/requests.schema';
import { RequestsService } from 'src/requests/requests.service';
import { ReviewsService } from 'src/reviews/reviews.service';
import { Review, ReviewSchema } from 'src/reviews/entities/reviews.schema';
import { ProductsService } from 'src/products/products.service';
import { Prompt, PromptSchema } from 'src/prompts/entities/prompt.schema';
import { SocketGateway } from 'src/socket/socket.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: Request.name, schema: RequestSchema }]),
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    MongooseModule.forFeature([{ name: Prompt.name, schema: PromptSchema }]),
    HttpModule,
  ],
  providers: [
    ProducerService,
    ConsumerService,
    LogsService,
    RequestsService,
    ReviewsService,
    OpenaiService,
    SocketGateway,
    ProductsService,
  ],
  exports: [ProducerService],
})
export class QueuesModule {}
