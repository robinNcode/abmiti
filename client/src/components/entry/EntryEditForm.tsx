import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccounts, useCategories, useUpdateEntry } from '@/hooks';
import { Entry, EntryType, PaymentSource } from '@/types';
import { Spinner } from '@/components/ui';
import { categoryTypeForEntry, cx, sourceLabel } from '@/utils';

const ENTRY_TYPES: EntryType[] = ['income', 'expense', 'investment', 'savings', 'payable', 'receivable'];

interface Props {
  entry: Entry;
  onSuccess?: () => void;
}

/** Edits every user-editable field of an existing entry. */
export default function EntryEditForm({ entry, onSuccess }: Props) {
  const { t } = useTranslation();
  const updateEntry = useUpdateEntry();

  const [type, setType] = useState<EntryType>(entry.type);
  const [amount, setAmount] = useState(String(entry.amount ?? ''));
  const [note, setNote] = useState(entry.note ?? '');
  const [date, setDate] = useState((entry.date ?? '').slice(0, 10));
  const [categoryId, setCategoryId] = useState(entry.category?._id ?? '');
  const [source, setSource] = useState<PaymentSource>(entry.source ?? 'cash');
  const [sector, setSector] = useState(entry.sector ?? '');
  const [accountId, setAccountId] = useState(entry.account?._id ?? '');

  // Entries generated from a payable/receivable stay on their own type.
  const typeLocked = Boolean(entry.payableId);

  const { data: categories = [] } = useCategories(categoryTypeForEntry(type));
  const { data: accounts = [] } = useAccounts();

  const amountValue = parseFloat(amount);
  const canSubmit = !!categoryId && Number.isFinite(amountValue) && amountValue > 0 && !!date;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    await updateEntry.mutateAsync({
      id: entry._id,
      dto: {
        ...(typeLocked ? {} : { type }),
        amount: amountValue,
        note,
        categoryId,
        source,
        date,
        ...(type === 'investment' ? { sector } : {}),
        ...(type === 'savings' ? { accountId } : {}),
      },
    });

    onSuccess?.();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="label">{t('Type')}</label>
        <div className="grid grid-cols-3 gap-1.5">
          {ENTRY_TYPES.map((value) => (
            <button
              key={value}
              type="button"
              disabled={typeLocked && value !== type}
              onClick={() => {
                setType(value);
                if (value !== type) setCategoryId('');
              }}
              className={cx(
                'py-2 px-1 rounded-lg border text-xs font-semibold capitalize transition-all',
                type === value
                  ? 'bg-ink text-white border-ink'
                  : 'border-paper-mist2 hover:bg-paper-mist text-ink/60',
                typeLocked && value !== type && 'opacity-30 cursor-not-allowed',
              )}
            >
              {t(value)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{t('category')} *</label>
        <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => setCategoryId(cat._id)}
              className={cx(
                'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-semibold transition-all duration-150',
                categoryId === cat._id
                  ? 'bg-terra text-white border-terra shadow-sm scale-95'
                  : 'border-paper-mist2 bg-paper-mist hover:border-terra/40 text-ink/70',
              )}
            >
              <span className="text-lg leading-none">{cat.icon}</span>
              <span className="truncate w-full text-center text-[10px]">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('Amount (BDT) *')}</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">{t('date')}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </div>
      </div>

      <div>
        <label className="label">{t('Description')}</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          placeholder={t('House rent, groceries...')}
          className="input"
        />
      </div>

      {type === 'investment' && (
        <div>
          <label className="label">{t('Sector')}</label>
          <input value={sector} onChange={(e) => setSector(e.target.value)} placeholder={t('Stock, Real estate, Crypto...')} className="input" />
        </div>
      )}

      <div>
        <label className="label">{t('Paid Via')}</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(sourceLabel) as PaymentSource[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSource(value)}
              className={cx(
                'py-2 px-1 rounded-lg border text-xs font-medium transition-all',
                source === value
                  ? 'bg-ink text-white border-ink'
                  : 'border-paper-mist2 hover:bg-paper-mist text-ink/60',
              )}
            >
              {t(value)}
            </button>
          ))}
        </div>
      </div>

      {type === 'savings' && (
        <div>
          <label className="label">{t('account')}</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="input">
            <option value="">{accounts.length ? t('— Select account —') : t('No accounts available')}</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.name} ({acc.balance} BDT)
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={updateEntry.isPending || !canSubmit}
        className={cx('btn-primary w-full mt-1', (updateEntry.isPending || !canSubmit) && 'opacity-70')}
      >
        {updateEntry.isPending ? <Spinner /> : t('Save changes')}
      </button>
    </form>
  );
}
