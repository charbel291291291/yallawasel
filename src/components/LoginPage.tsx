
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { translations, Language } from '../translations';

interface LoginPageProps {
  lang: Language;
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ lang, onLoginSuccess }) => {
  const t = translations[lang];
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
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
          setSuccess(lang === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
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
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 relative z-[60] pointer-events-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative overflow-hidden pointer-events-auto">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary-dark"></div>
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg shadow-red-200">
            Y
          </div>
          <h1 className="font-luxury text-3xl font-bold mb-2 text-gray-900">
            {isSignUp ? (lang === 'ar' ? 'انضم إلينا' : 'Join the Club') : t.welcomeBack}
          </h1>
          <p className="text-gray-500 text-sm">
            {isSignUp
              ? (lang === 'ar' ? 'أنشئ حسابك للوصول إلى الخدمات الفاخرة' : 'Create an account for luxury access')
              : t.signInDesc}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-2">
            <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl flex items-start gap-2">
            <i className="fa-solid fa-check-circle mt-0.5"></i>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4 relative z-10 pointer-events-auto">
          {isSignUp && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-4 top-3.5 text-gray-400"></i>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jad El-Khoury"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pointer-events-auto"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone</label>
                <div className="relative">
                  <i className="fa-solid fa-phone absolute left-4 top-3.5 text-gray-400"></i>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+961 3 000000"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pointer-events-auto"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Address</label>
                <div className="relative">
                  <i className="fa-solid fa-map-pin absolute left-4 top-3.5 text-gray-400"></i>
                  <input
                    type="text"
                    required
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Adonis, Zone A..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pointer-events-auto"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-4 top-3.5 text-gray-400"></i>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pointer-events-auto"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-4 top-3.5 text-gray-400"></i>
              <input
                type="password"
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pointer-events-auto"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-[0_4px_0_#5c0f0f] hover:bg-primary-dark transition-all active:shadow-none active:translate-y-[4px] disabled:opacity-70 disabled:cursor-not-allowed mt-4 pointer-events-auto"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fa-solid fa-circle-notch fa-spin"></i> {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
              </span>
            ) : (
              isSignUp ? (lang === 'ar' ? 'إنشاء حساب' : 'Create Account') : t.signIn
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center relative z-10">
          <p className="text-sm text-gray-500">
            {isSignUp ? (lang === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?') : (lang === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?")}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 font-bold text-primary hover:underline focus:outline-none pointer-events-auto"
            >
              {isSignUp ? (lang === 'ar' ? 'سجل دخول' : 'Sign In') : (lang === 'ar' ? 'انضم الآن' : 'Sign Up')}
            </button>
          </p>
        </div>

        {/* Admin Access Link */}
        <div className="mt-4 pb-2 text-center relative z-10">
          <Link to="/admin" className="text-xs text-gray-300 hover:text-gray-500 transition-colors font-medium inline-flex items-center gap-1 pointer-events-auto">
            <i className="fa-solid fa-lock text-[10px]"></i> {t.adminAccess}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
