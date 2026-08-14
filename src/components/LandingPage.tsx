import React from 'react';
import { useDispatch } from 'react-redux';
import { navigateTo, setAuthMode } from '../store/posSlice';
import {
  Store,
  Zap,
  ShieldCheck,
  CreditCard,
  Printer,
  Sparkles,
  ArrowRight,
  UserCheck,
  Lock,
  Activity,
  Layers
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const dispatch = useDispatch();

  const handleSignIn = () => {
    dispatch(setAuthMode('SIGN_IN'));
    dispatch(navigateTo('AUTH'));
  };

  const handleSignUp = () => {
    dispatch(setAuthMode('SIGN_UP'));
    dispatch(navigateTo('AUTH'));
  };

  const handleLaunchDemo = () => {
    dispatch(navigateTo('POS_TERMINAL'));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => dispatch(navigateTo('LANDING'))}>
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-sm flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold font-heading text-slate-900 tracking-tight">GENQUANTAA POS</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Pharmacy Edition
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Mission Critical Billing Software • P0 Priority</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Core Features</a>
            <a href="#compliance" className="hover:text-emerald-600 transition-colors">Drug Safety & Compliance</a>
            <a href="#benchmarks" className="hover:text-emerald-600 transition-colors">Performance Benchmarks</a>
            <a href="#printing" className="hover:text-emerald-600 transition-colors">Thermal Printing</a>
          </nav>

          {/* Action Buttons: Sign In / Sign Up */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSignIn}
              className="text-xs font-bold text-slate-700 hover:text-emerald-700 px-3.5 py-2 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={handleSignUp}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Create Account (Sign Up)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge Pill */}
          <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-1.5 rounded-full mb-6 shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>P0 Mission Critical Pharmacy POS Software</span>
            <span className="h-3 w-[1px] bg-emerald-300"></span>
            <span className="text-emerald-700">Sub-200ms Scan Performance</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight font-heading max-w-4xl mx-auto leading-tight">
            The Heartbeat of Modern Pharmacy Billing & Compliance
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Designed for 200+ transactions a day with zero downtime. Features real-time barcode search, AI drug interaction guardrails, Schedule X narcotic protection, and dynamic Razorpay UPI QR payments.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleSignUp}
              className="w-full sm:w-auto px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Get Started (Sign Up Free)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleSignIn}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-2xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Sign In to Existing Account</span>
            </button>

            <button
              onClick={handleLaunchDemo}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Launch Demo Terminal</span>
            </button>
          </div>

          {/* Live Performance Benchmarks Strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
              <div className="text-2xl font-black text-emerald-700 font-heading">&lt; 200ms</div>
              <div className="text-xs text-slate-500 font-medium">Barcode Scan-to-Cart</div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
              <div className="text-2xl font-black text-emerald-700 font-heading">72+ Hours</div>
              <div className="text-xs text-slate-500 font-medium">Offline Reliability</div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
              <div className="text-2xl font-black text-emerald-700 font-heading">&lt; 3 Sec</div>
              <div className="text-xs text-slate-500 font-medium">Bill Finalize to Print</div>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
              <div className="text-2xl font-black text-rose-600 font-heading">Zero</div>
              <div className="text-xs text-slate-500 font-medium">Downtime Peak Hours</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              Engineered for Pharmacy Excellence
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">
              Every workflow built to eliminate billing delays, prevent drug interaction risks, and automate GST compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
              <div className="bg-emerald-100 text-emerald-700 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 font-heading mb-1">Sub-300ms Barcode Search</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Supports Keyboard Wedge HID barcode scanners and fuzzy phonetic search for misspellings. Real-time stock status badges for In Stock, Low Stock, and Out of Stock.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
              <div className="bg-amber-100 text-amber-700 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 font-heading mb-1">AI Smart Substitutions</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                When an item is out of stock, pops up an instant overlay suggesting top 3 alternative brands with the exact salt composition, ranked by margin % and stock.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
              <div className="bg-rose-100 text-rose-700 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 font-heading mb-1">Schedule X Narcotics Security</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Hard UI security lock for narcotic substances requiring Store Manager 4-digit PIN verification before item addition or bill finalization.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
              <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 font-heading mb-1">Multi-Tab Billing & Bill Hold</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Handle multiple customers at once with tabbed billing sessions (`+ New Customer`) and temporarily park active sessions with customer mobile numbers.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
              <div className="bg-teal-100 text-teal-700 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 font-heading mb-1">Razorpay Dynamic UPI & Split Pay</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Displays dynamic UPI QR with WebSocket polling confirmation. Allows split payment balancing across Cash, UPI, and Card.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
              <div className="bg-purple-100 text-purple-700 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 font-heading mb-1">Thermal & A4 Invoice Printing</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Instant print trigger formatted for 80mm ESC/POS thermal printers and A4 tax invoices including HSN tax breakdown and DL license info.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-white font-bold font-heading">
            <Store className="w-4 h-4 text-emerald-400" />
            <span>GENQUANTAA Point of Sale Platform</span>
          </div>
          <p>© 2026 GENQUANTAA. Built for Navya Sri (Frontend Developer). All Rights Reserved.</p>
          <div className="flex items-center space-x-4">
            <button onClick={handleSignIn} className="hover:text-white transition-colors">Sign In</button>
            <button onClick={handleSignUp} className="hover:text-white transition-colors">Sign Up</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
