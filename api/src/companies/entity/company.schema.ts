import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CompanyEntity } from './company.entity';
export type CompanyDocument = HydratedDocument<Company>;

@Schema()
export class Company implements CompanyEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: Date.now() })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updatedAt: Date;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
