import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Droplet, Lock, Mail, User, ShieldCheck, Phone, ArrowRight, Sparkles, CheckCircle2, Eye, EyeOff, Waves, Sprout, Scale } from 'lucide-react';
import { AuthUser, UserRole } from '../types';
import { ThreeDWaterBackground } from './ThreeDWaterBackground';

interface AuthViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  apiBase: string;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess, apiBase }) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Interactive 3D card tilt state
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCardTilt({ x: -(y * 7), y: x * 7 });
  };

  const handleCardMouseLeave = () => {
    setCardTilt({ x: 0, y: 0 });
  };

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const regRole: UserRole = 'farmer';
  const [regContact, setRegContact] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      onLoginSuccess({
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        token: data.token
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in. Please check your credentials.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const emailToRegister = regEmail.trim().toLowerCase();
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: emailToRegister,
          password: regPassword.trim(),
          role: regRole,
          contact: regContact.trim() || undefined,
          language: language || 'en'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      // DO NOT navigate immediately to farmer page!
      // Save is committed to database by backend. Switch to Sign In tab, pre-fill email, and display success message.
      setLoginEmail(emailToRegister);
      setLoginPassword('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegContact('');
      setActiveTab('login');
      setSuccessMsg(t('registrationSuccessMsg'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to register account.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Demo Quick Login
  const handleDemoQuickLogin = async (email: string, role: UserRole) => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: role === 'admin' ? 'admin123' : 'password123'
        })
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess({
          user_id: data.user_id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          token: data.token
        });
        return;
      }
    } catch {
      // Fallback local mock login if backend reset needed
    }

    onLoginSuccess({
      user_id: role === 'admin' ? 999 : 1,
      name: role === 'admin' ? 'Panchayat Admin' : 'Ramesh (Farmer)',
      email,
      role,
      token: 'demo-token-123'
    });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f7f4] p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* 3D Interactive Water Canvas Background */}
      <ThreeDWaterBackground />

      {/* Floating 3D Ambient Depth Cards (Desktop) */}
      <div
        className="hidden xl:flex flex-col gap-5 absolute left-12 top-1/2 -translate-y-1/2 max-w-xs z-10 pointer-events-none transition-transform duration-700 ease-out"
        style={{ transform: `translateY(-50%) translate3d(${cardTilt.y * -1.5}px, ${cardTilt.x * -1.5}px, 0)` }}
      >
        {/* <div className="bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-lg space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
            <Waves className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>3D Canal Flow Simulation</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Real-time OR-Tools linear solver ensures fair canal distribution across all farm plots.
          </p>
          <div className="flex items-center space-x-2 pt-1 text-[10px] font-bold text-emerald-700">
            <span className="bg-emerald-100/80 px-2 py-0.5 rounded-full">Flow: 450 L/min</span>
            <span className="bg-blue-100/80 text-blue-800 px-2 py-0.5 rounded-full">Floor: 60%</span>
          </div>
        </div> */}

        {/* <div className="bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-lg space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>Dynamic Crop Urgency</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Prioritizes water at flowering & bulb development stages to safeguard farmer yields.
          </p>
        </div> */}
      </div>

      <div
        className="hidden xl:flex flex-col gap-5 absolute right-12 top-1/2 -translate-y-1/2 max-w-xs z-10 pointer-events-none transition-transform duration-700 ease-out"
        style={{ transform: `translateY(-50%) translate3d(${cardTilt.y * 1.5}px, ${cardTilt.x * 1.5}px, 0)` }}
      >
        {/* <div className="bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-lg space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
            <Scale className="w-4 h-4 text-amber-600" />
            <span>AI Dispute Mediation</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Automated compromise negotiations with transparent mathematical fairness scoring.
          </p>
          <div className="flex items-center space-x-2 pt-1 text-[10px] font-bold text-slate-700">
            <span className="bg-amber-100/80 text-amber-900 px-2 py-0.5 rounded-full">Peaceful Farming</span>
          </div>
        </div>

        <div className="bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-lg space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Panchayat Policy Protected</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            1 water request per 3 days rule enforced transparently across all village accounts.
          </p>
        </div> */}
      </div>

      {/* Main Glassmorphic 3D Card with Tilt */}
      <div
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`,
          transition: 'transform 0.15s ease-out, box-shadow 0.2s ease-out',
        }}
        className="w-full max-w-md bg-white/92 backdrop-blur-xl border border-white/80 shadow-[0_25px_60px_-15px_rgba(6,78,59,0.2)] rounded-3xl p-6 sm:p-8 relative z-10 text-slate-800 hover:shadow-[0_30px_70px_-15px_rgba(6,78,59,0.28)]"
      >

        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-md shadow-emerald-600/30 mb-3 overflow-hidden bg-emerald-600">
            <img src="/logo.png" alt="PaaniPanchayat Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-wide">PaaniPanchayat</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">AI-Powered Water Sharing & Dispute Mediation</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'login'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            {t('signIn')}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'register'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            {t('register')}
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="ramesh@paanipanchayat.org"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type={showLoginPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  title={showLoginPassword ? "Hide password" : "Show password"}
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type={showRegPassword ? "text" : "password"}
                  required
                  placeholder="Create a strong password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  title={showRegPassword ? "Hide password" : "Show password"}
                  aria-label={showRegPassword ? "Hide password" : "Show password"}
                >
                  {showRegPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center space-x-2">
              <User className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>New registrations create a <strong>Farmer Account</strong>. Admin access requires pre-assigned credentials.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={regContact}
                  onChange={(e) => setRegContact(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Create Account & Continue</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* DEMO QUICK LOGIN SECTION */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-1 mb-2 text-xs font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Demo Sign-In:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoQuickLogin('ramesh@paanipanchayat.org', 'farmer')}
              className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-medium transition-all text-left"
            >
              🌾 <span className="font-bold">Ramesh</span> (Farmer)
            </button>
            <button
              type="button"
              onClick={() => handleDemoQuickLogin('admin@paanipanchayat.org', 'admin')}
              className="py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium transition-all text-left"
            >
              🛡️ <span className="font-semibold">Admin</span> (Panchayat)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
