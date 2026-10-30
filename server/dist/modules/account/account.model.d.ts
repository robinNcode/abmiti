import mongoose from 'mongoose';
import { IAccount } from '../../shared/types';
export declare const Account: mongoose.Model<IAccount, {}, {}, {}, mongoose.Document<unknown, {}, IAccount, {}, {}> & IAccount & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=account.model.d.ts.map