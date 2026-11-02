import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../../shared/types';

const quickExpenseSchema = new Schema(
  {
    id:             { type: String, required: true },
    label:          { type: String, required: true, trim: true, maxlength: 100 },
    icon:           { type: String, maxlength: 20 },
    categoryId:     { type: String, default: null },
    budgetLineId:   { type: String, default: null },
    expectedAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6, select: false },
    budget: { type: Number, default: 0, min: 0 },
    avatar: { type: String, default: '' },
    google_id: { type: String, unique: true, sparse: true },
    userType: { type: String, enum: ['admin', 'user'], default: 'user' },
    quickExpenses: { type: [quickExpenseSchema], default: [] },
  },
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);

