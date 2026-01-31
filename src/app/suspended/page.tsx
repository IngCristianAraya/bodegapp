
'use client';
import React from 'react';
import { Lock, MessageCircle, AlertTriangle } from 'lucide-react';
import LandingNavbar from '@/components/Landing/LandingNavbar';
import Footer from '@/components/Landing/Footer';

export default function SuspendedPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            <LandingNavbar />

            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-red-100 dark:border-red-900/30">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>

                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Cuenta Suspendida</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">
                        El acceso a esta tienda ha sido restringido temporalmente debido a un problema con la suscripción o violacion de términos.
                    </p>

                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-8 text-left flex gap-3">
                        <AlertTriangle className="shrink-0 text-orange-600 dark:text-orange-400" />
                        <div className="text-sm text-orange-800 dark:text-orange-200">
                            <p className="font-bold">¿Crees que es un error?</p>
                            <p>Si ya realizaste tu pago, por favor contáctanos para reactivar el servicio inmediatamente.</p>
                        </div>
                    </div>

                    <a
                        href="https://wa.me/51901426737?text=Hola,%20mi%20cuenta%20de%20BodegApp%20aparece%20suspendida.%20Quisiera%20reactivarla."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/30"
                    >
                        <MessageCircle size={20} />
                        Contactar Soporte
                    </a>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-medium"
                    >
                        Volver al inicio
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
}
