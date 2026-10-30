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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const crypto_1 = require("crypto");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const admin_service_1 = require("./admin.service");
const env_1 = require("../../config/env");
const errors_1 = require("../../shared/utils/errors");
const response_1 = require("../../shared/utils/response");
const uploadDir = path_1.default.join(process.cwd(), 'public', 'uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
const plans = { coffee: 100, monthly: 299, annual: 2999 };
const publicOrigin = () => `${env_1.env.CLIENT_URLS[0]}/abmiti`;
const verifiedTransaction = async (valId, expectedAmount, transactionId) => {
    if (!env_1.env.SSLCOMMERZ_STORE_ID || !env_1.env.SSLCOMMERZ_STORE_PASSWORD)
        throw new Error('SSLCommerz is not configured');
    const base = env_1.env.SSLCOMMERZ_SANDBOX ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com';
    const url = new URL('/validator/api/validationserverAPI.php', base);
    url.searchParams.set('val_id', valId);
    url.searchParams.set('store_id', env_1.env.SSLCOMMERZ_STORE_ID);
    url.searchParams.set('store_passwd', env_1.env.SSLCOMMERZ_STORE_PASSWORD);
    url.searchParams.set('format', 'json');
    const response = await fetch(url);
    const result = await response.json();
    return result.status === 'VALID' || result.status === 'VALIDATED'
        ? result.tran_id === transactionId && Number(result.amount) === expectedAmount && result.currency === 'BDT' : false;
};
exports.adminController = {
    async publicConfig(_req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.publicConfig());
    }
    catch (e) {
        next(e);
    } },
    async publicStats(_req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.publicStats());
    }
    catch (e) {
        next(e);
    } },
    async contact(req, res, next) { try {
        const { name, email, message } = req.body;
        if (!name?.trim() || !email?.trim() || !message?.trim())
            throw new errors_1.BadRequestError('Name, email and message are required');
        (0, response_1.sendCreated)(res, await admin_service_1.adminService.contact({ name: name.trim(), email: email.trim(), message: message.trim() }), 'Message received');
    }
    catch (e) {
        next(e);
    } },
    async contacts(req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.contacts(Number(req.query.page || 1), Number(req.query.limit || 50)));
    }
    catch (e) {
        next(e);
    } },
    async posts(_req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.posts());
    }
    catch (e) {
        next(e);
    } },
    async publicPosts(_req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.publicPosts());
    }
    catch (e) {
        next(e);
    } },
    async publicPostBySlug(req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.postBySlug(req.params.slug));
    }
    catch (e) {
        next(e);
    } },
    async savePost(req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.savePost(req.body));
    }
    catch (e) {
        next(e);
    } },
    uploadPostImage: [
        upload.single('image'),
        async (req, res, next) => {
            try {
                if (!req.file)
                    throw new errors_1.BadRequestError('No image provided');
                const fileId = (0, crypto_1.randomUUID)();
                const ext = '.webp';
                const fileName = `${fileId}${ext}`;
                const filePath = path_1.default.join(uploadDir, fileName);
                const thumbName = `${fileId}-thumb${ext}`;
                const thumbPath = path_1.default.join(uploadDir, thumbName);
                await (0, sharp_1.default)(req.file.buffer).webp({ quality: 80 }).toFile(filePath);
                await (0, sharp_1.default)(req.file.buffer).resize(400, 300, { fit: 'cover' }).webp({ quality: 75 }).toFile(thumbPath);
                const publicUrl = `public/uploads/${fileName}`;
                const thumbUrl = `public/uploads/${thumbName}`;
                (0, response_1.sendSuccess)(res, { url: publicUrl, thumbnailUrl: thumbUrl });
            }
            catch (e) {
                next(e);
            }
        }
    ],
    async deletePost(req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.deletePost(req.params.id));
    }
    catch (e) {
        next(e);
    } },
    async saveConfig(req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.saveConfig(req.body));
    }
    catch (e) {
        next(e);
    } },
    async notifications(req, res, next) {
        try {
            if (req.user?.userType === 'admin') {
                return (0, response_1.sendSuccess)(res, []);
            }
            (0, response_1.sendSuccess)(res, await admin_service_1.adminService.notifications(req.user.userId));
        }
        catch (e) {
            next(e);
        }
    },
    async allNotifications(_req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.allNotifications());
    }
    catch (e) {
        next(e);
    } },
    async notificationReport(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            (0, response_1.sendSuccess)(res, await admin_service_1.adminService.notificationReport(startDate, endDate));
        }
        catch (e) {
            next(e);
        }
    },
    async subscriptions(req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.subscriptions(req.user.userId));
    }
    catch (e) {
        next(e);
    } },
    async sendNotification(req, res, next) {
        try {
            const { title, message, targetUserId, targetUserIds } = req.body;
            if (!title?.trim() || !message?.trim())
                throw new errors_1.BadRequestError('Title and message are required');
            (0, response_1.sendCreated)(res, await admin_service_1.adminService.sendNotification({
                title: title.trim(),
                message: message.trim(),
                targetUserId: targetUserId?.trim() || null,
                targetUserIds: Array.isArray(targetUserIds) ? targetUserIds : undefined,
                readBy: [],
                clearedBy: [],
            }));
        }
        catch (e) {
            next(e);
        }
    },
    async deleteNotification(req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.deleteNotification(req.params.id));
    }
    catch (e) {
        next(e);
    } },
    async readNotification(req, res, next) {
        try {
            if (req.user?.userType === 'admin') {
                throw new errors_1.ForbiddenError('Admin accounts cannot interact with user notifications');
            }
            (0, response_1.sendSuccess)(res, await admin_service_1.adminService.readNotification(req.params.id, req.user.userId));
        }
        catch (e) {
            next(e);
        }
    },
    async readAllNotifications(req, res, next) {
        try {
            if (req.user?.userType === 'admin') {
                throw new errors_1.ForbiddenError('Admin accounts cannot interact with user notifications');
            }
            (0, response_1.sendSuccess)(res, await admin_service_1.adminService.readAllNotifications(req.user.userId));
        }
        catch (e) {
            next(e);
        }
    },
    async clearNotification(req, res, next) {
        try {
            if (req.user?.userType === 'admin') {
                throw new errors_1.ForbiddenError('Admin accounts cannot interact with user notifications');
            }
            (0, response_1.sendSuccess)(res, await admin_service_1.adminService.clearNotification(req.params.id, req.user.userId));
        }
        catch (e) {
            next(e);
        }
    },
    async clearAllNotifications(req, res, next) {
        try {
            if (req.user?.userType === 'admin') {
                throw new errors_1.ForbiddenError('Admin accounts cannot interact with user notifications');
            }
            (0, response_1.sendSuccess)(res, await admin_service_1.adminService.clearAllNotifications(req.user.userId));
        }
        catch (e) {
            next(e);
        }
    },
    async deleteOrClearNotification(req, res, next) {
        try {
            if (req.user?.userType === 'admin') {
                (0, response_1.sendSuccess)(res, await admin_service_1.adminService.deleteNotification(req.params.id));
            }
            else {
                (0, response_1.sendSuccess)(res, await admin_service_1.adminService.clearNotification(req.params.id, req.user.userId));
            }
        }
        catch (e) {
            next(e);
        }
    },
    async deleteContact(req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.deleteContact(req.params.id));
    }
    catch (e) {
        next(e);
    } },
    async resolveContact(req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.resolveContact(req.params.id, Boolean(req.body.is_resolved)));
    }
    catch (e) {
        next(e);
    } },
    async users(_req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.users());
    }
    catch (e) {
        next(e);
    } },
    async allPayments(_req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.allPayments());
    }
    catch (e) {
        next(e);
    } },
    async allSubscriptions(_req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.allSubscriptions());
    }
    catch (e) {
        next(e);
    } },
    async dashboardStats(_req, res, next) { try {
        (0, response_1.sendSuccess)(res, await admin_service_1.adminService.dashboardStats());
    }
    catch (e) {
        next(e);
    } },
    async startPayment(req, res, next) {
        try {
            const plan = String(req.body.plan);
            const amount = plans[plan];
            if (!amount)
                throw new errors_1.BadRequestError('Unknown plan');
            if (!env_1.env.SSLCOMMERZ_STORE_ID || !env_1.env.SSLCOMMERZ_STORE_PASSWORD)
                throw new errors_1.BadRequestError('Payments are not configured');
            const user = await (await Promise.resolve().then(() => __importStar(require('../../container')))).container.userRepo.findById(req.user.userId);
            if (!user)
                throw new errors_1.UnauthorizedError('User not found');
            const transactionId = (0, crypto_1.randomUUID)();
            await admin_service_1.adminService.savePayment({ userId: req.user.userId, transactionId, amount, plan, status: 'pending' });
            const base = env_1.env.SSLCOMMERZ_SANDBOX ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com';
            const form = new URLSearchParams({ store_id: env_1.env.SSLCOMMERZ_STORE_ID, store_passwd: env_1.env.SSLCOMMERZ_STORE_PASSWORD, total_amount: String(amount), currency: 'BDT', tran_id: transactionId, success_url: `${env_1.env.API_PREFIX}/payments/callback`, fail_url: `${env_1.env.API_PREFIX}/payments/callback`, cancel_url: `${env_1.env.API_PREFIX}/payments/callback`, ipn_url: `${env_1.env.API_PREFIX}/payments/ipn`, cus_name: user.name, cus_email: user.email, cus_add1: 'N/A', cus_city: 'Dhaka', cus_postcode: '1000', cus_country: 'Bangladesh', cus_phone: '01700000000', shipping_method: 'NO', product_name: plan, product_category: 'subscription', product_profile: 'non-physical-goods' });
            const response = await fetch(`${base}/gwprocess/v4/api.php`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
            const result = await response.json();
            if (!result.GatewayPageURL)
                throw new Error('Could not create SSLCommerz session');
            (0, response_1.sendSuccess)(res, { redirectUrl: result.GatewayPageURL });
        }
        catch (e) {
            next(e);
        }
    },
    async paymentCallback(req, res, next) {
        try {
            const body = { ...req.query, ...req.body };
            const record = await admin_service_1.adminService.paymentByTransaction(String(body.tran_id ?? ''));
            let success = false;
            if (record && body.val_id && (body.status === 'VALID' || body.status === 'VALIDATED'))
                success = await verifiedTransaction(String(body.val_id), Number(record.amount), String(body.tran_id));
            if (success && record.status !== 'paid')
                await admin_service_1.adminService.savePayment({ userId: record.userId ?? record.user_id, transactionId: String(body.tran_id), amount: Number(record.amount), plan: record.plan, status: 'paid', valId: body.val_id });
            if (success && record.plan !== 'coffee')
                await admin_service_1.adminService.activateSubscription(record.userId ?? record.user_id, String(body.tran_id), record.plan);
            res.redirect(`${publicOrigin()}/support?payment=${success ? 'success' : 'failed'}`);
        }
        catch (e) {
            next(e);
        }
    },
    async paymentIpn(req, res, next) {
        try {
            const body = { ...req.query, ...req.body };
            const transactionId = String(body.tran_id ?? '');
            const record = await admin_service_1.adminService.paymentByTransaction(transactionId);
            if (record && body.val_id && (body.status === 'VALID' || body.status === 'VALIDATED') && record.status !== 'paid' && await verifiedTransaction(String(body.val_id), Number(record.amount), transactionId))
                await admin_service_1.adminService.savePayment({ userId: record.userId ?? record.user_id, transactionId, amount: Number(record.amount), plan: record.plan, status: 'paid', valId: body.val_id });
            if (record && body.val_id && (body.status === 'VALID' || body.status === 'VALIDATED') && record.plan !== 'coffee' && await verifiedTransaction(String(body.val_id), Number(record.amount), transactionId))
                await admin_service_1.adminService.activateSubscription(record.userId ?? record.user_id, transactionId, record.plan);
            res.status(200).send('OK');
        }
        catch (e) {
            next(e);
        }
    },
};
//# sourceMappingURL=admin.controller.js.map