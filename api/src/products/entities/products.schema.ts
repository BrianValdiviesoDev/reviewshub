import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  MarketPlaces,
  Matches,
  Pipeline,
  ProductEntity,
  ProductType,
} from './products.entity';
import { Company } from 'src/companies/entity/company.schema';
import { Prompt } from 'src/prompts/entities/prompt.schema';
export type ProductDocument = HydratedDocument<Product>;

@Schema()
export class Product implements ProductEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  type: ProductType;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: Types.ObjectId,
    ref: Company.name,
    _id: false,
  })
  company?: Types.ObjectId;

  @Prop()
  marketplace?: MarketPlaces;

  @Prop()
  image?: string;

  @Prop()
  originUrl: string;

  @Prop()
  matches?: Matches[];

  @Prop()
  properties?: string;

  @Prop({ type: Object })
  metadata?: any;

  @Prop()
  price?: string;

  @Prop()
  rating?: string;

  @Prop()
  reviews?: string;

  @Prop()
  facts?: string[];

  @Prop({ default: 0 })
  pendingReviews: number;

  @Prop()
  webhookUrl?: string;

  @Prop({
    type: Types.ObjectId,
    ref: Prompt.name,
    _id: false,
  })
  checkMatchesPrompt: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Prompt.name,
    _id: false,
  })
  factsPrompt: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Prompt.name,
    _id: false,
  })
  reviewsPrompt: Types.ObjectId;

  @Prop({ type: Object })
  pipeline?: Pipeline;

  @Prop({ default: Date.now() })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
