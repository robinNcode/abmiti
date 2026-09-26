import mongoose, { Schema } from 'mongoose';

const record = (name: string, fields: any) => mongoose.models[name] || mongoose.model(name, new Schema(fields, { timestamps: true, strict: false }));
export const ContactMessage = record('ContactMessage', { name: String, email: String, message: String, createdAt: Date });
export const BlogPost = record('BlogPost', { title: String, slug: String, excerpt: String, content: String, published: Boolean });
export const SiteConfig = record('SiteConfig', { key: String, value: Schema.Types.Mixed });
export const Notification = record('Notification', { title: String, message: String, targetUserId: String, readBy: [String] });
export const Payment = record('Payment', { userId: String, transactionId: String, amount: Number, plan: String, status: String, gatewayData: Schema.Types.Mixed });
export const Subscription = record('Subscription', { userId: String, transactionId: String, plan: String, startsAt: Date, expiresAt: Date, status: String });
