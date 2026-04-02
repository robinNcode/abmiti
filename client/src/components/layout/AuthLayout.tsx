import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-96 shrink-0 flex-col justify-between bg-ink p-10"
        style={{ backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(194,85,42,0.3) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(212,151,62,0.2) 0%, transparent 60%)' }}>
        <div>
          <p className="font-display font-black text-4xl text-terra leading-none">abmiti</p>
          <p className="font-bengali text-base text-mustard mt-1 font-semibold tracking-widest">আয় • বেয় • মিতি</p>
          <p className="text-white/40 text-sm mt-4 font-light leading-relaxed">
            Track your income, expenses<br />and savings — beautifully.
          </p>
        </div>
        <div className="space-y-4">
          {[
            { icon: '↑', label: 'আয়', sub: 'Income from bank, bKash, Nagad' },
            { icon: '↓', label: 'বেয়', sub: 'Categorised expenses' },
            { icon: '◈', label: 'মিতি', sub: 'Savings & analytics' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-mustard font-bold text-sm shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm font-bengali">{item.label}</p>
                <p className="text-white/40 text-xs">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-white/20 text-xs">© {new Date().getFullYear()} abmiti</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
