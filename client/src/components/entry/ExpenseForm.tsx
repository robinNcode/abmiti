import { useForm } from 'react-hook-form';
import { useCreateEntry, useCategories } from '@/hooks';
import { PaymentSource } from '@/types';
import { Spinner } from '@/components/ui';
import { sourceLabel, cx } from '@/utils';

const EXPENSE_CATS = ['🏠','🍔','🚌','💡','🎓','🏥','🛍️','🎬','✈️','💳','📦'];

interface Props { onSuccess?: () => void; }

export default function ExpenseForm({ onSuccess }: Props) {
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      amount: '', note: '', categoryId: '',
      source: 'cash' as PaymentSource,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createEntry = useCreateEntry();
  const { data: categories = [] } = useCategories('expense');
  const selectedCat = watch('categoryId');

  const onSubmit = handleSubmit(async (data) => {
    await createEntry.mutateAsync({
      type: 'expense',
      amount: parseFloat(data.amount),
      note: data.note,
      categoryId: data.categoryId || categories[0]?._id,
      source: data.source,
      date: data.date,
    });
    reset({
      amount: '', note: '', categoryId: '',
      source: 'cash',
      date: new Date().toISOString().split('T')[0],
    });
    onSuccess?.();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Category grid */}
      <div>
        <label className="label">Category</label>
        <div className="grid grid-cols-4 gap-1.5">
          {categories.map((cat) => (
            <button key={cat._id} type="button"
              onClick={() => setValue('categoryId', cat._id)}
              className={cx(
                'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-semibold transition-all duration-150',
                selectedCat === cat._id
                  ? 'bg-terra text-white border-terra shadow-sm scale-95'
                  : 'border-paper-mist2 bg-paper-mist hover:border-terra/40 text-ink/70',
              )}>
              <span className="text-lg leading-none">{cat.icon}</span>
              <span className="truncate w-full text-center text-[10px]">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount (BDT) *</label>
          <input {...register('amount', { required: true })} type="number" step="0.01" min="0.01"
            placeholder="0" className="input" />
        </div>
        <div>
          <label className="label">Date</label>
          <input {...register('date')} type="date" className="input" />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <input {...register('note')} placeholder="House rent, groceries..." className="input" />
      </div>

      <div>
        <label className="label">Paid Via</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.entries(sourceLabel) as [PaymentSource, string][]).slice(0, 6).map(([v, l]) => (
            <button key={v} type="button"
              onClick={() => setValue('source', v)}
              className={cx(
                'py-2 px-1 rounded-lg border text-xs font-medium transition-all',
                watch('source') === v
                  ? 'bg-ink text-white border-ink'
                  : 'border-paper-mist2 hover:bg-paper-mist text-ink/60',
              )}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={createEntry.isPending}
        className={cx('btn-primary w-full mt-1', createEntry.isPending && 'opacity-70')}>
        {createEntry.isPending ? <Spinner /> : '− Add Expense'}
      </button>
    </form>
  );
}
