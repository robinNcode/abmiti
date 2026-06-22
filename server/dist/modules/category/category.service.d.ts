import { ICategory, EntryType } from '../../shared/types';
export declare const categoryService: {
    list(userId: string, type?: EntryType): Promise<ICategory[]>;
    create(userId: string, dto: {
        name: string;
        icon?: string;
        color?: string;
        type: EntryType;
    }): Promise<ICategory>;
    update(userId: string, id: string, dto: Partial<{
        name: string;
        icon: string;
        color: string;
    }>): Promise<ICategory>;
    remove(userId: string, id: string): Promise<void>;
};
//# sourceMappingURL=category.service.d.ts.map