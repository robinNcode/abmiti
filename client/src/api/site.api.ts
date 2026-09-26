import { apiClient } from './client';
export const siteApi = {
  config: () => apiClient.get<{ data: any }>('/public-config').then((r) => r.data.data),
  contact: (data: { name: string; email: string; message: string }) => apiClient.post('/contact', data),
  publicPosts: () => apiClient.get<{ data: any[] }>('/public-posts').then((r) => r.data.data),
  contacts: () => apiClient.get<{ data: any[] }>('/contacts').then((r) => r.data.data),
  posts: () => apiClient.get<{ data: any[] }>('/posts').then((r) => r.data.data),
  savePost: (data: any) => apiClient.put('/posts', data).then((r) => r.data.data),
  saveConfig: (data: any) => apiClient.put('/config', data).then((r) => r.data.data),
  notifications: () => apiClient.get<{ data: any[] }>('/notifications').then((r) => r.data.data),
  subscriptions: () => apiClient.get<{ data: any[] }>('/subscriptions').then((r) => r.data.data),
  sendNotification: (data: any) => apiClient.post('/notifications', data),
  startPayment: (plan: string) => apiClient.post<{ data: { redirectUrl: string } }>('/payments/start', { plan }).then((r) => r.data.data),
};
