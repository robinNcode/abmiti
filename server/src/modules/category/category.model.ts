import mongoose, { Schema } from 'mongoose';
import { ICategory } from '../../shared/types';

const categorySchema = new Schema<ICategory>(
  {
    user:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:      { type: String, required: true, trim: true, maxlength: 50 },
    icon:      { type: String, default: '📦' },
    color:     { type: String, default: '#c2552a' },
    type:      { type: String, enum: ['income', 'expense', 'savings', 'investment', 'payable', 'receivable'], required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

categorySchema.index({ user: 1, type: 1 });
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
