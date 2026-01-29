import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

const Hero = () => {
    return (
        <div className="relative overflow-hidden bg-slate-900 pt-16 pb-32 lg:pt-32 lg:pb-40">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '7s' }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Sparkles size={14} className="text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-300 tracking-wide uppercase">Potencia tu Bodega</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                    Gestiona tu negocio <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        como los grandes
                    </span>
                </h1>

                <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-300 mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                    BodegApp es el sistema de punto de venta y control de inventario diseñado para hacer crecer tu negocio. Rápido, fácil y profesional.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
                    <Link
                        href="/login"
                        className="px-8 py-4 text-lg font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all flex items-center gap-2"
                    >
                        Empezar Gratis
                        <ArrowRight size={20} />
                    </Link>
                    <a href="#features" className="px-8 py-4 text-lg font-semibold rounded-2xl bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center">
                        Ver Demo
                    </a>
                </div>

                {/* Dashboard Preview with Real Screenshot */}
                <div className="mt-20 relative mx-auto max-w-5xl animate-in fade-in zoom-in duration-1000 delay-500">
                    {/* Green/Cyan Gradient Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl blur opacity-30"></div>

                    {/* Browser Window Frame */}
                    <div className="relative rounded-2xl bg-slate-900 border border-slate-700 p-2 shadow-2xl">
                        {/* Browser Top Bar */}
                        <div className="h-8 border-b border-slate-700 flex items-center px-3 gap-2 bg-slate-800/80 rounded-t-xl">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                        </div>

                        {/* Real Dashboard Screenshot */}
                        <div className="rounded-b-xl overflow-hidden">
                            <img
                                src="https://res.cloudinary.com/do2rpqupm/image/upload/v1769659437/Captura_bodegapp_ksruaz.png"
                                alt="BodegApp Dashboard Preview"
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
