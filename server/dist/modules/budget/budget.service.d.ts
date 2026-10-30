import { IBudget, IBudgetInput, IBudgetLine, IBudgetLineInput, IBudgetLineSummary, IBudgetSummary, IEntry } from '../../shared/types';
export declare const defaultBudgetLines: IBudgetLineInput[];
export declare const budgetService: {
    resolvePlannedAmount(line: Pick<IBudgetLine, "allocationMethod" | "allocationValue">, totalIncome: number): number;
    create(userId: string, data: IBudgetInput): Promise<IBudget>;
    seedDefaultBudget(userId: string, month: number, year: number, totalIncome?: number): Promise<IBudget>;
    getByMonth(userId: string, month: number, year: number): Promise<IBudget>;
    update(userId: string, id: string, data: Partial<IBudgetInput>): Promise<IBudget>;
    list(userId: string): Promise<IBudget[]>;
    remove(userId: string, id: string): Promise<void>;
    copy(userId: string, id: string, toMonth: number, toYear: number): Promise<IBudget>;
    addLine(userId: string, budgetId: string, line: IBudgetLineInput): Promise<IBudget>;
    updateLine(userId: string, budgetId: string, lineId: string, line: Partial<IBudgetLineInput>): Promise<IBudget>;
    removeLine(userId: string, budgetId: string, lineId: string): Promise<IBudget>;
    reorderLines(userId: string, budgetId: string, order: string[]): Promise<IBudget>;
    templates(userId: string): Promise<IBudget[]>;
    saveAsTemplate(userId: string, id: string, templateName?: string): Promise<IBudget>;
    fromTemplate(userId: string, templateId: string, month: number, year: number): Promise<IBudget>;
    deleteTemplate(userId: string, id: string): Promise<void>;
    computeLineSummary(budget: IBudget, line: IBudgetLine, entries: IEntry[]): IBudgetLineSummary;
    summary(userId: string, id: string): Promise<IBudgetSummary>;
    lineEntries(userId: string, budgetId: string, lineId: string): Promise<IEntry[]>;
};
//# sourceMappingURL=budget.service.d.ts.map