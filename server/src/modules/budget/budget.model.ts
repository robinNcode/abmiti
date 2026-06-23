import mongoose, { Schema } from 'mongoose';
import { IBudget, IBudgetLine, IBudgetSubItem } from '../../shared/types';

const budgetSubItemSchema = new Schema<IBudgetSubItem>(
  {
    name:           { type: String, required: true, trim: true, maxlength: 100 },
    expectedAmount: { type: Number, required: true, min: 0 },
    note:           { type: String, trim: true, maxlength: 300 },
  },
  { _id: true },
);

const budgetLineSchema = new Schema<IBudgetLine>(
  {
    name:              { type: String, required: true, trim: true, maxlength: 100 },
    icon:              { type: String, default: '📦', maxlength: 20 },
    color:             { type: String, default: '#4A7C59', match: /^#[0-9A-Fa-f]{6}$/ },
    allocationMethod:  { type: String, enum: ['percentage', 'fixed'], required: true },
    allocationValue:   { type: Number, required: true, min: 0 },
    linkedCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    subItems:          { type: [budgetSubItemSchema], default: [] },
    order:             { type: Number, default: 0 },
    isActive:          { type: Boolean, default: true },
    note:              { type: String, trim: true, maxlength: 300 },
  },
  { _id: true },
);

const budgetSchema = new Schema<IBudget>(
  {
    user:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month:        { type: Number, required: true, min: 1, max: 12 },
    year:         { type: Number, required: true, min: 2000 },
    totalIncome:  { type: Number, required: true, min: 0, default: 0 },
    lines:        { type: [budgetLineSchema], default: [] },
    isTemplate:   { type: Boolean, default: false, index: true },
    templateName: { type: String, trim: true, maxlength: 100 },
    notes:        { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

budgetSchema.index({ user: 1, month: 1, year: 1, isTemplate: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>('Budget', budgetSchema);
