import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type BillDocument = HydratedDocument<Bill>;

@Schema({ timestamps: true })
export class Bill {
  @Prop({ required: true, ref: 'Account', type: SchemaTypes.ObjectId })
  account!: string;

  @Prop({ required: true, ref: 'Purchase', type: SchemaTypes.ObjectId })
  purchase!: string;

  @Prop({ required: true })
  installmentDate!: Date;

  @Prop({ required: true, minLength: 1, maxLength: 50 })
  name!: string;

  @Prop({ required: true, min: 1 })
  value!: number;

  @Prop({ required: true, default: false })
  isPaid!: boolean;

  @Prop({ required: false, type: Date })
  payedAt?: Date;

  @Prop({ required: true, default: false })
  isExpired!: boolean;

  createdAt!: Date;                                                                                                                                                                                                                                                                                                                                                      

  updatedAt!: Date;
}

export const BillSchema = SchemaFactory.createForClass(Bill);