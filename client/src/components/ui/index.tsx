import { Filter, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cx } from '@/utils';
import { useTranslation } from 'react-i18next';

// ── Spinner ──────────────────────────────────────────────────
export const Spinner = ({ className }: { className?: string }) => (
  <div className={cx('inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin', className)} />
);

// ── Page header ──────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) => (
  <div className="flex items-start justify-between px-4 md:px-8 pt-8 pb-6">
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-ink/50 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ── Summary card ─────────────────────────────────────────────
interface SummaryCardProps {
  label: string; labelBn: string; value: string;
  sub?: string; accent: 'income' | 'expense' | 'savings'; icon: string;
}
export const SummaryCard = ({ label, labelBn, value, sub, accent, icon }: SummaryCardProps) => {
  const { i18n } = useTranslation();
  const colors = {
    income:  { bg: 'bg-sage/8',   text: 'text-sage',  border: 'border-sage/20'  },
    expense: { bg: 'bg-terra/8',  text: 'text-terra', border: 'border-terra/20' },
    savings: { bg: 'bg-blue-50',  text: 'text-blue-600', border: 'border-blue-100' },
  }[accent];

  return (
    <div className={cx('card p-5 border', colors.border)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">{i18n.language === 'bn' ? labelBn : label}</p>
        </div>
        <div className={cx('w-9 h-9 rounded-xl flex items-center justify-center text-lg', colors.bg)}>
          {icon}
        </div>
      </div>
      <p className={cx('font-display text-2xl font-bold tracking-tight', colors.text)}>{value}</p>
      {sub && <p className="text-xs text-ink/40 mt-1">{sub}</p>}
    </div>
  );
};

// ── Compact filter panel ─────────────────────────────────────
export const FilterPanel = ({ title, onClose, onSubmit, onReset, children, applyLabel, resetLabel, inline = false }: {
  title: string; onClose?: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; onReset?: () => void;
  children: React.ReactNode; applyLabel?: string; resetLabel?: string; inline?: boolean;
}) => (
  <div className="card animate-fade-in border-paper-mist2 bg-[#f3efe8] p-4 shadow-none">
    <div className="flex items-center justify-between mb-3">
      <p className="font-display font-bold text-base text-ink">{title}</p>
      {onClose && (
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-paper-mist flex items-center justify-center transition-colors" aria-label="Close">
          <X size={16} />
        </button>
      )}
    </div>

    <form onSubmit={onSubmit} className={inline ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.15fr_1.15fr_1fr_1.35fr_1fr_1fr_1.45fr] lg:items-start' : 'space-y-4'}>
      {children}
      <div className={cx('flex items-end gap-2', inline ? 'h-full lg:pb-0' : 'pt-2')}>
        <button type="submit" className="btn-primary flex-1 min-h-[46px] whitespace-nowrap">
          <Filter size={14} />
          {applyLabel || 'Apply Filters'}
        </button>
        {onReset && (
          <button type="button" onClick={onReset} className="btn-ghost px-3 min-h-[46px] whitespace-nowrap">
            {resetLabel || 'Reset'}
          </button>
        )}
      </div>
    </form>
  </div>
);

// ── Empty state ──────────────────────────────────────────────
export const EmptyState = ({ icon, title, subtitle }: {
  icon: string; title: string; subtitle?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-4xl mb-3 opacity-40">{icon}</div>
    <p className="font-display text-base font-semibold text-ink/40">{title}</p>
    {subtitle && <p className="text-xs text-ink/30 mt-1">{subtitle}</p>}
  </div>
);

// ── Modal ────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) => {
  const { t } = useTranslation();
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-md shadow-lift animate-fade-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-mist2">
          <h2 className="font-display font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-paper-mist flex items-center justify-center transition-colors" aria-label={t('Close')}>
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

// ── Entry badge ──────────────────────────────────────────────
export const TypeBadge = ({ type }: { type: 'income' | 'expense' }) => {
  const { t } = useTranslation();
  return type === 'income'
    ? <span className="badge-income">↑ {t('income')}</span>
    : <span className="badge-expense">↓ {t('expense')}</span>;
};

export * from './UserAvatar';
export * from './AdSense';
