import { apiClient } from './client';
import { BudgetLineInput, BudgetSummary, Entry, IBudget, IBudgetInput } from '@/types';

export const budgetApi = {
  getByMonth: (month: number, year: number) =>
    apiClient.get<{ data: IBudget }>('/budgets', { params: { month, year } }).then((r) => r.data.data),

  create: (dto: IBudgetInput) =>
    apiClient.post<{ data: IBudget }>('/budgets', dto).then((r) => r.data.data),

  update: (id: string, dto: Partial<IBudgetInput>) =>
    apiClient.put<{ data: IBudget }>(`/budgets/${id}`, dto).then((r) => r.data.data),

  remove: (id: string) => apiClient.delete(`/budgets/${id}`),

  copy: (id: string, toMonth: number, toYear: number) =>
    apiClient.post<{ data: IBudget }>(`/budgets/${id}/copy`, null, { params: { toMonth, toYear } }).then((r) => r.data.data),

  addLine: (id: string, line: BudgetLineInput) =>
    apiClient.post<{ data: IBudget }>(`/budgets/${id}/lines`, line).then((r) => r.data.data),

  updateLine: (id: string, lineId: string, line: Partial<BudgetLineInput>) =>
    apiClient.put<{ data: IBudget }>(`/budgets/${id}/lines/${lineId}`, line).then((r) => r.data.data),

  removeLine: (id: string, lineId: string) =>
    apiClient.delete<{ data: IBudget }>(`/budgets/${id}/lines/${lineId}`).then((r) => r.data.data),

  reorderLines: (id: string, order: string[]) =>
    apiClient.patch<{ data: IBudget }>(`/budgets/${id}/lines/reorder`, { order }).then((r) => r.data.data),

  templates: () =>
    apiClient.get<{ data: IBudget[] }>('/budgets/templates').then((r) => r.data.data),

  saveAsTemplate: (id: string, templateName: string) =>
    apiClient.post<{ data: IBudget }>(`/budgets/${id}/save-as-template`, { templateName }).then((r) => r.data.data),

  fromTemplate: (templateId: string, month: number, year: number) =>
    apiClient.post<{ data: IBudget }>(`/budgets/from-template/${templateId}`, null, { params: { month, year } }).then((r) => r.data.data),

  deleteTemplate: (id: string) => apiClient.delete(`/budgets/templates/${id}`),

  summary: (id: string) =>
    apiClient.get<{ data: BudgetSummary }>(`/budgets/${id}/summary`).then((r) => r.data.data),

  lineEntries: (id: string, lineId: string) =>
    apiClient.get<{ data: Entry[] }>(`/budgets/${id}/summary/line/${lineId}`).then((r) => r.data.data),
};
