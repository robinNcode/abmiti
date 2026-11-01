import mongoose, { Schema, Document } from 'mongoose';
import { PayableKind, PayableStatus } from '../../shared/types';

export interface IPayableDoc extends Document {
  user: mongoose.Types.ObjectId;
  counterparty: string;
  principal: number;
  paidAmount: number;
  kind: PayableKind;
  categoryId?: mongoose.Types.ObjectId | null;
  accountId?: mongoose.Types.ObjectId | null;
  dueDate?: Date | null;
  note?: string;
  status: PayableStatus;
  createdAt: Date;
  updatedAt: Date;
}

const payableSchema = new Schema<IPayableDoc>(
  {
    user:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    counterparty: { type: String, required: true, trim: true, maxlength: 100 },
    principal:    { type: Number, required: true, min: 0.01 },
    paidAmount:   { type: Number, required: true, default: 0, min: 0 },
    kind:         { type: String, enum: ['borrowed_cash', 'unpaid_expense'], required: true },
    categoryId:   { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    accountId:    { type: Schema.Types.ObjectId, ref: 'Account', default: null },
    dueDate:      { type: Date, default: null },
    note:         { type: String, trim: true, maxlength: 300 },
    status:       { type: String, enum: ['open', 'settled', 'cancelled'], required: true, default: 'open' },
  },
  { timestamps: true },
);

payableSchema.index({ user: 1, status: 1, dueDate: 1 });

export const Payable = mongoose.model<IPayableDoc>('Payable', payableSchema);
