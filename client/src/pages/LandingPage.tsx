import { Link } from 'react-router-dom';
import { Download, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function LandingPage() {
  const token = useAuthStore((s) => s.accessToken);

  return (
    <div className="min-h-screen bg-paper-mist font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-terra text-white flex items-center justify-center font-bold text-xl shadow-md">
            আ
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-ink">Abmiti</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-ink/70 hover:text-terra font-medium transition-colors">Features</a>
          <a href="#download" className="text-ink/70 hover:text-terra font-medium transition-colors">Download</a>
          <a href="#contact" className="text-ink/70 hover:text-terra font-medium transition-colors">Contact</a>
        </div>
        <div className="flex items-center gap-3">
          {token ? (
            <Link to="/dashboard" className="btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="font-medium text-ink/80 hover:text-terra transition-colors px-4 py-2">
                Login
              </Link>
              <Link to="/register" className="btn-primary hidden sm:inline-flex">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-7xl mx-auto text-center mt-10">
        <h1 className="text-5xl md:text-7xl font-black font-display text-ink tracking-tight leading-tight max-w-4xl mx-auto">
          Master Your Money with <span className="text-terra">Confidence</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-ink/60 max-w-2xl mx-auto leading-relaxed">
          Abmiti is your personal financial companion. Track expenses, monitor budgets, and achieve your financial goals with ease.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {!token && (
            <Link to="/register" className="btn-primary w-full sm:w-auto px-8 py-4 text-base rounded-2xl">
              Get Started for Free <ArrowRight size={18} className="ml-2" />
            </Link>
          )}
          <a href="#download" className="bg-white border border-paper-mist2 text-ink hover:border-terra hover:text-terra font-semibold px-8 py-4 text-base rounded-2xl w-full sm:w-auto flex items-center justify-center gap-2 transition-all shadow-sm">
            <Download size={18} /> Download App
          </a>
        </div>
      </section>

      {/* Features Summary */}
      <section id="features" className="bg-white py-24 border-y border-paper-mist2">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-ink">Everything you need</h2>
            <p className="mt-4 text-ink/60">Simple, intuitive tools to take control of your finances.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-paper-mist border border-paper-mist2">
              <div className="w-12 h-12 rounded-xl bg-sage/20 text-sage flex items-center justify-center text-2xl mb-6">📊</div>
              <h3 className="text-xl font-bold text-ink mb-3">Smart Analytics</h3>
              <p className="text-ink/60 leading-relaxed">Visualize your spending patterns and track your savings rate with beautiful, easy-to-read charts.</p>
            </div>
            <div className="p-8 rounded-3xl bg-paper-mist border border-paper-mist2">
              <div className="w-12 h-12 rounded-xl bg-terra/20 text-terra flex items-center justify-center text-2xl mb-6">💰</div>
              <h3 className="text-xl font-bold text-ink mb-3">Budget Tracking</h3>
              <p className="text-ink/60 leading-relaxed">Set monthly limits and get warned before you overspend. Keep your finances perfectly balanced.</p>
            </div>
            <div className="p-8 rounded-3xl bg-paper-mist border border-paper-mist2">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center text-2xl mb-6">📱</div>
              <h3 className="text-xl font-bold text-ink mb-3">Anywhere Access</h3>
              <p className="text-ink/60 leading-relaxed">Manage your money on the go with our fully responsive web app and upcoming mobile applications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-24 max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-ink mb-6">Get Abmiti Mobile</h2>
        <p className="text-ink/60 max-w-xl mx-auto mb-10">
          Take your financial tracker wherever you go. Download the Android APK directly and start tracking right from your pocket.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/abmiti-release.apk" download className="btn-primary px-8 py-4 rounded-2xl flex items-center gap-3">
            <Download size={20} /> Download APK (Android)
          </a>
        </div>
        <p className="mt-6 text-xs text-ink/40">iOS version coming soon via App Store.</p>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-ink text-white py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <MessageSquare size={48} className="mx-auto text-terra mb-6 opacity-80" />
          <h2 className="text-3xl font-bold font-display mb-6">We'd love your feedback</h2>
          <p className="text-white/60 mb-10">
            Abmiti is actively being improved. If you encounter bugs, have feature requests, or just want to say hi, please reach out!
          </p>
          <form className="space-y-4 max-w-md mx-auto text-left" onSubmit={(e) => { e.preventDefault(); alert('Feedback sent! Thank you.'); }}>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Name</label>
              <input type="text" required className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-terra transition-colors" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Message</label>
              <textarea required rows={4} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-terra transition-colors" placeholder="How can we improve?"></textarea>
            </div>
            <button type="submit" className="w-full bg-terra hover:bg-terra-dark text-white font-bold py-3 px-4 rounded-xl transition-colors">
              Send Feedback
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink border-t border-white/10 py-8 text-center text-white/40 text-sm">
        <p>&copy; {new Date().getFullYear()} Abmiti. All rights reserved.</p>
      </footer>
    </div>
  );
}
