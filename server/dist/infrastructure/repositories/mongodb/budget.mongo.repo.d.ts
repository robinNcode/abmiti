import { IBudgetRepository } from '../../../shared/types/repositories';
import { IBudget, IBudgetInput, IBudgetLineInput, IEntry } from '../../../shared/types';
export declare class MongoBudgetRepository implements IBudgetRepository {
    create(userId: string, data: IBudgetInput): Promise<IBudget>;
    update(id: string, userId: string, data: Partial<IBudgetInput>): Promise<IBudget | null>;
    findById(id: string, userId: string): Promise<IBudget | null>;
    findByMonth(userId: string, month: number, year: number, isTemplate?: boolean): Promise<IBudget | null>;
    findMany(userId: string, templatesOnly?: boolean): Promise<IBudget[]>;
    remove(id: string, userId: string): Promise<boolean>;
    addLine(budgetId: string, userId: string, line: IBudgetLineInput): Promise<IBudget | null>;
    updateLine(budgetId: string, lineId: string, userId: string, line: Partial<IBudgetLineInput>): Promise<IBudget | null>;
    removeLine(budgetId: string, lineId: string, userId: string): Promise<IBudget | null>;
    reorderLines(budgetId: string, userId: string, order: string[]): Promise<IBudget | null>;
    findExpenseEntriesByCategories(userId: string, categoryIds: string[], start: Date, end: Date): Promise<IEntry[]>;
}
//# sourceMappingURL=budget.mongo.repo.d.ts.map