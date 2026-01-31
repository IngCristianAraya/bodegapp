"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { obtenerProductos } from '../lib/supabaseProducts';
import { useTenant } from './TenantContext';
import type { Product } from '../types/inventory';

interface LowStockContextType {
    lowStockCount: number;
    criticalStockCount: number;
    lowStockProducts: Product[];
    refreshLowStock: () => Promise<void>;
}

const LowStockContext = createContext<LowStockContextType | undefined>(undefined);

export const LowStockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { tenant } = useTenant();
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [criticalStockCount, setCriticalStockCount] = useState(0);

    const refreshLowStock = React.useCallback(async () => {
        if (!tenant?.id) return;

        try {
            const products = await obtenerProductos(tenant.id);

            // Productos con stock bajo (stock <= minStock)
            const lowStock = products.filter(p =>
                typeof p.stock === 'number' &&
                typeof p.minStock === 'number' &&
                p.stock <= p.minStock
            );

            // Productos críticos (stock <= minStock / 2 o stock = 0)
            const critical = lowStock.filter(p =>
                p.stock === 0 || p.stock <= (p.minStock || 0) / 2
            );

            setLowStockProducts(lowStock);
            setLowStockCount(lowStock.length);
            setCriticalStockCount(critical.length);
        } catch (error) {
            console.error('Error fetching low stock:', error);
        }
    }, [tenant?.id]);

    useEffect(() => {
        refreshLowStock();

        // Refresh every 5 minutes
        const interval = setInterval(refreshLowStock, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [tenant?.id, refreshLowStock]);

    return (
        <LowStockContext.Provider value={{
            lowStockCount,
            criticalStockCount,
            lowStockProducts,
            refreshLowStock
        }}>
            {children}
        </LowStockContext.Provider>
    );
};

export const useLowStock = () => {
    const context = useContext(LowStockContext);
    if (!context) {
        throw new Error('useLowStock must be used within LowStockProvider');
    }
    return context;
};
