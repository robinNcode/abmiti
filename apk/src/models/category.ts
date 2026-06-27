import type { EntryType } from './common';
import { getId } from './common';

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: EntryType;
    isDefault: boolean;
}

export interface CategoryInput {
    name: string;
    icon: string;
    color: string;
    type: EntryType;
    isDefault?: boolean;
}

export function mapCategoryFromApi(json: Record<string, unknown>): Category {
    return {
        id: getId(json),
        name: String(json.name ?? 'Uncategorized'),
        icon: String(json.icon ?? 'tag'),
        color: String(json.color ?? '#4A7C59'),
        type: (json.type as EntryType) ?? 'expense',
        isDefault: Boolean(json.isDefault ?? json.is_default ?? false),
    };
}

