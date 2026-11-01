import mongoose, { Schema, Document } from 'mongoose';
import { ReceivableKind, ReceivableStatus } from '../../shared/types';

export interface IReceivableDoc extends Document {
  user: mongoose.Types.ObjectId;
  counterparty: string;
  principal: number;
  receivedAmount: number;
  kind: ReceivableKind;
  categoryId?: mongoose.Types.ObjectId | null;
  accountId?: mongoose.Types.ObjectId | null;
  dueDate?: Date | null;
  note?: string;
  status: ReceivableStatus;
  createdAt: Date;
  updatedAt: Date;
}

const receivableSchema = new Schema<IReceivableDoc>(
  {
    user:           { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    counterparty:   { type: String, required: true, trim: true, maxlength: 100 },
    principal:      { type: Number, required: true, min: 0.01 },
    receivedAmount: { type: Number, required: true, default: 0, min: 0 },
    kind:           { type: String, enum: ['lent_cash', 'unpaid_income'], required: true },
    categoryId:     { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    accountId:      { type: Schema.Types.ObjectId, ref: 'Account', default: null },
    dueDate:        { type: Date, default: null },
    note:           { type: String, trim: true, maxlength: 300 },
    status:         { type: String, enum: ['open', 'settled', 'cancelled'], required: true, default: 'open' },
  },
  { timestamps: true },
);

receivableSchema.index({ user: 1, status: 1, dueDate: 1 });

export const Receivable = mongoose.model<IReceivableDoc>('Receivable', receivableSchema);
