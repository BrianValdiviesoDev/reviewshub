import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PromptEntity, PromptTypes } from './prompt.entity';
export type PromptDocument = HydratedDocument<Prompt>;

@Schema()
export class Prompt implements PromptEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  type: PromptTypes;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  prompt: string;

  @Prop({ default: Date.now() })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updatedAt: Date;
}

export const PromptSchema = SchemaFactory.createForClass(Prompt);
