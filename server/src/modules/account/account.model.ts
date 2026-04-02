import mongoose, { Schema } from 'mongoose';
import { IAccount } from '../../shared/types';

const accountSchema = new Schema<IAccount>(
  {
    user:          { type: Schema.Types.ObjectId, ref: 'User',     required: true, index: true },
    name:          { type: String, required: true, trim: true, maxlength: 100 },
    type:          { type: String, enum: ['bank', 'mobile'],       required: true },
    accountNumber: { type: String, trim: true, maxlength: 50 },
    bankName:      { type: String, trim: true, maxlength: 100 },
    provider:      { type: String, enum: ['bkash', 'nagad', 'rocket'] },
    balance:       { type: Number, required: true, default: 0 },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Indexes for common query patterns
accountSchema.index({ user: 1, type: 1 });
accountSchema.index({ user: 1, isActive: 1 });

export const Account = mongoose.model<IAccount>('Account', accountSchema);
