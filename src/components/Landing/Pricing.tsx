"use client";

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const Pricing = () => {
    const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 });
    const { ref: card1Ref, isVisible: card1Visible } = useScrollAnimation({ threshold: 0.2 });
    const { ref: card2Ref, isVisible: card2Visible } = useScrollAnimation({ threshold: 0.2 });

    const [isAnnual, setIsAnnual] = useState(true);

    return (
        <div id="planes" className="bg-slate-900 py-24 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30 pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div
                    ref={headerRef}
                    className={`text-center mb-12 transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}
                >
                    <h2 className="text-3xl font-extrabold text-white sm:text-5xl tracking-tight">
                        Planes simples, <span className="text-emerald-400">sin sorpresas</span>
                    </h2>
                    <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto">
                        Elige el plan que mejor se adapte a tu bodega.
                    </p>

                    {/* Toggle Switch */}
                    <div className="mt-8 flex justify-center items-center gap-4">
                        <span className={`text-sm font-bold ${!isAnnual ? 'text-white' : 'text-slate-400'} transition-colors`}>Mensual</span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="relative w-16 h-8 bg-slate-700 rounded-full p-1 transition-colors hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <div
                                className={`w-6 h-6 bg-emerald-400 rounded-full shadow-md transform transition-transform duration-300 ${isAnnual ? 'translate-x-8' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                        <span className={`text-sm font-bold ${isAnnual ? 'text-white' : 'text-slate-400'} transition-colors flex items-center gap-2`}>
                            Anual
                            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">
                                Ahorra 16%
                            </span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Plan Bodeguero */}
                    <div
                        ref={card1Ref}
                        className={`bg-gradient-to-b from-emerald-900/40 to-slate-800 rounded-3xl shadow-2xl border border-emerald-500/50 p-8 flex flex-col relative transform scale-105 z-10 transition-all duration-700 ${card1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                            }`}
                    >
                        <div className="absolute top-0 right-0 -mt-4 mr-4 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-xs font-bold text-white uppercase tracking-wide shadow-lg border border-white/10">
                            Recomendado
                        </div>
                        <div className="mb-4">
                            <h3 className="text-2xl font-bold text-white">Plan Bodeguero</h3>
                            <p className="text-slate-400 mt-2 text-sm">Ideal para bodegas RUS y pequeños negocios.</p>
                        </div>

                        <div className="mt-2 flex items-baseline">
                            <span className="text-5xl font-extrabold text-white">
                                S/ {isAnnual ? '25' : '29.90'}
                            </span>
                            <span className="ml-2 text-xl font-medium text-slate-400">/mes</span>
                        </div>
                        {isAnnual && (
                            <p className="text-sm text-emerald-400 mt-2 font-medium">Facturado S/ 300 anual (Ahorras S/ 58)</p>
                        )}
                        {!isAnnual && (
                            <p className="text-sm text-slate-500 mt-2">Facturación mensual recurrente</p>
                        )}

                        <ul className="mt-8 space-y-4 flex-1">
                            <li className="flex items-start">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400 mt-0.5" />
                                <span className="ml-3 text-slate-300 text-sm">Punto de Venta (POS) Ilimitado</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400 mt-0.5" />
                                <span className="ml-3 text-slate-300 text-sm">Control de Stock en tiempo real</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400 mt-0.5" />
                                <span className="ml-3 text-slate-300 text-sm">Ticket de Venta (No Fiscal)</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400 mt-0.5" />
                                <span className="ml-3 text-slate-300 text-sm">Reportes básicos (Excel)</span>
                            </li>
                        </ul>

                        <Link href="/register?plan=basic" className="mt-8 w-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl py-4 px-6 text-center text-white font-bold hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all border border-emerald-400/20 active:scale-95">
                            Prueba Gratuita de 7 días
                        </Link>
                    </div>

                    {/* Plan Pro */}
                    <div
                        ref={card2Ref}
                        className={`bg-slate-800 rounded-3xl shadow-xl border border-slate-700 p-8 flex flex-col hover:border-emerald-500/30 transition-all duration-700 ${card2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                            }`}
                        style={{ transitionDelay: card2Visible ? '100ms' : '0ms' }}
                    >
                        <div className="mb-4">
                            <h3 className="text-2xl font-bold text-white">Plan Pyme Pro</h3>
                            <p className="text-emerald-200 mt-2 text-sm">Para negocios en crecimiento (RER/MYPE).</p>
                        </div>

                        <div className="mt-2 flex items-baseline">
                            <span className="text-5xl font-extrabold text-white">
                                S/ {isAnnual ? '49' : '59.90'}
                            </span>
                            <span className="ml-2 text-xl font-medium text-slate-400">/mes</span>
                        </div>
                        {isAnnual && (
                            <p className="text-sm text-emerald-400 mt-2 font-medium">Facturado S/ 588 anual</p>
                        )}
                        {!isAnnual && (
                            <p className="text-sm text-slate-500 mt-2">Facturación mensual recurrente</p>
                        )}

                        <ul className="mt-8 space-y-4 flex-1">
                            <li className="flex items-start">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400 mt-0.5" />
                                <span className="ml-3 text-white font-medium text-sm">Todo del plan Bodeguero</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400 mt-0.5" />
                                <span className="ml-3 text-slate-300 text-sm">Integración Facturación SUNAT (API)</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400 mt-0.5" />
                                <span className="ml-3 text-slate-300 text-sm">Reportes Avanzados de Ganancias</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400 mt-0.5" />
                                <span className="ml-3 text-slate-300 text-sm">Gestión de Proveedores y Compras</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400 mt-0.5" />
                                <span className="ml-3 text-slate-300 text-sm">Múltiples Usuarios y Roles</span>
                            </li>
                        </ul>

                        <Link href="/register?plan=pro" className="mt-8 w-full bg-slate-700 border border-slate-600 rounded-xl py-4 px-6 text-center text-white font-bold hover:bg-slate-600 transition-colors">
                            Contactar Ventas
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
