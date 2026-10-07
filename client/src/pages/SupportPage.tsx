import { useEffect, useMemo, useState } from 'react';
import { Coffee, Sparkles, Calendar, HeartHandshake, Check, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { siteApi } from '@/api/site.api';
import { PageHeader, EmptyState, Spinner } from '@/components/ui';
import { cx } from '@/utils';

type PlanId = 'coffee' | 'monthly' | 'annual';

interface Subscription {
  _id?: string;
  id?: string;
  plan: string;
  status: string;
  expiresAt?: string;
  expires_at?: string;
  startsAt?: string;
  starts_at?: string;
}

const PLANS: {
  id: PlanId;
  icon: typeof Coffee;
  titleKey: string;
  descKey: string;
  price: string;
  periodKey?: string;
  features: string[];
  highlight?: boolean;
}[] = [
  {
    id: 'coffee',
    icon: Coffee,
    titleKey: 'planCoffeeTitle',
    descKey: 'planCoffeeDesc',
    price: '৳100',
    features: ['planCoffeeF1', 'planCoffeeF2'],
  },
  {
    id: 'monthly',
    icon: Calendar,
    titleKey: 'planMonthlyTitle',
    descKey: 'planMonthlyDesc',
    price: '৳299',
    periodKey: 'perMonth',
    features: ['planMonthlyF1', 'planMonthlyF2', 'planMonthlyF3'],
  },
  {
    id: 'annual',
    icon: Sparkles,
    titleKey: 'planAnnualTitle',
    descKey: 'planAnnualDesc',
    price: '৳2,999',
    periodKey: 'perYear',
    features: ['planAnnualF1', 'planAnnualF2', 'planAnnualF3'],
    highlight: true,
  },
];

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === 'active') return 'bg-sage/10 text-sage';
  if (s === 'expired' || s === 'cancelled') return 'bg-terra/10 text-terra';
  return 'bg-mustard/10 text-mustard-dark';
}

export default function SupportPage() {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<PlanId | null>(null);

  useEffect(() => {
    siteApi.subscriptions()
      .then((data) => setSubscriptions(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));

    const status = new URLSearchParams(window.location.search).get('payment');
    if (status === 'success') toast.success(t('paymentReceived'));
    if (status === 'failed') toast.error(t('paymentFailed'));
  }, [t]);

  const buy = async (plan: PlanId) => {
    setPaying(plan);
    try {
      const { redirectUrl } = await siteApi.startPayment(plan);
      window.location.assign(redirectUrl);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('paymentStartError'));
      setPaying(null);
    }
  };

  const sorted = useMemo(
    () => [...subscriptions].sort((a, b) => {
      const da = new Date(a.expiresAt ?? a.expires_at ?? 0).getTime();
      const db = new Date(b.expiresAt ?? b.expires_at ?? 0).getTime();
      return db - da;
    }),
    [subscriptions],
  );

  return (
    <div className="min-h-full">
      <PageHeader
        title={t('supportTitle')}
        subtitle={t('supportSubtitle')}
      />

      <div className="px-4 md:px-8 pb-12 space-y-8 max-w-5xl">
        <section className="card p-5 md:p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="w-12 h-12 rounded-2xl bg-terra/10 text-terra flex items-center justify-center shrink-0">
            <HeartHandshake size={22} />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-ink">{t('supportIntroTitle')}</h2>
            <p className="text-sm text-ink/55 mt-1 leading-relaxed">{t('supportIntroBody')}</p>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display font-bold text-xl text-ink">{t('choosePlan')}</h2>
              <p className="text-sm text-ink/45 mt-0.5">{t('choosePlanSubtitle')}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const busy = paying === plan.id;
              return (
                <article
                  key={plan.id}
                  className={cx(
                    'relative flex flex-col rounded-2xl border bg-white p-6 shadow-card transition-shadow hover:shadow-lift',
                    plan.highlight ? 'border-terra/40 ring-1 ring-terra/15' : 'border-paper-mist2',
                  )}
                >
                  {plan.highlight && (
                    <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-terra text-white text-[10px] font-bold uppercase tracking-wider">
                      {t('bestValue')}
                    </span>
                  )}
                  <div className={cx(
                    'w-11 h-11 rounded-xl flex items-center justify-center mb-4',
                    plan.highlight ? 'bg-terra/10 text-terra' : 'bg-paper-mist text-ink/60',
                  )}>
                    <Icon size={20} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-ink">{t(plan.titleKey)}</h3>
                  <p className="text-sm text-ink/50 mt-1.5 leading-relaxed flex-1">{t(plan.descKey)}</p>
                  <p className="mt-4 font-display text-3xl font-bold text-terra tracking-tight">
                    {plan.price}
                    {plan.periodKey && (
                      <span className="text-sm font-body font-medium text-ink/40 ml-1">{t(plan.periodKey)}</span>
                    )}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((key) => (
                      <li key={key} className="flex items-start gap-2 text-sm text-ink/65">
                        <Check size={14} className="text-sage shrink-0 mt-0.5" />
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={cx('btn-primary w-full mt-6', plan.highlight ? '' : 'bg-ink hover:bg-ink/90')}
                    onClick={() => buy(plan.id)}
                    disabled={paying !== null}
                  >
                    {busy ? <Spinner className="text-white" /> : <CreditCard size={16} />}
                    {busy ? t('redirecting') : t('continueToPayment')}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl text-ink mb-1">{t('yourSubscriptions')}</h2>
          <p className="text-sm text-ink/45 mb-4">{t('yourSubscriptionsSubtitle')}</p>

          {loading ? (
            <div className="card py-12 flex justify-center"><Spinner className="w-6 h-6 text-terra" /></div>
          ) : sorted.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="✦"
                title={t('noSubscriptions')}
                subtitle={t('noSubscriptionsSubtitle')}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((s) => {
                const id = s._id ?? s.id;
                const expires = s.expiresAt ?? s.expires_at;
                return (
                  <article key={id} className="card p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div className="w-10 h-10 rounded-xl bg-sage/10 text-sage flex items-center justify-center shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink capitalize">{s.plan}</p>
                      {expires && (
                        <p className="text-xs text-ink/45 mt-0.5">
                          {t('expiresOn')} {new Date(expires).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className={cx('self-start sm:self-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide', statusBadge(s.status))}>
                      {s.status}
                    </span>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
