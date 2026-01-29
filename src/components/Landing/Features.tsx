"use client";

import React from 'react';
import { BarChart3, Box, Monitor, ShoppingBag, ShieldCheck, Zap } from 'lucide-react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const features = [
    {
        icon: <Monitor className="text-emerald-400" size={32} />,
        title: 'Punto de Venta (POS)',
        description: 'Vende rápido con una interfaz táctil, busca productos por código de barras y genera tickets al instante.'
    },
    {
        icon: <Box className="text-blue-400" size={32} />,
        title: 'Control de Inventario',
        description: 'Gestiona tu stock en tiempo real. Recibe alertas de bajo stock y organiza tus productos por categorías.'
    },
    {
        icon: <BarChart3 className="text-purple-400" size={32} />,
        title: 'Reportes y Ganancias',
        description: 'Visualiza tus ventas del día, semana o mes. Conoce tus productos más vendidos y tu margen de ganancia real.'
    },
    {
        icon: <ShoppingBag className="text-rose-400" size={32} />,
        title: 'Gestión de Proveedores',
        description: 'Mantén un registro de tus proveedores y genera órdenes de compra automáticamente en PDF.'
    },
    {
        icon: <Zap className="text-yellow-400" size={32} />,
        title: 'Rápido y Moderno',
        description: 'Diseñado con tecnología de punta para ser veloz en cualquier dispositivo, sea PC, Tablet o Laptop.'
    },
    {
        icon: <ShieldCheck className="text-cyan-400" size={32} />,
        title: 'Seguro y en la Nube',
        description: 'Tus datos están seguros y respaldados automáticamente. Accede a tu negocio desde cualquier lugar.'
    }
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
    const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

    return (
        <div
            ref={ref}
            className={`relative bg-slate-800/50 border border-slate-700 p-8 rounded-2xl hover:bg-slate-800 transition-all duration-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 ${isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
            style={{
                transitionDelay: isVisible ? `${index * 100}ms` : '0ms',
            }}
        >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-xl"></div>
            <div className="bg-slate-900 w-14 h-14 rounded-xl flex items-center justify-center border border-slate-700 mb-6 shadow-lg">
                {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-slate-400 leading-relaxed">
                {feature.description}
            </p>
        </div>
    );
};

const Features = () => {
    const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 });

    return (
        <div id="caracteristicas" className="bg-slate-900 py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                    ref={headerRef}
                    className={`text-center mb-16 transition-all duration-700 ${headerVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-8'
                        }`}
                >
                    <h2 className="text-base font-semibold text-emerald-400 uppercase tracking-wide">Características</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
                        Todo lo que necesitas para tu bodega
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-slate-400 mx-auto">
                        Olvídate del cuaderno. BodegApp te da las herramientas digitales para profesionalizar tu negocio.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Features;

