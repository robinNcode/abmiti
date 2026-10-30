"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoUserRepository = void 0;
const auth_model_1 = require("../../../modules/auth/auth.model");
class MongoUserRepository {
    async findByEmail(email, includePassword = false) {
        const q = auth_model_1.User.findOne({ email });
        return includePassword ? q.select('+password') : q;
    }
    async findById(id) {
        return auth_model_1.User.findById(id);
    }
    async create(data) {
        return auth_model_1.User.create(data);
    }
    async updateBudget(id, budget) {
        return auth_model_1.User.findByIdAndUpdate(id, { budget }, { new: true });
    }
    async updateProfile(id, data) {
        const update = {};
        if (data.name !== undefined)
            update.name = data.name;
        if (data.avatar !== undefined)
            update.avatar = data.avatar;
        if (Object.keys(update).length === 0)
            return this.findById(id);
        return auth_model_1.User.findByIdAndUpdate(id, update, { new: true });
    }
    async findByGoogleId(googleId) {
        return auth_model_1.User.findOne({ google_id: googleId });
    }
    async createFromGoogle(data) {
        return auth_model_1.User.create({ name: data.name, email: data.email, google_id: data.googleId, avatar: data.avatar });
    }
    async linkGoogleId(userId, googleId) {
        return auth_model_1.User.findOneAndUpdate({ _id: userId, google_id: { $exists: false } }, { google_id: googleId }, { new: true });
    }
}
exports.MongoUserRepository = MongoUserRepository;
//# sourceMappingURL=user.mongo.repo.js.map