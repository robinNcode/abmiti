import { randomUUID } from 'crypto';
import { container } from '../../container';
import { BadRequestError, NotFoundError } from '../../shared/utils/errors';
import { IQuickExpenseItem } from '../../shared/types';

export const MAX_QUICK_EXPENSES = 6;

/** A shortcut item plus whether it has already been logged in the requested month. */
export interface IQuickExpenseView extends IQuickExpenseItem {
  logged: boolean;
}

const normalize = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Shortcuts are matched to already-logged expenses by name (case/space insensitive),
 * because a recurring bill should not appear twice in the same month even when the
 * entry was created from the normal expense form.
 */
async function loggedLabels(userId: string, month: number, year: number): Promise<Set<string>> {
  const { data } = await container.entryRepo.findMany(
    userId,
    { type: 'expense', month, year },
    { page: 1, limit: 500 },
  );
  return new Set(data.map((entry) => normalize(entry.note)).filter(Boolean));
}

/** Default shortcuts for users who have not pinned their own yet. */
async function deriveFromBudget(userId: string, month: number, year: number): Promise<IQuickExpenseItem[]> {
  const budget = await container.budgetRepo.findByMonth(userId, month, year);
  const derived: IQuickExpenseItem[] = [];

  for (const line of budget?.lines?.filter((l) => l.isActive) ?? []) {
    for (const sub of line.subItems ?? []) {
      derived.push({
        id:          `suggested-${String(line._id)}-${derived.length}`,
        label:       sub.name,
        icon:        line.icon || '💸',
        categoryId:  line.linkedCategoryIds?.[0] ? String(line.linkedCategoryIds[0]) : null,
        budgetLineId: String(line._id),
        expectedAmount: Number(sub.expectedAmount) || 0,
      });
    }
  }

  if (derived.length > 0) return derived.slice(0, MAX_QUICK_EXPENSES);

  // No budget sub-items yet → offer the user's own expense categories.
  const categories = await container.categoryRepo.findByUser(userId, 'expense');
  return categories.slice(0, MAX_QUICK_EXPENSES).map((cat) => ({
    id:          `suggested-cat-${String(cat._id)}`,
    label:       cat.name,
    icon:        cat.icon,
    categoryId:  String(cat._id),
    budgetLineId: null,
    expectedAmount: 0,
  }));
}

async function currentItems(userId: string, month: number, year: number): Promise<IQuickExpenseItem[]> {
  const user = await container.userRepo.findById(userId);
  if (!user) throw new NotFoundError('User');

  const pinned = user.quickExpenses ?? [];
  if (pinned.length > 0) return pinned.slice(0, MAX_QUICK_EXPENSES);
  return deriveFromBudget(userId, month, year);
}

function sanitizeItems(raw: unknown): IQuickExpenseItem[] {
  if (!Array.isArray(raw)) throw new BadRequestError('items must be an array');
  if (raw.length > MAX_QUICK_EXPENSES) {
    throw new BadRequestError(`You can pin at most ${MAX_QUICK_EXPENSES} quick expenses`);
  }

  const seen = new Set<string>();
  const items: IQuickExpenseItem[] = [];

  for (const rawItem of raw) {
    const item = (rawItem ?? {}) as Record<string, unknown>;
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    if (!label) throw new BadRequestError('Each quick expense needs a name');
    if (label.length > 100) throw new BadRequestError('Quick expense name is too long (max 100)');

    const key = normalize(label);
    if (seen.has(key)) continue;
    seen.add(key);

    const amount = Number(item.expectedAmount);
    items.push({
      id:          typeof item.id === 'string' && item.id ? item.id : randomUUID(),
      label,
      icon:        typeof item.icon === 'string' && item.icon ? item.icon.slice(0, 20) : '💸',
      categoryId:  typeof item.categoryId === 'string' && item.categoryId ? item.categoryId : null,
      budgetLineId: typeof item.budgetLineId === 'string' && item.budgetLineId ? item.budgetLineId : null,
      expectedAmount: Number.isFinite(amount) && amount > 0 ? amount : 0,
    });
  }

  return items;
}

export const quickExpenseService = {
  async list(userId: string, month: number, year: number): Promise<IQuickExpenseView[]> {
    const items = await currentItems(userId, month, year);
    const logged = await loggedLabels(userId, month, year);
    return items.map((item) => ({ ...item, logged: logged.has(normalize(item.label)) }));
  },

  async replace(userId: string, rawItems: unknown, month: number, year: number): Promise<IQuickExpenseView[]> {
    const items = sanitizeItems(rawItems);
    const updated = await container.userRepo.updateQuickExpenses(userId, items);
    if (!updated) throw new NotFoundError('User');
    return this.list(userId, month, year);
  },
};
