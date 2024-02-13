import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './entities/products.schema';
import { RequestsModule } from 'src/requests/requests.module';
import { Request, RequestSchema } from 'src/requests/entities/requests.schema';
import { QueuesModule } from 'src/queues/queues.module';
import { Prompt, PromptSchema } from 'src/prompts/entities/prompt.schema';

@Module({
  imports: [
    RequestsModule,
    QueuesModule,
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: Request.name, schema: RequestSchema }]),
    MongooseModule.forFeature([{ name: Prompt.name, schema: PromptSchema }]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
