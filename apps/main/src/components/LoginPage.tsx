
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { translations, Language } from '../translations';

interface LoginPageProps {
  lang: Language;
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ lang, onLoginSuccess }) => {
  const isRTL = lang === 'ar';
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              address: address,
            },
          },
        });
        if (error) throw error;
        if (data.user) {
          setSuccess(isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
          if (onLoginSuccess) onLoginSuccess();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user && onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20 pt-10">
      <div className="w-full max-w-md luxury-card p-10 bg-luxury-glow relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10">
          <div className="w-20 h-20 bg-gold-gradient rounded-[1.5rem] flex items-center justify-center text-black text-3xl font-black mx-auto mb-8 shadow-[0_0_30px_rgba(200,169,81,0.3)]">
            Y
          </div>
          <h1 className="font-luxury text-4xl font-black mb-3 text-white tracking-tight">
            {isSignUp ? (isRTL ? 'انضم إلينا' : 'The Assembly') : (isRTL ? 'أهلاً بك' : 'Welcome Back')}
          </h1>
          <p className="text-white/40 text-sm font-medium tracking-wide">
            {isSignUp
              ? (isRTL ? 'أنشئ حسابك للوصول إلى الخدمات الفاخرة' : 'Enroll for elite concierge access')
              : (isRTL ? 'سجل دخولك للمتابعة' : 'Identify yourself to proceed')}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-2xl flex items-start gap-3 backdrop-blur-xl animate-shake">
            <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-8 p-5 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-2xl flex items-start gap-3 backdrop-blur-xl animate-entrance">
            <i className="fa-solid fa-check-circle mt-0.5"></i>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6 relative z-10">
          {isSignUp && (
            <div className="space-y-6 animate-entrance">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <div className="relative group">
                  <i className="fa-solid fa-user absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors"></i>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g. Alexander Black"
                    className="w-full pl-12 pr-6 py-4 bg-white/5 text-white border border-white/10 rounded-2xl focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10 font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Phone</label>
                <div className="relative group">
                  <i className="fa-solid fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors"></i>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+961 -- --- ---"
                    className="w-full pl-12 pr-6 py-4 bg-white/5 text-white border border-white/10 rounded-2xl focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Email Terminal</label>
            <div className="relative group">
              <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors"></i>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="identity@prestige.com"
                className="w-full pl-12 pr-6 py-4 bg-white/5 text-white border border-white/10 rounded-2xl focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Access Code</label>
            <div className="relative group">
              <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors"></i>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-6 py-4 bg-white/5 text-white border border-white/10 rounded-2xl focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full luxury-button py-5 mt-6 group overflow-hidden relative"
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              ) : (
                <>
                  <span className="tracking-widest uppercase text-xs font-black">
                    {isSignUp ? (isRTL ? 'إنشاء حساب' : 'Authorize Account') : (isRTL ? 'دخول' : 'Access Vault')}
                  </span>
                  <i className={`fa-solid ${isRTL ? 'fa-arrow-left' : 'fa-arrow-right'} text-[10px] group-hover:translate-x-1 transition-transform`}></i>
                </>
              )}
            </div>
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 text-center relative z-10">
          <p className="text-xs text-white/30 font-medium">
            {isSignUp ? (isRTL ? 'لديك حساب بالفعل؟' : 'Already recognized?') : (isRTL ? 'ليس لديك حساب؟' : "Unrecognized identity?")}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 font-black text-primary hover:text-primary-light transition-colors uppercase tracking-widest"
            >
              {isSignUp ? (isRTL ? 'سجل دخول' : 'Sign In') : (isRTL ? 'انضم الآن' : 'Sign Up')}
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/admin" className="text-[9px] font-black text-white/10 hover:text-primary/40 transition-colors uppercase tracking-[0.4em] flex items-center justify-center gap-2">
            <i className="fa-solid fa-shield-halved"></i>
            {isRTL ? 'دخول المشرف' : 'ADMIN TERMINAL'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
