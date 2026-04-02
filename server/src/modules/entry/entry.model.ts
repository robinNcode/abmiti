import mongoose, { Schema } from 'mongoose';
import { IEntry } from '../../shared/types';

const entrySchema = new Schema<IEntry>(
  {
    user:          { type: Schema.Types.ObjectId, ref: 'User',     required: true, index: true },
    type:          { type: String, enum: ['income', 'expense', 'savings', 'payable', 'receivable'],     required: true },
    amount:        { type: Number, required: true, min: 0 },
    note:          { type: String, trim: true, maxlength: 300, default: '' },
    category:      { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    source:        { type: String, enum: ['bank','bkash','nagad','cash','card','other'], default: 'cash' },
    account:       { type: Schema.Types.ObjectId, ref: 'Account' }, // For savings entries
    date:          { type: Date, required: true, default: Date.now },
    parsedFromSms: { type: Boolean, default: false },
    rawSms:        { type: String, select: false },
  },
  { timestamps: true },
);

// Indexes for common query patterns
entrySchema.index({ user: 1, date: -1 });
entrySchema.index({ user: 1, type: 1, date: -1 });
entrySchema.index({ user: 1, category: 1 });

export const Entry = mongoose.model<IEntry>('Entry', entrySchema);
