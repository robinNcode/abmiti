import mongoose from 'mongoose';
import { IEntry } from '../../shared/types';
export declare const Entry: mongoose.Model<IEntry, {}, {}, {}, mongoose.Document<unknown, {}, IEntry, {}, {}> & IEntry & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=entry.model.d.ts.map