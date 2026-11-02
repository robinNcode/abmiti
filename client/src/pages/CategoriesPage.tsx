import { useState } from 'react';
import { Trash2, Plus, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks';
import { PageHeader, Modal, Spinner, EmptyState } from '@/components/ui';
import { Category, EntryType } from '@/types';
import { cx } from '@/utils';
import { useTranslation } from 'react-i18next';

const ICONS = ['🏠','🍔','🚌','💡','🎓','🏥','🛍️','🎬','✈️','💳','📦','💼','💻','🏪','🎁','💰','💵','🌍','🎯','📱','🏦','📄','📥','📤'];
const COLORS = ['#c2552a','#4a7c59','#d4973e','#2a6dc2','#9b59b6','#e74c3c','#e67e22','#1abc9c','#16a085','#2980b9','#8e44ad','#c0392b','#7f8c8d','#95a5a6','#f39c12','#e91e63','#27ae60','#f1c40f','#3498db'];

interface FormData { name: string; }

export default function CategoriesPage() {
  const { t } = useTranslation();
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState<Category | null>(null);
  const [tab, setTab]           = useState<EntryType>('expense');
  const [selIcon, setSelIcon]   = useState('📦');
  const [selColor, setSelColor] = useState(COLORS[0]);

  const { data: categories = [], isLoading } = useCategories(tab);
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const saving  = create.isPending || update.isPending;

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '' },
  });
  const nameVal = watch('name');

  const openCreate = () => {
    setEditing(null);
    reset({ name: '' });
    setSelIcon('📦');
    setSelColor(COLORS[0]);
    setModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    reset({ name: cat.name });
    setSelIcon(cat.icon);
    setSelColor(cat.color);
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditing(null);
    reset({ name: '' });
  };

  const onSubmit = handleSubmit(async (data) => {
    const payload = { name: data.name.trim(), icon: selIcon, color: selColor };
    if (editing) {
      await update.mutateAsync({ id: editing._id, ...payload });
    } else {
      await create.mutateAsync({ ...payload, type: tab });
    }
    closeModal();
  });

  const formType: EntryType = editing?.type ?? tab;

  return (
    <div className="min-h-full">
      <PageHeader
        title={t('categoriesTitle')}
        subtitle={t('categoriesSubtitle')}
        action={
          <button onClick={openCreate} className="btn-primary text-sm">
            <Plus size={14} /> {t('addCategory')}
          </button>
        }
      />

      <div className="px-4 md:px-8 pb-10 space-y-4">
        <div className="flex gap-2">
          {(['expense', 'income'] as EntryType[]).map((type) => (
            <button key={type} onClick={() => setTab(type)}
              className={cx(
                'px-5 py-2 rounded-xl text-sm font-medium border transition-all capitalize',
                tab === type && type === 'expense' ? 'bg-terra text-white border-terra' :
                tab === type && type === 'income'  ? 'bg-sage text-white border-sage' :
                'border-paper-mist2 text-ink/60 hover:bg-paper-mist',
              )}>
              {type === 'income' ? '↑' : '↓'} {t(type)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner className="text-terra" /></div>
        ) : categories.length ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat, i) => (
              <div key={cat._id}
                className="card p-4 flex items-center gap-3 group hover:shadow-lift transition-all animate-fade-up"
                style={{ animationDelay: `${i * 35}ms` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: cat.color + '22', border: `2px solid ${cat.color}35` }}>
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{cat.name}</p>
                  <p className="text-[10px] text-ink/35 font-medium uppercase tracking-wide mt-0.5">
                    {cat.isDefault ? t('default') : t('custom')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(cat)} aria-label={t('Edit category')}
                    className="w-7 h-7 rounded-lg hover:bg-paper-mist flex items-center justify-center transition-all text-ink/30 hover:text-ink/70">
                    <Pencil size={13} />
                  </button>
                  {!cat.isDefault && (
                    <button onClick={() => remove.mutate(cat._id)} disabled={remove.isPending} aria-label={t('Delete category')}
                      className="sm:opacity-0 sm:group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all text-ink/30">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="🏷️" title={t('noCategories')} subtitle={t('createCategory')} />
        )}
      </div>

      <Modal open={modal} onClose={closeModal} title={editing ? t('editCategory') : t('newCategory')}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">{t('name')} *</label>
            <input {...register('name', {
              required: t('Name is required'),
              validate: (v) => v.trim().length > 0 || t('Name is required'),
            })}
              placeholder={`${t('e.g.')} ${t('groceries')}`} className="input" autoFocus />
            {errors.name && <p className="text-xs text-terra mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">{t('icon')}</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => (
              <button key={ic} type="button" onClick={() => setSelIcon(ic)} aria-label={t('Select icon {{icon}}', { icon: ic })}
                  className={cx('w-9 h-9 rounded-xl text-lg transition-all', selIcon === ic ? 'bg-ink text-white scale-105 shadow-sm' : 'bg-paper-mist hover:bg-paper-mist2')}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{t('color')}</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setSelColor(c)} aria-label={t('Select color {{color}}', { color: c })}
                  className={cx('w-7 h-7 rounded-full transition-all', selColor === c ? 'scale-125 ring-2 ring-offset-2 ring-ink/20' : 'hover:scale-110')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 bg-paper-mist rounded-xl p-3 border border-paper-mist2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: selColor + '25', border: `2px solid ${selColor}40` }}>
              {selIcon}
            </div>
            <div>
              <p className="text-sm font-semibold">{nameVal || t('categoryName')}</p>
              <p className="text-xs text-ink/40 capitalize">{t(formType === 'income' ? 'IncomeCategory' : 'ExpenseCategory')}</p>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Spinner /> : editing ? <>{t('Save Changes')}</> : <><Plus size={14} /> {t('createCategory')}</>}
          </button>
        </form>
      </Modal>
    </div>
  );
}
