import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { adminService } from './admin.service';
import { env } from '../../config/env';
import { BadRequestError, UnauthorizedError } from '../../shared/utils/errors';
import { sendCreated, sendSuccess } from '../../shared/utils/response';

const plans: Record<string, number> = { coffee: 100, monthly: 299, annual: 2999 };
const publicOrigin = () => `${env.CLIENT_URLS[0]}/abmiti`;
const verifiedTransaction = async (valId: string, expectedAmount: number, transactionId: string) => {
  if (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD) throw new Error('SSLCommerz is not configured');
  const base = env.SSLCOMMERZ_SANDBOX ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com';
  const url = new URL('/validator/api/validationserverAPI.php', base);
  url.searchParams.set('val_id', valId); url.searchParams.set('store_id', env.SSLCOMMERZ_STORE_ID);
  url.searchParams.set('store_passwd', env.SSLCOMMERZ_STORE_PASSWORD); url.searchParams.set('format', 'json');
  const response = await fetch(url); const result = await response.json() as any;
  return result.status === 'VALID' || result.status === 'VALIDATED'
    ? result.tran_id === transactionId && Number(result.amount) === expectedAmount && result.currency === 'BDT' : false;
};
export const adminController = {
  async publicConfig(_req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await adminService.publicConfig()); } catch (e) { next(e); } },
  async contact(req: Request, res: Response, next: NextFunction) { try { const { name, email, message } = req.body; if (!name?.trim() || !email?.trim() || !message?.trim()) throw new BadRequestError('Name, email and message are required'); sendCreated(res, await adminService.contact({ name: name.trim(), email: email.trim(), message: message.trim() }), 'Message received'); } catch (e) { next(e); } },
  async contacts(_req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await adminService.contacts()); } catch (e) { next(e); } },
  async posts(_req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await adminService.posts()); } catch (e) { next(e); } },
  async publicPosts(_req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await adminService.publicPosts()); } catch (e) { next(e); } },
  async savePost(req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await adminService.savePost(req.body)); } catch (e) { next(e); } },
  async saveConfig(req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await adminService.saveConfig(req.body)); } catch (e) { next(e); } },
  async notifications(req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await adminService.notifications(req.user!.userId)); } catch (e) { next(e); } },
  async subscriptions(req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, await adminService.subscriptions(req.user!.userId)); } catch (e) { next(e); } },
  async sendNotification(req: Request, res: Response, next: NextFunction) { try { const { title, message, targetUserId } = req.body; if (!title?.trim() || !message?.trim()) throw new BadRequestError('Title and message are required'); sendCreated(res, await adminService.sendNotification({ title: title.trim(), message: message.trim(), targetUserId: targetUserId || null, readBy: [] })); } catch (e) { next(e); } },
  async startPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = String(req.body.plan); const amount = plans[plan]; if (!amount) throw new BadRequestError('Unknown plan');
      if (!env.SSLCOMMERZ_STORE_ID || !env.SSLCOMMERZ_STORE_PASSWORD) throw new BadRequestError('Payments are not configured');
      const user = await (await import('../../container')).container.userRepo.findById(req.user!.userId);
      if (!user) throw new UnauthorizedError('User not found');
      const transactionId = randomUUID(); await adminService.savePayment({ userId: req.user!.userId, transactionId, amount, plan, status: 'pending' });
      const base = env.SSLCOMMERZ_SANDBOX ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com';
      const form = new URLSearchParams({ store_id: env.SSLCOMMERZ_STORE_ID, store_passwd: env.SSLCOMMERZ_STORE_PASSWORD, total_amount: String(amount), currency: 'BDT', tran_id: transactionId, success_url: `${env.API_PREFIX}/payments/callback`, fail_url: `${env.API_PREFIX}/payments/callback`, cancel_url: `${env.API_PREFIX}/payments/callback`, ipn_url: `${env.API_PREFIX}/payments/ipn`, cus_name: user.name, cus_email: user.email, cus_add1: 'N/A', cus_city: 'Dhaka', cus_postcode: '1000', cus_country: 'Bangladesh', cus_phone: '01700000000', shipping_method: 'NO', product_name: plan, product_category: 'subscription', product_profile: 'non-physical-goods' });
      const response = await fetch(`${base}/gwprocess/v4/api.php`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
      const result = await response.json() as any; if (!result.GatewayPageURL) throw new Error('Could not create SSLCommerz session');
      sendSuccess(res, { redirectUrl: result.GatewayPageURL });
    } catch (e) { next(e); }
  },
  async paymentCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const body = { ...req.query, ...req.body } as Record<string, string>; const record: any = await adminService.paymentByTransaction(String(body.tran_id ?? ''));
      let success = false;
      if (record && body.val_id && (body.status === 'VALID' || body.status === 'VALIDATED')) success = await verifiedTransaction(String(body.val_id), Number(record.amount), String(body.tran_id));
      if (success && record.status !== 'paid') await adminService.savePayment({ userId: record.userId ?? record.user_id, transactionId: String(body.tran_id), amount: Number(record.amount), plan: record.plan, status: 'paid', valId: body.val_id });
      if (success && record.plan !== 'coffee') await adminService.activateSubscription(record.userId ?? record.user_id, String(body.tran_id), record.plan);
      res.redirect(`${publicOrigin()}/support?payment=${success ? 'success' : 'failed'}`);
    } catch (e) { next(e); }
  },
  async paymentIpn(req: Request, res: Response, next: NextFunction) {
    try {
      const body = { ...req.query, ...req.body } as Record<string, string>; const transactionId = String(body.tran_id ?? ''); const record: any = await adminService.paymentByTransaction(transactionId);
      if (record && body.val_id && (body.status === 'VALID' || body.status === 'VALIDATED') && record.status !== 'paid' && await verifiedTransaction(String(body.val_id), Number(record.amount), transactionId)) await adminService.savePayment({ userId: record.userId ?? record.user_id, transactionId, amount: Number(record.amount), plan: record.plan, status: 'paid', valId: body.val_id });
      if (record && body.val_id && (body.status === 'VALID' || body.status === 'VALIDATED') && record.plan !== 'coffee' && await verifiedTransaction(String(body.val_id), Number(record.amount), transactionId)) await adminService.activateSubscription(record.userId ?? record.user_id, transactionId, record.plan);
      res.status(200).send('OK');
    } catch (e) { next(e); }
  },
};
