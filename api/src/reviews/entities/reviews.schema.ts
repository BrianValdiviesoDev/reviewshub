import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ReviewEntity, ReviewType } from './reviews.entity';
import { Product } from 'src/products/entities/products.schema';
import { User } from 'src/users/entity/users.schema';
export type ReviewDocument = HydratedDocument<Review>;

@Schema()
export class Review implements ReviewEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  type: ReviewType;

  @Prop({
    type: Types.ObjectId,
    ref: Product.name,
    _id: false,
  })
  product: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    _id: false,
  })
  user?: Types.ObjectId;

  @Prop()
  url?: string;

  @Prop()
  rating?: number;

  @Prop()
  username?: string;

  @Prop()
  userAvatar?: string;

  @Prop()
  reviewDate?: Date;

  @Prop()
  buyDate?: Date;

  @Prop()
  images?: string[];

  @Prop()
  positiveVotes?: number;

  @Prop()
  negativeVotes?: number;

  @Prop({ default: Date.now() })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updatedAt: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
