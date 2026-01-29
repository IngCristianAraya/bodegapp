import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
    return (
        <a
            href="https://wa.me/51901426737?text=Hola,%20me%20interesa%20BodegApp"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group font-bold animate-bounce-subtle"
            aria-label="Contactar por WhatsApp"
        >
            <MessageCircle size={24} className="fill-current" />
            <span className="hidden md:inline">Contáctanos</span>
        </a>
    );
};

export default WhatsAppButton;
