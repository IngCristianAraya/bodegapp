import React from 'react';
import { Store, Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer id="contacto" className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4 text-emerald-400">
                            <Store size={24} />
                            <span className="text-xl font-bold text-white tracking-tight">BodegApp</span>
                        </div>
                        <p className="text-sm">
                            La solución integral para modernizar tu bodega y tomar el control de tu negocio.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Producto</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Características</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Precios</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Guía de Uso</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Novedades</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Soporte</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Centro de Ayuda</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Contacto</a></li>
                            <li><a href="#" className="hover:text-emerald-400 transition-colors">Estado del Servicio</a></li>
                            <li><Link href="/login" className="hover:text-emerald-400 transition-colors">Iniciar Sesión</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contacto</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2">
                                <Mail size={16} className="text-emerald-500" /> ingcristian.araya@gmail.com
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone size={16} className="text-emerald-500" /> +51 901 426 737
                            </li>
                            <li className="flex items-center gap-2">
                                <MapPin size={16} className="text-emerald-500" /> Lima, Perú
                            </li>
                        </ul>
                        <div className="flex gap-4 mt-6">
                            <a href="https://www.facebook.com/casquillomatik" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-500 transition-colors"><Facebook size={20} /></a>
                            <a href="https://www.instagram.com/cristian_aaj/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-pink-500 transition-colors"><Instagram size={20} /></a>
                            <a href="https://www.linkedin.com/in/ingcristianaraya/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 transition-colors"><Linkedin size={20} /></a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                    <p>&copy; {new Date().getFullYear()} BodegApp SaaS. Todos los derechos reservados.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-white transition-colors">Términos</a>
                        <a href="#" className="hover:text-white transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
