import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { AlertCircle, AlertTriangle, ArrowUpRight, Calendar, Sparkles } from 'lucide-react';
import { ForecastResult, ForecastWarning } from '@/types';
import { formatBDT } from '@/utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const renderWarning = (w: ForecastWarning, idx: number, t: TFunction) => {
  if (w.code === 'LINE_OVER_ALLOCATION') {
    return (
      <div key={idx} className="flex items-start gap-2 text-xs text-mustard bg-mustard/10 rounded px-2 py-1.5">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <span>
          {t('Historical spend for "{{name}}" exceeds allocation by {{amt}}', {
            name: w.lineName,
            amt: formatBDT(w.amount ?? 0),
          })}
        </span>
      </div>
    );
  }
  if (w.code === 'NET_NEGATIVE') {
    return (
      <div key={idx} className="flex items-start gap-2 text-xs text-terra bg-terra/10 rounded px-2 py-1.5">
        <AlertCircle size={14} className="shrink-0 mt-0.5" />
        <span>{t('Projected net cash flow is negative by {{amt}}', { amt: formatBDT(w.amount ?? 0) })}</span>
      </div>
    );
  }
  if (w.code === 'PAYABLE_DUE_EXCEEDS_BUFFER') {
    return (
      <div key={idx} className="flex items-start gap-2 text-xs text-terra bg-terra/10 rounded px-2 py-1.5">
        <AlertCircle size={14} className="shrink-0 mt-0.5" />
        <span>{t('Committed payables ({{amt}}) exceed net buffer', { amt: formatBDT(w.amount ?? 0) })}</span>
      </div>
    );
  }
  return null;
};

export default function BudgetForecastCard({ forecast }: { forecast?: ForecastResult }) {
  const { t } = useTranslation();

  if (!forecast) return null;

  if (forecast.insufficientHistory) {
    return (
      <div className="card p-4 border border-paper-mist flex items-center gap-3 text-sm text-ink/60">
        <div className="w-8 h-8 rounded-lg bg-sage/10 text-sage flex items-center justify-center shrink-0">
          <Sparkles size={16} />
        </div>
        <div>
          <p className="font-semibold text-ink">{t('Predictive Budget Forecast')}</p>
          <p className="text-xs text-ink/45">
            {t('Requires at least 2 completed months of transaction history to project spending trends.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-sage" />
        <h3 className="font-display font-bold text-base text-ink">{t('3-Month Rolling Forecast')}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecast.months.map((m) => {
          const monthLabel = `${t(MONTH_NAMES[m.month - 1])} ${m.year}`;
          return (
            <div key={`${m.year}-${m.month}`} className="card p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-display font-bold text-sm text-ink">
                    <Calendar size={15} className="text-ink/40" />
                    {monthLabel}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      m.projectedNet >= 0 ? 'bg-sage/15 text-sage' : 'bg-terra/15 text-terra'
                    }`}
                  >
                    {m.projectedNet >= 0 ? '+' : ''}{formatBDT(m.projectedNet)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-ink/45">{t('Proj. Income')}</span>
                    <p className="font-semibold text-ink">{formatBDT(m.projectedIncome)}</p>
                  </div>
                  <div>
                    <span className="text-ink/45">{t('Proj. Spend')}</span>
                    <p className="font-semibold text-terra">{formatBDT(m.projectedSpend)}</p>
                  </div>
                  {m.committedPayables > 0 && (
                    <div className="col-span-2 pt-1 border-t border-paper-mist flex items-center justify-between">
                      <span className="text-ink/45 flex items-center gap-1">
                        <ArrowUpRight size={12} className="text-terra" />
                        {t('Committed Payables')}
                      </span>
                      <span className="font-semibold text-terra">{formatBDT(m.committedPayables)}</span>
                    </div>
                  )}
                </div>
              </div>

              {m.warnings.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-paper-mist">
                  {m.warnings.map((w, idx) => renderWarning(w, idx, t))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
