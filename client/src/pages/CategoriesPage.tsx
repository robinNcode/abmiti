import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks';
import { PageHeader, Modal, Spinner, EmptyState } from '@/components/ui';
import { EntryType } from '@/types';
import { cx } from '@/utils';

const ICONS = ['🏠','🍔','🚌','💡','🎓','🏥','🛍️','🎬','✈️','💳','📦','💼','💻','🏪','🎁','💰','💵','🌍','🎯','📱'];
const COLORS = ['#c2552a','#4a7c59','#d4973e','#2a6dc2','#9b59b6','#e74c3c','#e67e22','#1abc9c','#16a085','#2980b9','#8e44ad','#c0392b'];

interface FormData { name: string; }

export default function CategoriesPage() {
  const [modal, setModal]       = useState(false);
  const [tab, setTab]           = useState<EntryType>('expense');
  const [selIcon, setSelIcon]   = useState('📦');
  const [selColor, setSelColor] = useState(COLORS[0]);

  const { data: categories = [], isLoading } = useCategories(tab);
  const create = useCreateCategory();
  const remove = useDeleteCategory();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '' },
  });
  const nameVal = watch('name');

  const onSubmit = handleSubmit(async (data) => {
    await create.mutateAsync({ name: data.name, icon: selIcon, color: selColor, type: tab });
    reset(); setSelIcon('📦'); setSelColor(COLORS[0]); setModal(false);
  });

  return (
    <div className="min-h-full">
      <PageHeader
        title="Categories"
        subtitle="Manage your income and expense categories"
        action={
          <button onClick={() => { reset(); setModal(true); }} className="btn-primary text-sm">
            <Plus size={14} /> Add Category
          </button>
        }
      />

      <div className="px-8 pb-10 space-y-4">
        <div className="flex gap-2">
          {(['expense', 'income'] as EntryType[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cx(
                'px-5 py-2 rounded-xl text-sm font-medium border transition-all capitalize',
                tab === t && t === 'expense' ? 'bg-terra text-white border-terra' :
                tab === t && t === 'income'  ? 'bg-sage text-white border-sage' :
                'border-paper-mist2 text-ink/60 hover:bg-paper-mist',
              )}>
              {t === 'income' ? '↑' : '↓'} {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner className="text-terra" /></div>
        ) : categories.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                    {cat.isDefault ? 'Default' : 'Custom'}
                  </p>
                </div>
                {!cat.isDefault && (
                  <button onClick={() => remove.mutate(cat._id)} disabled={remove.isPending}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all text-ink/30 shrink-0">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="🏷️" title="No categories" subtitle="Add your first category" />
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Category">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input {...register('name', { required: 'Name is required' })}
              placeholder="e.g. Groceries" className="input" autoFocus />
            {errors.name && <p className="text-xs text-terra mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => (
                <button key={ic} type="button" onClick={() => setSelIcon(ic)}
                  className={cx('w-9 h-9 rounded-xl text-lg transition-all', selIcon === ic ? 'bg-ink text-white scale-105 shadow-sm' : 'bg-paper-mist hover:bg-paper-mist2')}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setSelColor(c)}
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
              <p className="text-sm font-semibold">{nameVal || 'Category Name'}</p>
              <p className="text-xs text-ink/40 capitalize">{tab} category</p>
            </div>
          </div>
          <button type="submit" disabled={create.isPending} className="btn-primary w-full">
            {create.isPending ? <Spinner /> : <><Plus size={14} /> Create Category</>}
          </button>
        </form>
      </Modal>
    </div>
  );
}
