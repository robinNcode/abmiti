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
exports.Budget = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const budgetSubItemSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    expectedAmount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, maxlength: 300 },
}, { _id: true });
const budgetLineSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    icon: { type: String, default: '📦', maxlength: 20 },
    color: { type: String, default: '#4A7C59', match: /^#[0-9A-Fa-f]{6}$/ },
    allocationMethod: { type: String, enum: ['percentage', 'fixed'], required: true },
    allocationValue: { type: Number, required: true, min: 0 },
    linkedCategoryIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' }],
    subItems: { type: [budgetSubItemSchema], default: [] },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    note: { type: String, trim: true, maxlength: 300 },
}, { _id: true });
const budgetSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },
    totalIncome: { type: Number, required: true, min: 0, default: 0 },
    lines: { type: [budgetLineSchema], default: [] },
    isTemplate: { type: Boolean, default: false, index: true },
    templateName: { type: String, trim: true, maxlength: 100 },
    notes: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });
budgetSchema.index({ user: 1, month: 1, year: 1, isTemplate: 1 }, { unique: true });
exports.Budget = mongoose_1.default.model('Budget', budgetSchema);
//# sourceMappingURL=budget.model.js.map