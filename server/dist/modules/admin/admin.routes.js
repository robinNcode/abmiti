"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const middleware_1 = require("../../shared/middleware");
const router = (0, express_1.Router)();
// ── Public routes ─────────────────────────────────────────────
router.get('/public-config', admin_controller_1.adminController.publicConfig);
router.get('/public-stats', admin_controller_1.adminController.publicStats);
router.post('/contact', admin_controller_1.adminController.contact);
router.get('/public-posts', admin_controller_1.adminController.publicPosts);
router.get('/public-posts/:slug', admin_controller_1.adminController.publicPostBySlug);
// ── Admin-only routes ─────────────────────────────────────────
router.get('/admin/stats', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.dashboardStats);
router.get('/admin/users', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.users);
router.get('/admin/payments', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.allPayments);
router.get('/admin/subscriptions', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.allSubscriptions);
router.get('/admin/notifications', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.allNotifications);
router.get('/admin/notifications/report', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.notificationReport);
router.get('/contacts', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.contacts);
router.delete('/contacts/:id', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.deleteContact);
router.put('/contacts/:id/resolve', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.resolveContact);
router.get('/posts', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.posts);
router.post('/posts/upload-image', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.uploadPostImage);
router.put('/posts', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.savePost);
router.delete('/posts/:id', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.deletePost);
router.put('/config', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.saveConfig);
router.post('/notifications', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.sendNotification);
router.delete('/admin/notifications/:id', middleware_1.authenticate, middleware_1.requireAdmin, admin_controller_1.adminController.deleteNotification);
// ── Authenticated (user or admin) ─────────────────────────────
router.get('/notifications', middleware_1.authenticate, admin_controller_1.adminController.notifications);
router.patch('/notifications/read-all', middleware_1.authenticate, admin_controller_1.adminController.readAllNotifications);
router.patch('/notifications/:id/read', middleware_1.authenticate, admin_controller_1.adminController.readNotification);
router.delete('/notifications/clear-all', middleware_1.authenticate, admin_controller_1.adminController.clearAllNotifications);
router.delete('/notifications/:id/clear', middleware_1.authenticate, admin_controller_1.adminController.clearNotification);
router.delete('/notifications/:id', middleware_1.authenticate, admin_controller_1.adminController.deleteOrClearNotification);
router.get('/subscriptions', middleware_1.authenticate, admin_controller_1.adminController.subscriptions);
router.post('/payments/start', middleware_1.authenticate, admin_controller_1.adminController.startPayment);
// ── Payment callbacks (no auth — called by SSLCommerz) ────────
router.post('/payments/callback', admin_controller_1.adminController.paymentCallback);
router.get('/payments/callback', admin_controller_1.adminController.paymentCallback);
router.post('/payments/ipn', admin_controller_1.adminController.paymentIpn);
router.get('/payments/ipn', admin_controller_1.adminController.paymentIpn);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map