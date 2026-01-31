"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const LandingNavbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '#inicio', label: 'Inicio' },
        { href: '#caracteristicas', label: 'Características' },
        { href: '#planes', label: 'Planes' },
        { href: '#contacto', label: 'Contacto' },
    ];

    const handleStoreLogin = () => {
        // Simple and effective promtp for PWA users
        const subdomain = window.prompt("Ingresa el nombre de tu bodega (ej: pepito):");
        if (subdomain) {
            const protocol = window.location.protocol;
            const host = window.location.host; // includes port
            // If localhost, it's usually localhost:3000. 
            // In prod, it might be bodegapp.com -> subdomain.bodegapp.com

            // Handle Localhost special case
            if (host.includes('localhost')) {
                // Remove existing subdomains if any (though usually we are at root here)
                const parts = host.split('.');
                const baseHost = parts.length > 1 && !parts[0].includes('localhost') ? parts.slice(1).join('.') : host;
                window.location.href = `${protocol}//${subdomain}.${baseHost}`;
            } else {
                // Production logic (assuming wildcard DNS)
                window.location.href = `${protocol}//${subdomain}.${host}`;
            }
        }
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 shadow-lg'
                : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all">
                            B
                        </div>
                        <span className="text-xl font-bold text-white">BodegApp</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-slate-300 hover:text-white transition-colors font-medium relative group"
                            >
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-full transition-all duration-300"></span>
                            </a>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={handleStoreLogin}
                            className="px-4 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10"
                        >
                            Entrar a mi Bodega
                        </button>
                        <Link
                            href="/login"
                            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            Iniciar Sesión
                        </Link>
                        <Link
                            href="/register"
                            className="px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all"
                        >
                            Empezar Gratis
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-slate-900/98 backdrop-blur-lg border-t border-slate-800 animate-in slide-in-from-top duration-300">
                    <div className="px-4 py-6 space-y-4">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium"
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="pt-4 space-y-3 border-t border-slate-800">
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleStoreLogin();
                                }}
                                className="block w-full text-left px-4 py-2 text-emerald-400 font-medium hover:bg-slate-800 rounded-lg transition-colors border border-emerald-500/20"
                            >
                                Entrar a mi Bodega
                            </button>
                            <Link
                                href="/login"
                                className="block px-4 py-2 text-center text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium"
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                href="/register"
                                className="block px-6 py-3 text-center font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                            >
                                Empezar Gratis
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default LandingNavbar;
