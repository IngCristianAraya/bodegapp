import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UpgradeAlertProps {
    title?: string;
    message?: string;
    className?: string;
}

const UpgradeAlert: React.FC<UpgradeAlertProps> = ({
    title = "Actualiza al Plan PRO",
    message = "Esta funcionalidad está disponible exclusivamente para usuarios PRO.",
    className = ""
}) => {
    return (
        <div className={`bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 border border-emerald-500/30 shadow-lg relative overflow-hidden group ${className}`}>
            {/* Glow Effect */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                        <p className="text-slate-400 text-sm max-w-md">
                            {message}
                        </p>
                    </div>
                </div>

                <Link href="/settings?tab=subscription" className="whitespace-nowrap px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2">
                    Mejorar Plan <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    );
};

export default UpgradeAlert;
