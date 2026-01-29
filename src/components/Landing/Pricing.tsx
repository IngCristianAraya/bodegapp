import React from 'react';
import { Check, X } from 'lucide-react';
import Link from 'next/link';

const Pricing = () => {
    return (
        <div id="planes" className="bg-slate-900 py-24 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                        Planes simples y transparentes
                    </h2>
                    <p className="mt-4 text-xl text-slate-400">
                        Comienza gratis y crece a tu propio ritmo. Sin tarjetas de crédito requeridas.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Plan Gratuito */}
                    <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8 flex flex-col hover:border-emerald-500/30 transition-all">
                        <h3 className="text-xl font-semibold text-white">Plan Bodeguero</h3>
                        <p className="mt-4 text-slate-400">Perfecto para empezar a digitalizarte.</p>
                        <div className="mt-6 flex items-baseline">
                            <span className="text-5xl font-extrabold text-white">S/ 0</span>
                            <span className="ml-1 text-xl font-medium text-slate-400">/mes</span>
                        </div>

                        <ul className="mt-8 space-y-4 flex-1">
                            <li className="flex items-center">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400" />
                                <span className="ml-3 text-slate-300">Punto de Venta (POS) Básico</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400" />
                                <span className="ml-3 text-slate-300">Inventario hasta 100 productos</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400" />
                                <span className="ml-3 text-slate-300">Reportes de ventas diarios</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400" />
                                <span className="ml-3 text-slate-300">1 Usuario (Administrador)</span>
                            </li>
                            <li className="flex items-center text-slate-500">
                                <X className="flex-shrink-0 h-5 w-5" />
                                <span className="ml-3">Múltiples sucursales</span>
                            </li>
                        </ul>

                        <Link href="/register" className="mt-8 w-full bg-slate-700 border border-slate-600 rounded-xl py-3 px-6 text-center text-white font-bold hover:bg-slate-600 transition-colors">
                            Crear cuenta gratis
                        </Link>
                    </div>

                    {/* Plan Pro */}
                    <div className="bg-gradient-to-b from-emerald-900/40 to-slate-800 rounded-2xl shadow-2xl border border-emerald-500/50 p-8 flex flex-col relative transform scale-105 z-10">
                        <div className="absolute top-0 right-0 -mt-3 mr-4 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-xs font-bold text-white uppercase tracking-wide shadow-lg">
                            Más Popular
                        </div>
                        <h3 className="text-xl font-semibold text-white">Plan Pyme Pro</h3>
                        <p className="mt-4 text-emerald-200">Para negocios que quieren escalar.</p>
                        <div className="mt-6 flex items-baseline">
                            <span className="text-5xl font-extrabold text-white">S/ 49</span>
                            <span className="ml-1 text-xl font-medium text-slate-400">/mes</span>
                        </div>

                        <ul className="mt-8 space-y-4 flex-1">
                            <li className="flex items-center">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400" />
                                <span className="ml-3 text-white font-medium">Todo del plan Bodeguero</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400" />
                                <span className="ml-3 text-slate-300">Inventario Ilimitado</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400" />
                                <span className="ml-3 text-slate-300">Reportes Avanzados de Ganancias</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400" />
                                <span className="ml-3 text-slate-300">Usuarios Ilimitados (Cajeros)</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="flex-shrink-0 h-5 w-5 text-emerald-400" />
                                <span className="ml-3 text-slate-300">Gestión de Proveedores y Compras</span>
                            </li>
                        </ul>

                        <Link href="/register" className="mt-8 w-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl py-3 px-6 text-center text-white font-bold hover:shadow-lg hover:shadow-emerald-500/40 transition-all block">
                            Prueba Gratuita de 14 días
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
