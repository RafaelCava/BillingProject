import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type PurchaseDocument = HydratedDocument<Purchase>;

@Schema({ timestamps: true })
export class Purchase {
  @Prop({ required: true, ref: 'Account', type: SchemaTypes.ObjectId })
  account!: string;

  @Prop({ required: true, ref: 'User', type: SchemaTypes.ObjectId })
  user!: string;

  @Prop({ required: true })
  purchaseDate!: Date;

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop({ required: true, min: 1, default: 1 })
  installmentsCount!: number;

  @Prop({ required: true })
  installmentsEndDate!: Date;

  @Prop({ required: true })
  dueDate!: Date;

  @Prop({ required: false, type: [SchemaTypes.ObjectId], default: [] })
  tagIds!: string[];

  createdAt!: Date;

  updatedAt!: Date;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);