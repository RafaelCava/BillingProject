import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;

@Schema({ timestamps: true })
export class Account {
  @Prop({
    required: true,
    maxLength: 100,
  })
  name!: string;

  @Prop({
    required: true,
    unique: true,
    maxLength: 100,
  })
  email!: string;

  @Prop({
    required: true,
    unique: true,
    maxLength: 18,
  })
  cnpj!: string;

  @Prop({
    required: true,
    maxLength: 50,
  })
  plan!: string;

  createdAt!: Date;

  updatedAt!: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);