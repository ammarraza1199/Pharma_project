import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  navigateTo,
  setAuthMode,
  loginUser,
  registerUser,
  switchActivePharmacist
} from '../store/posSlice';
import { Store, Lock, Mail, UserCheck, ArrowLeft, ShieldCheck, ArrowRight, Building, AlertCircle, CheckCircle, KeyRound, X, Check, Send, ExternalLink, RefreshCw, Loader2, Users, Siren } from 'lucide-react';

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
  const pharmacists = useSelector((state: RootState) => state.pos.pharmacists);
  const activePharmacistId = useSelector((state: RootState) => state.pos.activePharmacistId);

  // Sign In Form State — empty by default, user must type credentials
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [selectedCounterId, setSelectedCounterId] = useState<string>(activePharmacistId || 'pharm-1');

  // Sign Up Form State
  const [regPharmacistName, setRegPharmacistName] = useState<string>('');
  const [regPharmacyName, setRegPharmacyName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regSuccess, setRegSuccess] = useState<boolean>(false);
  const [signUpNotice, setSignUpNotice] = useState<string>('');
  const [signUpError, setSignUpError] = useState<string>('');

  // Forgot / Reset Password Multi-Step Modal State
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<'REQUEST_EMAIL' | 'SENDING' | 'LINK_SENT' | 'RESET_PASSWORD'>('REQUEST_EMAIL');
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [targetAccountName, setTargetAccountName] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState<string>('');
  const [forgotError, setForgotError] = useState<string>('');

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
      // ✅ Correct credentials — check if Emergency Desk was selected
      const isEmergencyDesk = selectedCounterId === 'emergency-desk';

      dispatch(loginUser({
        email: match.email,
        password: match.password,
        pharmacistName: isEmergencyDesk ? 'Dr. S. Reddy (Chief Emergency)' : match.pharmacistName,
        pharmacyName: match.pharmacyName
      }));

      if (isEmergencyDesk) {
        // Route directly to Emergency page
        dispatch(navigateTo('EMERGENCY_DELIVERY'));
      } else {
        dispatch(switchActivePharmacist(selectedCounterId));
      }
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
    setSignUpError('');

    const name = regPharmacistName.trim();
    const store = regPharmacyName.trim();
    const email = regEmail.trim();
    const password = regPassword.trim();

    // Strictly verify that all 4 details are entered
    if (!name || !store || !email || !password) {
      setSignUpError('All 4 details (Pharmacist Name, Store Name, Email, and Password) are required to create an account.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setSignUpError('Please enter a valid email address.');
      return;
    }

    // Check if email is already registered
    const emailExists = registeredAccounts.find(
      acc => acc.email.toLowerCase().trim() === email.toLowerCase()
    );
    if (emailExists) {
      setSignUpError(`An account with email "${email}" already exists. Please Sign In instead.`);
      return;
    }

    // Save new account to the registered accounts store
    const newAccount: RegisteredAccount = {
      pharmacistName: name,
      pharmacyName: store,
      email: email,
      password: password
    };
    registeredAccounts.push(newAccount);

    setRegSuccess(true);
    // Redirect to Sign In mode and ask for credentials
    setTimeout(() => {
      setLoginEmail(email);
      setLoginPassword('');
      setLoginError('');
      setSignUpNotice(`Account created successfully for ${store}! Please enter your password to sign in.`);
      dispatch(setAuthMode('SIGN_IN'));
      setRegSuccess(false);
      setRegPharmacistName('');
      setRegPharmacyName('');
      setRegEmail('');
      setRegPassword('');
      setSignUpError('');
    }, 1200);
  };

  const openForgotPasswordModal = () => {
    setForgotEmail(loginEmail || 'navyasri@genquantaa.com');
    setForgotStep('REQUEST_EMAIL');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setShowForgotPasswordModal(true);
  };

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    const email = forgotEmail.trim();
    if (!email) {
      setForgotError('Please enter your registered Gmail or email address.');
      return;
    }

    const account = registeredAccounts.find(
      acc => acc.email.toLowerCase().trim() === email.toLowerCase()
    );

    if (!account) {
      setForgotError(`No registered pharmacy account found for "${email}". Please check your email or Sign Up.`);
      return;
    }

    setTargetAccountName(`${account.pharmacistName} (${account.pharmacyName})`);
    const token = 'rst_tok_' + Math.random().toString(36).substring(2, 10);
    setResetToken(token);

    setForgotStep('SENDING');
    setTimeout(() => {
      setForgotStep('LINK_SENT');
    }, 800);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    const newPass = forgotNewPassword.trim();
    const confirmPass = forgotConfirmPassword.trim();

    if (!newPass || !confirmPass) {
      setForgotError('Please fill out all required fields.');
      return;
    }

    if (newPass !== confirmPass) {
      setForgotError('New Password and Confirm Password do not match.');
      return;
    }

    const account = registeredAccounts.find(
      acc => acc.email.toLowerCase().trim() === forgotEmail.toLowerCase().trim()
    );

    if (!account) {
      setForgotError(`Account error. Please try again.`);
      return;
    }

    // Update password for registered account
    account.password = newPass;

    setSignUpNotice(`Password updated successfully for ${account.email}! Please sign in with your new password.`);
    setLoginEmail(account.email);
    setLoginPassword('');
    setLoginError('');

    // Reset modal state
    setShowForgotPasswordModal(false);
    setForgotStep('REQUEST_EMAIL');
    setForgotEmail('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
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
              onClick={() => { dispatch(setAuthMode('SIGN_IN')); setSignUpNotice(''); setSignUpError(''); }}
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
              onClick={() => { dispatch(setAuthMode('SIGN_UP')); setSignUpNotice(''); setSignUpError(''); }}
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
              {/* ✅ Success Notice Banner after sign up */}
              {signUpNotice && (
                <div className="flex items-start space-x-2 bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-800 animate-fadeIn">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold leading-snug">{signUpNotice}</span>
                </div>
              )}

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

              {/* Workstation / Shift Counter Selection */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>My Shift Counter / Workstation</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Auto-assigns shift</span>
                </label>

                {/* Billing Counter Cards */}
                <div className="grid grid-cols-3 gap-2">
                  {pharmacists.map((pharm) => {
                    const isSelected = selectedCounterId === pharm.id;
                    return (
                      <button
                        key={pharm.id}
                        type="button"
                        onClick={() => setSelectedCounterId(pharm.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase text-emerald-700">
                            C-{pharm.counterNumber}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                        <div className="text-xs font-bold truncate">{pharm.name}</div>
                        <div className="text-[9px] text-slate-400 truncate">{pharm.role}</div>
                      </button>
                    );
                  })}
                </div>

                {/* ── Emergency Desk Sign-In Card ── */}
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Or</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCounterId('emergency-desk')}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      selectedCounterId === 'emergency-desk'
                        ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-950 shadow-sm'
                        : 'bg-white border-rose-200 hover:border-rose-400 hover:bg-rose-50/40 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          selectedCounterId === 'emergency-desk' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700'
                        }`}>
                          <Siren className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-slate-900">Dr. S. Reddy</span>
                            <span className="text-[9px] font-black uppercase bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">SOS / Chief</span>
                          </div>
                          <div className="text-[9px] text-slate-500 font-medium">Chief Emergency Pharmacist · Reg: TG-PH-99214</div>
                          <div className="text-[9px] text-rose-600 font-bold mt-0.5">🚨 Routes directly to Emergency Desk</div>
                        </div>
                      </div>
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        selectedCounterId === 'emergency-desk' ? 'bg-rose-600 ring-2 ring-rose-300' : 'bg-slate-200'
                      }`} />
                    </div>
                  </button>
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
                  onClick={openForgotPasswordModal}
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
                <span>Sign In to POS Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </form>
          ) : (
            /* Option 2: Sign Up Form */
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              {/* ❌ Sign Up Validation Error Banner */}
              {signUpError && (
                <div className="flex items-start space-x-2 bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-800 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold leading-snug">{signUpError}</span>
                </div>
              )}

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
                    onChange={(e) => { setRegPharmacistName(e.target.value); setSignUpError(''); }}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="Pharmacist"
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
                    onChange={(e) => { setRegPharmacyName(e.target.value); setSignUpError(''); }}
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
                    onChange={(e) => { setRegEmail(e.target.value); setSignUpError(''); }}
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
                    onChange={(e) => { setRegPassword(e.target.value); setSignUpError(''); }}
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
                  <span className="font-bold">Account created successfully! Redirecting to Sign In…</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              )}
            </form>
          )}
        </div>
      </div>

      {/* ── FORGOT / RESET PASSWORD MODAL ────────────────────────────── */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                <KeyRound className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-heading">
                  {forgotStep === 'RESET_PASSWORD' ? 'Set New Account Password' : 'Reset Account Password'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {forgotStep === 'REQUEST_EMAIL' && 'Enter your registered Gmail address to receive a secure reset link'}
                  {forgotStep === 'SENDING' && 'Dispatching secure email reset link…'}
                  {forgotStep === 'LINK_SENT' && 'Password reset link sent to your registered Gmail address'}
                  {forgotStep === 'RESET_PASSWORD' && `Updating password for ${forgotEmail}`}
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 flex items-start space-x-2 bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-800 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="font-semibold leading-snug">{forgotError}</span>
              </div>
            )}

            {/* STEP 1: REQUEST REGISTERED GMAIL */}
            {forgotStep === 'REQUEST_EMAIL' && (
              <form onSubmit={handleSendResetLink} className="space-y-3.5 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 mb-1">Registered Gmail / Pharmacy Email *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => { setForgotEmail(e.target.value); setForgotError(''); }}
                      placeholder="e.g. navyasri@genquantaa.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal mt-1">
                    We will send a secure one-time password reset link to this email address.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5 active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Password Reset Link</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: SENDING LOADER */}
            {forgotStep === 'SENDING' && (
              <div className="py-8 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-700">Dispatching password reset link to {forgotEmail}…</p>
              </div>
            )}

            {/* STEP 3: LINK DISPATCHED / SIMULATED EMAIL INBOX */}
            {forgotStep === 'LINK_SENT' && (
              <div className="space-y-4 text-xs">
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex items-start space-x-3 text-emerald-900">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-xs">Password Reset Link Dispatched!</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Reset link generated and sent to <strong>{forgotEmail}</strong> for account <strong>{targetAccountName}</strong>.
                    </p>
                  </div>
                </div>

                {/* Simulated Email Card */}
                <div className="bg-slate-900 text-slate-100 border border-slate-700 rounded-2xl p-4 space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-emerald-400" />
                      <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-300">Email Received in Inbox</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Just Now</span>
                  </div>

                  <div className="text-[11px] space-y-0.5 font-mono text-slate-300">
                    <p><span className="text-slate-500">From:</span> no-reply@genquantaa.com</p>
                    <p><span className="text-slate-500">To:</span> {forgotEmail}</p>
                    <p><span className="text-slate-500">Subject:</span> Password Reset Request - GENQUANTAA POS</p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-[11px] text-slate-300">
                    <p>Hello <strong>{targetAccountName}</strong>,</p>
                    <p className="text-[11px]">Click the link below to set a new password for your pharmacy account:</p>

                    <button
                      type="button"
                      onClick={() => setForgotStep('RESET_PASSWORD')}
                      className="w-full mt-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-md transition-all active:scale-95 text-xs"
                    >
                      <span>🔗 https://pos.genquantaa.com/reset-password?token={resetToken}</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setForgotStep('REQUEST_EMAIL')}
                    className="text-slate-500 hover:text-slate-800 font-semibold underline flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Change Email or Resend Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: RESET PASSWORD FORM */}
            {forgotStep === 'RESET_PASSWORD' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs font-semibold">
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-[11px] text-indigo-900">
                  <p>Resetting password for: <strong>{forgotEmail}</strong></p>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">New Password *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={forgotNewPassword}
                      onChange={e => { setForgotNewPassword(e.target.value); setForgotError(''); }}
                      placeholder="Set new password"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Confirm New Password *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={forgotConfirmPassword}
                      onChange={e => { setForgotConfirmPassword(e.target.value); setForgotError(''); }}
                      placeholder="Re-enter new password"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('LINK_SENT')}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Back to Link
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5 active:scale-95 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save New Password &amp; Sign In</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
