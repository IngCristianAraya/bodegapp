import React, { useState, useEffect, useRef } from 'react';
import { User, Search, X, Check } from 'lucide-react';
import { Customer } from '../../types/index';
import { obtenerClientes } from '@/lib/supabaseCustomers';
import { useTenant } from '@/contexts/TenantContext';

interface CustomerSelectorProps {
    onSelect: (customer: Customer | null) => void;
    selectedCustomer: Customer | null;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ onSelect, selectedCustomer }) => {
    const { tenant } = useTenant();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (tenant?.id) {
            setLoading(true);
            obtenerClientes(tenant.id)
                .then(data => setCustomers(data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [tenant]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${selectedCustomer
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={`p-1.5 rounded-full ${selectedCustomer ? 'bg-emerald-200' : 'bg-gray-100'}`}>
                    <User size={18} />
                </div>
                <span className="flex-1 font-medium truncate">
                    {selectedCustomer ? selectedCustomer.name : 'Seleccionar Cliente (Opcional)'}
                </span>
                {selectedCustomer && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(null);
                        }}
                        className="p-1 hover:bg-emerald-200 rounded-full transition"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-80 flex flex-col animate-in fade-in zoom-in duration-200">
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o teléfono..."
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-1">
                        {loading ? (
                            <div className="p-4 text-center text-gray-400 text-sm">Cargando...</div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm">No se encontraron clientes</div>
                        ) : (
                            filteredCustomers.map(customer => (
                                <button
                                    key={customer.id}
                                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-lg flex items-center justify-between group transition-colors"
                                    onClick={() => {
                                        onSelect(customer);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div>
                                        <p className="font-medium text-gray-800">{customer.name}</p>
                                        <p className="text-xs text-gray-500">{customer.phone || 'Sin teléfono'}</p>
                                    </div>
                                    {customer.currentDebt && customer.currentDebt > 0 && (
                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">
                                            Deuda: S/ {customer.currentDebt.toFixed(2)}
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerSelector;
