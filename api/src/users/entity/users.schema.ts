import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserEntity, UserRole } from './users.entity';
import { Company } from 'src/companies/entity/company.schema';
export type UserDocument = HydratedDocument<User>;

@Schema()
export class User implements UserEntity {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  rol: UserRole;

  @Prop({ default: Date.now() })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updatedAt: Date;

  @Prop({
    type: Types.ObjectId,
    ref: Company.name,
    _id: false,
  })
  company?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
