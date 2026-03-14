import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type TagDocument = HydratedDocument<Tag>;

@Schema({ timestamps: true })
export class Tag {
  @Prop({ required: true, ref: 'Account', type: SchemaTypes.ObjectId })
  account!: string;

  @Prop({ required: true, maxLength: 40 })
  color!: string;

  @Prop({ required: true, maxLength: 80 })
  name!: string;

  createdAt!: Date;

  updatedAt!: Date;
}

export const TagSchema = SchemaFactory.createForClass(Tag);