
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    maxLength: 50,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    maxLength: 100,
  })
  email: string;

  @Prop({
    maxLength: 100,
    required: true,
  })
  password: string;

  @Prop({required: true, ref: 'Account', type: SchemaTypes.ObjectId})
  account: string;

  @Prop({required: true, enum: ['admin', 'user'], default: 'user'})
  role: string;

  createdAt: Date;

  updatedAt: Date;
}



export const UserSchema = SchemaFactory.createForClass(User);
