import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  navigateTo,
  setAuthMode,
  loginUser,
  registerUser
} from '../store/posSlice';
import { Store, Lock, Mail, UserCheck, ArrowLeft, ShieldCheck, ArrowRight, Building, AlertCircle, CheckCircle } from 'lucide-react';

// --- Registered Accounts Store (simulates backend MongoDB user collection) ---
// When a new user signs up, their credentials are saved here.
interface RegisteredAccount {
  pharmacistName: string;
  pharmacyName: string;
  email: string;
  password: string;
}

const registeredAccounts: RegisteredAccount[] = [
  {
    pharmacistName: 'Navya Sri',
    pharmacyName: 'GENQUANTAA MedPlus Pharmacy',
    email: 'navyasri@genquantaa.com',
    password: 'pharmacy123'
  }
];

export const AuthPage: React.FC = () => {
  const dispatch = useDispatch();
  const authMode = useSelector((state: RootState) => state.pos.authMode);

  // Sign In Form State — empty by default, user must type credentials
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loginAttempts, setLoginAttempts] = useState<number>(0);

  // Sign Up Form State
  const [regPharmacistName, setRegPharmacistName] = useState<string>('');
  const [regPharmacyName, setRegPharmacyName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regSuccess, setRegSuccess] = useState<boolean>(false);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // Validate credentials against the registered accounts store
    const match = registeredAccounts.find(
      acc =>
        acc.email.toLowerCase().trim() === loginEmail.toLowerCase().trim() &&
        acc.password === loginPassword
    );

    if (match) {
      // ✅ Correct credentials — launch POS terminal
      dispatch(loginUser({ email: match.email, password: match.password }));
    } else {
      // ❌ Wrong credentials — show inline error, increment attempt counter
      const attempts = loginAttempts + 1;
      setLoginAttempts(attempts);

      if (!loginEmail.trim()) {
        setLoginError('Please enter your registered email address.');
      } else if (!loginPassword) {
        setLoginError('Please enter your password.');
      } else if (attempts >= 3) {
        setLoginError(`Too many failed attempts (${attempts}). Hint: Default credentials are navyasri@genquantaa.com / pharmacy123`);
      } else {
        setLoginError(`Incorrect email or password. Please check your credentials and try again. (Attempt ${attempts})`);
      }
    }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if email is already registered
    const emailExists = registeredAccounts.find(
      acc => acc.email.toLowerCase().trim() === regEmail.toLowerCase().trim()
    );
    if (emailExists) {
      alert(`An account with email "${regEmail}" already exists. Please Sign In instead.`);
      dispatch(setAuthMode('SIGN_IN'));
      return;
    }

    // Save new account to the registered accounts store
    const newAccount: RegisteredAccount = {
      pharmacistName: regPharmacistName,
      pharmacyName: regPharmacyName,
      email: regEmail,
      password: regPassword
    };
    registeredAccounts.push(newAccount);

    setRegSuccess(true);
    setTimeout(() => {
      dispatch(registerUser({
        pharmacistName: regPharmacistName,
        pharmacyName: regPharmacyName,
        licenseNo: '',
        email: regEmail,
        isLoggedIn: true
      }));
    }, 1200);
  };

  const handleQuickDemoAccess = () => {
    dispatch(loginUser({ email: 'navyasri@genquantaa.com' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans select-none">
      {/* Top Header & Back Button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={() => dispatch(navigateTo('LANDING'))}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-full mb-6 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing Page</span>
        </button>

        <div className="flex items-center justify-center space-x-2">
          <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 font-heading">
            GENQUANTAA POS
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Mission-Critical Pharmacy Terminal Access
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-modal rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
          {/* 2 Options Switcher: Sign In vs Sign Up */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => dispatch(setAuthMode('SIGN_IN'))}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'SIGN_IN'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Already Have Account? (Sign In)
            </button>

            <button
              type="button"
              onClick={() => dispatch(setAuthMode('SIGN_UP'))}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === 'SIGN_UP'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Need Account? (Sign Up)
            </button>
          </div>

          {/* Option 1: Sign In Form */}
          {authMode === 'SIGN_IN' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pharmacy Email / License ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
                    className={`w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-white rounded-xl focus:ring-2 focus:outline-hidden transition-all ${
                      loginError
                        ? 'border-2 border-rose-400 focus:ring-rose-400 bg-rose-50'
                        : 'border border-slate-300 focus:ring-emerald-500'
                    }`}
                    placeholder="navyasri@genquantaa.com"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                    className={`w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-white rounded-xl focus:ring-2 focus:outline-hidden transition-all ${
                      loginError
                        ? 'border-2 border-rose-400 focus:ring-rose-400 bg-rose-50'
                        : 'border border-slate-300 focus:ring-emerald-500'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* ❌ Inline Error Banner — shows on wrong credentials */}
              {loginError && (
                <div className="flex items-start space-x-2 bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-800 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold leading-snug">{loginError}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5" />
                  <span className="text-slate-600 font-medium">Keep terminal active</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('navyasri@genquantaa.com');
                    setLoginPassword('pharmacy123');
                    setLoginError('');
                  }}
                  className="text-emerald-700 hover:underline font-bold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to POS Terminal</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </form>
          ) : (
            /* Option 2: Sign Up Form */
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chief Pharmacist Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regPharmacistName}
                    onChange={(e) => setRegPharmacistName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="Navya Sri"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pharmacy Store Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regPharmacyName}
                    onChange={(e) => setRegPharmacyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="MedPlus Pharmacy"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="navyasri@genquantaa.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Set Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* ✅ Account Created Success State */}
              {regSuccess ? (
                <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 text-xs text-emerald-800">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="font-bold">Account created! Launching POS Terminal…</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Create Account & Launch Terminal</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </form>
          )}

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <button
              onClick={handleQuickDemoAccess}
              className="text-xs text-slate-500 hover:text-emerald-700 font-semibold transition-colors flex items-center justify-center space-x-1 mx-auto cursor-pointer"
            >
              <span>⚡ Quick Demo Access (Sign In as Navya Sri)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
