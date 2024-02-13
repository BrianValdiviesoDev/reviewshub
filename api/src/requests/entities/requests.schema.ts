import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { RequestEntity, RequestStatus, RequestType } from './request.entity';
import { Product } from 'src/products/entities/products.schema';
export type RequestDocument = HydratedDocument<Request>;

@Schema()
export class Request implements RequestEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  type: RequestType;

  @Prop({ required: true })
  status: RequestStatus;

  @Prop({
    type: Types.ObjectId,
    ref: Product.name,
    _id: false,
  })
  productId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Company',
    _id: false,
  })
  company?: Types.ObjectId;

  @Prop()
  executionDate: Date;

  @Prop({ default: Date.now() })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updatedAt: Date;
}

export const RequestSchema = SchemaFactory.createForClass(Request);
