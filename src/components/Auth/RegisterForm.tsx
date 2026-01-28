import React, { useState, useEffect } from 'react';
import { Lock, Mail, ChevronRight, ShieldCheck, ArrowLeft, Store, Globe, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { register } = useAuth();

  // Auto-generación de subdominio basado en el nombre de la bodega
  useEffect(() => {
    if (storeName) {
      const suggested = storeName
        .toLowerCase()
        .trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/[^a-z0-9]/g, ''); // Solo letras y números
      setSubdomain(suggested);
    }
  }, [storeName]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await register(email, password, storeName, subdomain);
      setSuccessMessage("¡Cuenta creada con éxito! Revisa tu correo para confirmar tu registro.");
    } catch (error: unknown) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "Error al registrar la bodega.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden mesh-background p-4 md:p-6">
      {/* Decoración de fondo */}
      <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-lg relative z-10">
        <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl bg-slate-900/40">
          <div className="p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-2xl shadow-xl shadow-emerald-500/20 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
                <Store className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">
                Abre tu <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">Bodega</span>
              </h1>
              <p className="text-emerald-100/60 mt-3 font-medium tracking-wide">Comienza a vender de manera inteligente hoy mismo</p>
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
                  <ChevronRight className="w-5 h-5 text-emerald-200" />
                </div>
                <p className="text-emerald-50 text-sm font-medium">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre de la Bodega */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/70 ml-1 tracking-widest uppercase">
                  Nombre de tu Negocio
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Store className="h-5 w-5 text-emerald-100/40 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="block w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-emerald-100/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Ej: Abarrotes Doña María"
                    required
                  />
                </div>
              </div>

              {/* Subdominio / URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/70 ml-1 tracking-widest uppercase">
                  Tu Dirección Web (Subdominio)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-emerald-100/40 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="block w-full pl-12 pr-28 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-emerald-100/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                    placeholder="mibodega"
                    required
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-100/40 font-bold text-sm">
                    .tubarrio.pe
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/70 ml-1 tracking-widest uppercase">
                  Correo Administrativo
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-emerald-100/40 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-emerald-100/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                    placeholder="admin@tu-bodega.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/70 ml-1 tracking-widest uppercase">
                  Contraseña Segura
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-emerald-100/40 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-emerald-100/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                    placeholder="••••••••"
                    required
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

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4.5 rounded-2xl font-black shadow-2xl shadow-emerald-900/20 flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none mt-4"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="tracking-widest uppercase text-sm">Provisionando...</span>
                  </div>
                ) : (
                  <>
                    <span className="tracking-widest uppercase text-sm">Crear mi Bodega PRO</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center pt-4">
                <Link
                  href="/"
                  className="text-xs font-bold text-emerald-100/40 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ¿Ya tienes cuenta? Inicia sesión
                </Link>
              </div>
            </form>
          </div>
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

export default RegisterForm;
