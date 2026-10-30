import mongoose from 'mongoose';
import { IBudget } from '../../shared/types';
export declare const Budget: mongoose.Model<IBudget, {}, {}, {}, mongoose.Document<unknown, {}, IBudget, {}, {}> & IBudget & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=budget.model.d.ts.map