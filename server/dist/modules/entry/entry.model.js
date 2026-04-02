"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entry = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const entrySchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, maxlength: 300, default: '' },
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true },
    source: { type: String, enum: ['bank', 'bkash', 'nagad', 'cash', 'card', 'other'], default: 'cash' },
    date: { type: Date, required: true, default: Date.now },
    parsedFromSms: { type: Boolean, default: false },
    rawSms: { type: String, select: false },
}, { timestamps: true });
// Indexes for common query patterns
entrySchema.index({ user: 1, date: -1 });
entrySchema.index({ user: 1, type: 1, date: -1 });
entrySchema.index({ user: 1, category: 1 });
exports.Entry = mongoose_1.default.model('Entry', entrySchema);
//# sourceMappingURL=entry.model.js.map