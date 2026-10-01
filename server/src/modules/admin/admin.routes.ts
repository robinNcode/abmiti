import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireAdmin } from '../../shared/middleware';
const router = Router();

// ── Public routes ─────────────────────────────────────────────
router.get('/public-config', adminController.publicConfig);
router.post('/contact', adminController.contact);
router.get('/public-posts', adminController.publicPosts);
router.get('/public-posts/:slug', adminController.publicPostBySlug);

// ── Admin-only routes ─────────────────────────────────────────
router.get('/admin/stats', authenticate, requireAdmin, adminController.dashboardStats);
router.get('/admin/users', authenticate, requireAdmin, adminController.users);
router.get('/admin/payments', authenticate, requireAdmin, adminController.allPayments);
router.get('/admin/subscriptions', authenticate, requireAdmin, adminController.allSubscriptions);
router.get('/admin/notifications', authenticate, requireAdmin, adminController.allNotifications);

router.get('/contacts', authenticate, requireAdmin, adminController.contacts);
router.delete('/contacts/:id', authenticate, requireAdmin, adminController.deleteContact);
router.get('/posts', authenticate, requireAdmin, adminController.posts);
router.put('/posts', authenticate, requireAdmin, adminController.savePost);
router.delete('/posts/:id', authenticate, requireAdmin, adminController.deletePost);
router.put('/config', authenticate, requireAdmin, adminController.saveConfig);
router.post('/notifications', authenticate, requireAdmin, adminController.sendNotification);
router.delete('/notifications/:id', authenticate, requireAdmin, adminController.deleteNotification);

// ── Authenticated (user or admin) ─────────────────────────────
router.get('/notifications', authenticate, adminController.notifications);
router.get('/subscriptions', authenticate, adminController.subscriptions);
router.post('/payments/start', authenticate, adminController.startPayment);

// ── Payment callbacks (no auth — called by SSLCommerz) ────────
router.post('/payments/callback', adminController.paymentCallback);
router.get('/payments/callback', adminController.paymentCallback);
router.post('/payments/ipn', adminController.paymentIpn);
router.get('/payments/ipn', adminController.paymentIpn);

export default router;
