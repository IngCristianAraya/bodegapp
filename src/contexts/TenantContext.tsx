"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTenantBySubdomain } from '../lib/supabaseTenants';

interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    plan_type: string;
    status?: 'active' | 'suspended' | 'cancelled'; // New field
    subscription_plan?: string; // New field
}

interface TenantContextType {
    tenant: Tenant | null;
    loading: boolean;
    error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                if (typeof window === 'undefined') return;

                const hostname = window.location.hostname;
                const rootDomain = 'tubarrio.pe';
                const localhost = 'localhost';

                let subdomain = '';

                if (hostname.endsWith(`.${rootDomain}`)) {
                    // Extract subdomain from pepito.bodegapp.tubarrio.pe -> pepito
                    const parts = hostname.replace(`.${rootDomain}`, '').split('.');
                    subdomain = parts[0]; // Get the first part (pepito)
                } else if (hostname.endsWith(`.${localhost}`) || hostname === localhost) {
                    if (hostname !== localhost) {
                        subdomain = hostname.split('.')[0];
                    }
                }

                console.log('TenantProvider: Detected hostname:', hostname);
                console.log('TenantProvider: Extracted subdomain:', subdomain);

                if (!subdomain || subdomain === 'www') {
                    setTenant(null);
                    setLoading(false);
                    return;
                }

                const tenantData = await getTenantBySubdomain(subdomain);
                if (tenantData) {
                    setTenant(tenantData);
                } else {
                    setError('Tienda no encontrada');
                }
            } catch (err) {
                console.error('Error in TenantProvider:', err);
                setError('Error al cargar la configuración de la tienda');
            } finally {
                setLoading(false);
            }
        };

        fetchTenant();
    }, []);

    return (
        <TenantContext.Provider value={{ tenant, loading, error }}>
            {children}
        </TenantContext.Provider>
    );
};
