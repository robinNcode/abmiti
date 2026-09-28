import { apiClient } from './client';

export const siteApi = {
  // ── Public ──────────────────────────────────────────────────
  config: () => apiClient.get<{ data: any }>('/public-config').then((r) => r.data.data),
  contact: (data: { name: string; email: string; message: string }) => apiClient.post('/contact', data),
  publicPosts: () => apiClient.get<{ data: any[] }>('/public-posts').then((r) => r.data.data),

  // ── Auth-required (user or admin) ───────────────────────────
  notifications: () => apiClient.get<{ data: any[] }>('/notifications').then((r) => r.data.data),
  subscriptions: () => apiClient.get<{ data: any[] }>('/subscriptions').then((r) => r.data.data),
  startPayment: (plan: string) => apiClient.post<{ data: { redirectUrl: string } }>('/payments/start', { plan }).then((r) => r.data.data),

  // ── Admin-only ──────────────────────────────────────────────
  contacts: () => apiClient.get<{ data: any[] }>('/contacts').then((r) => r.data.data),
  deleteContact: (id: string) => apiClient.delete(`/contacts/${id}`).then((r) => r.data.data),
  posts: () => apiClient.get<{ data: any[] }>('/posts').then((r) => r.data.data),
  savePost: (data: any) => apiClient.put('/posts', data).then((r) => r.data.data),
  deletePost: (id: string) => apiClient.delete(`/posts/${id}`).then((r) => r.data.data),
  saveConfig: (data: any) => apiClient.put('/config', data).then((r) => r.data.data),
  sendNotification: (data: any) => apiClient.post('/notifications', data),
  deleteNotification: (id: string) => apiClient.delete(`/notifications/${id}`).then((r) => r.data.data),

  // ── Admin dashboard & management ────────────────────────────
  adminStats: () => apiClient.get<{ data: any }>('/admin/stats').then((r) => r.data.data),
  adminUsers: () => apiClient.get<{ data: any[] }>('/admin/users').then((r) => r.data.data),
  adminPayments: () => apiClient.get<{ data: any[] }>('/admin/payments').then((r) => r.data.data),
  adminSubscriptions: () => apiClient.get<{ data: any[] }>('/admin/subscriptions').then((r) => r.data.data),
  adminNotifications: () => apiClient.get<{ data: any[] }>('/admin/notifications').then((r) => r.data.data),
};
