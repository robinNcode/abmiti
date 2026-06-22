import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useParseSms, useCreateEntry, useCategories, useCreateCategory } from '@/hooks';
import { SmsParseResult, PaymentSource, EntryType } from '@/types';
import { Spinner, Modal } from '@/components/ui';
import { sourceLabel, cx } from '@/utils';

interface Props { 
  onSuccess?: () => void; 
  type?: EntryType;
}

export default function SmsEntryForm({ onSuccess, type }: Props) {
  const [parsed, setParsed] = useState<SmsParseResult | null>(null);
  const [showSms, setShowSms] = useState(true);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🏷️');
  const [newCatColor, setNewCatColor] = useState('#BF6046');

  const parseSms  = useParseSms();
  const createEntry = useCreateEntry();
  const createCategory = useCreateCategory();
  const { data: categories = [] } = useCategories(type);

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: { sms: '', amount: '', note: '', categoryId: '', date: '', source: 'bank' as PaymentSource },
  });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const newCat = await createCategory.mutateAsync({
        name: newCatName.trim(),
        icon: newCatIcon,
        color: newCatColor,
        type: (type || 'income') === 'investment' ? 'expense' : (type || 'income') as 'income' | 'expense',
      });
      setValue('categoryId', newCat._id);
      setShowAddCat(false);
      setNewCatName('');
    } catch (err) {
      // toast is already handled by hook
    }
  };

  const onParse = async () => {
    const sms = watch('sms');
    if (!sms.trim()) return;
    const result = await parseSms.mutateAsync(sms);
    setParsed(result);
    if (result.amount)    setValue('amount', String(result.amount));
    if (result.date)      setValue('date', result.date);
    if (result.source)    setValue('source', result.source);
    if (result.reference) setValue('note', result.reference);
    setShowSms(false);
  };

  const onSubmit = handleSubmit(async (data) => {
    await createEntry.mutateAsync({
      type: type || 'income',
      amount: parseFloat(data.amount),
      note: data.note,
      categoryId: data.categoryId || categories[0]?._id,
      source: data.source as PaymentSource,
      date: data.date || new Date().toISOString().split('T')[0],
      parsedFromSms: !!parsed,
      rawSms: parsed ? watch('sms') : undefined,
    });
    reset(); setParsed(null); setShowSms(true);
    onSuccess?.();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* SMS Section */}
      <div>
        <button type="button" onClick={() => setShowSms(!showSms)}
          className="flex items-center justify-between w-full text-left mb-2">
          <span className="label mb-0">Paste Bank / bKash / Nagad SMS</span>
          {showSms ? <ChevronUp size={14} className="text-ink/40" /> : <ChevronDown size={14} className="text-ink/40" />}
        </button>

        {showSms && (
          <div className="space-y-2 animate-fade-in">
            <textarea {...register('sms')} rows={4}
              placeholder={'BANK ASIA BDT- ***** Credited to A/C# 108*****493 on: 09/03/2026...\n\nor bKash / Nagad message...'}
              className="input resize-none text-xs leading-relaxed font-mono" />
            <button type="button" onClick={onParse}
              disabled={parseSms.isPending}
              className="btn-sage w-full gap-2">
              {parseSms.isPending ? <Spinner /> : <Zap size={14} />}
              Parse Message
            </button>
          </div>
        )}

        {/* Parsed preview */}
        {parsed && (
          <div className="mt-2 bg-sage/8 border border-sage/20 rounded-xl p-3 text-xs space-y-1.5 animate-fade-in">
            <p className="font-semibold text-sage text-xs uppercase tracking-wider mb-2">✓ Parsed Successfully</p>
            {[
              ['Amount',    parsed.amount ? `৳${parsed.amount.toLocaleString()}` : '—'],
              ['Source',    parsed.bank ?? parsed.source],
              ['Date',      parsed.date ?? '—'],
              ['Reference', parsed.reference ?? '—'],
              ['Confidence', parsed.confidence],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-ink/50">{k}</span>
                <span className="font-semibold capitalize">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-paper-mist2 pt-4 space-y-3">
        <p className="label">Entry Details</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount (BDT) *</label>
            <input {...register('amount', { required: true })} type="number" step="0.01" min="0.01"
              placeholder="0" className="input" />
          </div>
          <div>
            <label className="label">Date</label>
            <input {...register('date')} type="date"
              defaultValue={new Date().toISOString().split('T')[0]} className="input" />
          </div>
        </div>

        <div>
          <label className="label">Note / Description</label>
          <input {...register('note')} placeholder="Salary, freelance payment..." className="input" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category *</label>
            <div className="flex gap-2">
              <select {...register('categoryId')} className="input flex-1">
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowAddCat(true)}
                className="w-11 h-11 border border-paper-mist2 bg-paper-mist hover:border-terra/40 text-ink/70 flex items-center justify-center rounded-xl text-lg font-bold">
                ＋
              </button>
            </div>

            <Modal open={showAddCat} onClose={() => setShowAddCat(false)} title="Create New Category">
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="label">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Subscriptions, Gifts"
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="label">Select Icon</label>
                  <div className="grid grid-cols-6 gap-2">
                    {['🏷️', '🍔', '🚗', '🏠', '🎮', '🏥', '🎓', '✈️', '🛒', '💰', '📈', '🎁'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCatIcon(emoji)}
                        className={cx(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xl border transition-all",
                          newCatIcon === emoji ? "border-terra bg-terra/10 shadow-sm" : "border-paper-mist2 hover:bg-paper-mist"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Select Color</label>
                  <div className="flex flex-wrap gap-2">
                    {['#BF6046', '#2E7D32', '#1565C0', '#E65100', '#6A1B9A', '#F57F17', '#37474F'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        className={cx(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          newCatColor === color ? "border-ink scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createCategory.isPending}
                  className={cx('btn-primary w-full mt-2', createCategory.isPending && 'opacity-70')}
                >
                  {createCategory.isPending ? <Spinner /> : 'Create Category'}
                </button>
              </form>
            </Modal>
          </div>
          <div>
            <label className="label">Source</label>
            <select {...register('source')} className="input">
              {(Object.entries(sourceLabel) as [PaymentSource, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button type="submit" disabled={createEntry.isPending}
        className={cx('btn-sage w-full', createEntry.isPending && 'opacity-70')}>
        {createEntry.isPending ? <Spinner /> : 
          type === 'income' ? '+ Add Income' :
          type === 'savings' ? '💰 Add Savings' :
          type === 'receivable' ? '📥 Add Receivable' :
          '+ Add Entry'
        }
      </button>
    </form>
  );
}
