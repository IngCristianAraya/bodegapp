import React, { useState } from 'react';
import { Eye, EyeOff, ShoppingBag, Lock, Mail, ChevronRight, ShieldCheck, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [mode, setMode] = useState<'login' | 'reset'>('login');

  const { login, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await resetPassword(email);
        setSuccessMessage("¡Enlace enviado! Revisa tu correo electrónico para restablecer tu clave.");
      }
    } catch (error: unknown) {
      console.error("Auth error:", error);
      setError(error instanceof Error ? error.message : "Error en la autenticación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden mesh-background p-4 md:p-6">
      {/* Elementos decorativos de fondo para profundidad */}
      <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-lg relative z-10">
        <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl bg-slate-900/40">
          <div className="p-8 md:p-12">
            {/* Header dinámico */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-2xl shadow-xl shadow-emerald-500/20 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
                {mode === 'login' ? <ShoppingBag className="w-10 h-10 text-white" /> : <Lock className="w-10 h-10 text-white" />}
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">
                {mode === 'login' ? 'BodegApp ' : 'Nueva '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
                  {mode === 'login' ? 'Pro' : 'Clave'}
                </span>
              </h1>
              <p className="text-emerald-100/60 mt-3 font-medium tracking-wide">
                {mode === 'login' ? 'Gestión Inteligente de Abarrotes' : 'Recupera el acceso a tu bodega'}
              </p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex-shrink-0 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-red-200" />
                </div>
                <p className="text-red-100 text-sm font-medium">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-8 p-4 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Send className="w-5 h-5 text-emerald-200" />
                </div>
                <p className="text-emerald-50 text-sm font-medium">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Input Email - Siempre visible */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-white/90 ml-1 tracking-wide uppercase">
                  Identidad Digital
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-emerald-100/40 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                    className="block w-full pl-12 pr-5 py-4.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-emerald-100/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                    placeholder="tu@bodega.com"
                    required
                  />
                </div>
              </div>

              {/* Input Password - Solo en modo login */}
              {mode === 'login' && (
                <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-sm font-bold text-white/90 tracking-wide uppercase">
                      Clave de Acceso
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode('reset'); setError(""); setSuccessMessage(""); }}
                      className="text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      ¿Nueva clave?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-emerald-100/40 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                      className="block w-full pl-12 pr-12 py-4.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-emerald-100/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                      placeholder="••••••••"
                      required={mode === 'login'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4.5 rounded-2xl font-black shadow-2xl shadow-emerald-900/20 flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="tracking-widest uppercase text-sm">Procesando...</span>
                    </div>
                  ) : (
                    <>
                      <span className="tracking-widest uppercase text-sm">
                        {mode === 'login' ? 'Entrar al Sistema' : 'Enviar Instrucciones'}
                      </span>
                      {mode === 'login' ? (
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                      ) : (
                        <Send className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                      )}
                    </>
                  )}
                </button>

                {mode === 'reset' && (
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(""); setSuccessMessage(""); }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-emerald-100/40 hover:text-emerald-400 transition-colors font-bold text-xs uppercase tracking-widest"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al inicio
                  </button>
                )}
              </div>
            </form>

            {/* Footer dinámico con CTA de Registro */}
            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-3 w-full">
                <p className="text-emerald-100/40 text-[10px] font-bold uppercase tracking-[0.2em]">¿Nuevo en BodegApp?</p>
                <a
                  href="/register"
                  className="text-xs font-black text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-6 py-2.5 rounded-full border border-emerald-500/20 uppercase tracking-widest"
                >
                  Abrir mi Bodega PRO
                </a>
              </div>

              <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-full border border-white/5 mt-4">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em]">SaaS Cloud Edition</span>
              </div>
              <p className="text-emerald-100/30 text-[10px] text-center leading-relaxed font-medium">
                {mode === 'login'
                  ? 'Protección de Datos Nivel Bancario'
                  : 'Seguridad Reforzada - Recuperación de Cuenta'}
                <br />
                &copy; 2026 BodegApp Cloud Enterprise Solutions.
              </p>
            </div>
          </div>
        </div>

        {/* Floating badge at the bottom */}
        <div className="mt-10 flex justify-center opacity-40 hover:opacity-100 transition-all duration-500">
          <img src="https://supabase.com/dashboard/img/supabase-logo.svg" alt="Powered by Supabase" className="h-6 brightness-0 invert" />
        </div>
      </div>

      <style jsx>{`
        input::placeholder {
          color: rgba(209, 250, 229, 0.2);
        }
        .mesh-background {
          background: radial-gradient(circle at top left, #064e3b 0%, #020617 50%),
                      radial-gradient(circle at bottom right, #065f46 0%, #020617 50%);
          background-attachment: fixed;
        }
      `}</style>
    </div>
  );
};

export default LoginForm;