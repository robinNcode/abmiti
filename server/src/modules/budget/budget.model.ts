import mongoose, { Schema } from 'mongoose';
import { IBudget } from '../../shared/types';

const budgetSchema = new Schema<IBudget>(
  {
    user:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month:  { type: Number, required: true, min: 1, max: 12 },
    year:   { type: Number, required: true, min: 2000 },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

// One budget per user per month/year
budgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>('Budget', budgetSchema);
