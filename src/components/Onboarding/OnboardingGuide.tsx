
'use client';
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Package, ShoppingCart, DollarSign, Settings, ArrowRight, Play } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function OnboardingGuide() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        // Only show if user is logged in
        if (!user) return;

        // Check LocalStorage
        const hasCompleted = localStorage.getItem(`bodegapp_onboarding_completed_${user.id}`);
        if (!hasCompleted) {
            // Small delay for better UX
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleComplete = () => {
        if (user) {
            localStorage.setItem(`bodegapp_onboarding_completed_${user.id}`, 'true');
        }
        setIsOpen(false);
    };

    if (!isOpen) return null;

    const steps = [
        {
            title: "¡Bienvenido a BodegApp!",
            description: "Tu sistema POS profesional está listo. Vamos a repasar brevemente cómo funciona para que le saques el máximo provecho.",
            icon: <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-pulse"><Play size={32} /></div>
        },
        {
            title: "1. Crea tus Productos",
            description: "Dirígete a 'Inventario' para agregar tus productos. Puedes incluir código de barras, precio de costo y venta. ¡Es la base de tu negocio!",
            icon: <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Package size={32} /></div>
        },
        {
            title: "2. Realiza Ventas",
            description: "En el módulo 'Punto de Venta (POS)', escanea o busca productos. Acepta pagos en efectivo, Yape o tarjeta rápidamente.",
            icon: <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600"><ShoppingCart size={32} /></div>
        },
        {
            title: "3. Controla tu Caja",
            description: "No olvides 'Abrir Caja' al iniciar el día y 'Cerrar Caja' al finalizar. El sistema calculará tus ganancias automáticamente.",
            icon: <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><DollarSign size={32} /></div>
        },
        {
            title: "4. Personaliza tu Tienda",
            description: "En 'Configuración' puedes subir tu Logo, definir el mensaje de tu Ticket y establecer tu PIN de seguridad.",
            icon: <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-600"><Settings size={32} /></div>
        }
    ];

    const current = steps[step];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="relative p-8 flex flex-col items-center text-center">
                    <button
                        onClick={handleComplete}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={24} />
                    </button>

                    <div className="mb-6 mt-2 transform transition-all duration-300 hover:scale-110">
                        {current.icon}
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                        {current.title}
                    </h2>

                    <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                        {current.description}
                    </p>

                    <div className="flex gap-1 mb-8">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-emerald-500' : 'w-2 bg-gray-200 dark:bg-gray-700'}`}
                            />
                        ))}
                    </div>

                    <div className="w-full flex gap-3">
                        {step > 0 && (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                className="flex-1 py-3 px-6 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Atrás
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (step < steps.length - 1) {
                                    setStep(s => s + 1);
                                } else {
                                    handleComplete();
                                }
                            }}
                            className="flex-1 py-3 px-6 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                        >
                            {step < steps.length - 1 ? (
                                <>Siguiente <ArrowRight size={18} /></>
                            ) : (
                                <>¡Entendido! <CheckCircle size={18} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
