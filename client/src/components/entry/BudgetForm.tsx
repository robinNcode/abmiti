import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useUpsertBudget } from '@/hooks';
import { Spinner } from '@/components/ui';
import { IBudgetInput } from '@/types';
import { cx, SHORT_MONTHS } from '@/utils';

interface Props { 
  onSuccess?: () => void;
  initialData?: IBudgetInput;
}

export default function BudgetForm({ onSuccess, initialData }: Props) {
  const { register, handleSubmit, reset } = useForm<IBudgetInput>({
    defaultValues: initialData || {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amount: 0,
    },
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const upsertBudget = useUpsertBudget();

  const onSubmit = handleSubmit(async (data) => {
    await upsertBudget.mutateAsync({
      month: Number(data.month),
      year: Number(data.year),
      amount: Number(data.amount),
    });
    reset();
    onSuccess?.();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Month</label>
          <select {...register('month')} className="input w-full">
            {SHORT_MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <input {...register('year')} type="number" min="2000" className="input w-full" />
        </div>
      </div>

      <div>
        <label className="label">Budget Amount (BDT) *</label>
        <input {...register('amount', { required: true, min: 0.01 })} type="number" step="0.01" min="0.01"
          placeholder="0" className="input w-full" />
      </div>

      <button type="submit" disabled={upsertBudget.isPending}
        className={cx('btn-primary w-full mt-2', upsertBudget.isPending && 'opacity-70')}>
        {upsertBudget.isPending ? <Spinner /> : 'Save Budget'}
      </button>
    </form>
  );
}
