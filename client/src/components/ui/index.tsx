import { X } from 'lucide-react';
import { cx } from '@/utils';

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
  const colors = {
    income:  { bg: 'bg-sage/8',   text: 'text-sage',  border: 'border-sage/20'  },
    expense: { bg: 'bg-terra/8',  text: 'text-terra', border: 'border-terra/20' },
    savings: { bg: 'bg-blue-50',  text: 'text-blue-600', border: 'border-blue-100' },
  }[accent];

  return (
    <div className={cx('card p-5 border', colors.border)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">{label}</p>
          <p className="font-bengali text-xs text-ink/30">{labelBn}</p>
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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-lg shadow-lift animate-fade-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-paper-mist2">
          <h2 className="font-display font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-paper-mist flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ── Entry badge ──────────────────────────────────────────────
export const TypeBadge = ({ type }: { type: 'income' | 'expense' }) =>
  type === 'income'
    ? <span className="badge-income">↑ Income</span>
    : <span className="badge-expense">↓ Expense</span>;
