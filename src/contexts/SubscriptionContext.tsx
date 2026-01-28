"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from './TenantContext';

export type PlanType = 'FREE' | 'PRO';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED';

interface SubscriptionContextType {
    plan: PlanType;
    status: SubscriptionStatus;
    isPro: boolean;
    daysRemaining: number | null;
    loading: boolean;
    refreshSubscription: () => Promise<void>;
    checkFeatureAccess: (feature: FeatureKey) => boolean;
}

export type FeatureKey =
    | 'inventory_limit'
    | 'users_limit'
    | 'advanced_reports'
    | 'suppliers_advanced'
    | 'multi_branch';

const PLAN_LIMITS = {
    FREE: {
        inventory_limit: 100, // max products
        users_limit: 1, // max users
        advanced_reports: false,
        suppliers_advanced: false,
        multi_branch: false
    },
    PRO: {
        inventory_limit: Infinity,
        users_limit: Infinity,
        advanced_reports: true,
        suppliers_advanced: true,
        multi_branch: true
    }
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { tenant } = useTenant();
    const [plan, setPlan] = useState<PlanType>('FREE');
    const [status, setStatus] = useState<SubscriptionStatus>('ACTIVE');
    const [loading, setLoading] = useState(true);

    // Derivados
    const isPro = plan === 'PRO';
    const daysRemaining = null; // To implement based on trial_ends_at or period_end

    const refreshSubscription = async () => {
        if (!tenant?.id) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('tenants')
                .select('plan_type, subscription_status')
                .eq('id', tenant.id)
                .single();

            if (data && !error) {
                setPlan((data.plan_type as PlanType) || 'FREE');
                setStatus((data.subscription_status as SubscriptionStatus) || 'ACTIVE');
            }
        } catch (err) {
            console.error("Error loading subscription:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshSubscription();
    }, [tenant?.id]);

    const checkFeatureAccess = (feature: FeatureKey): boolean => {
        // Si el plan es PRO, generalmente todo está permitido, salvo que haya features enterprise futuras
        if (plan === 'PRO') return true;

        const limit = PLAN_LIMITS.FREE[feature];

        // Si el límite es booleano, retornamos el valor directo
        if (typeof limit === 'boolean') {
            return limit;
        }

        // Para límites numéricos, esta función solo dice "si tienes acceso a la feature en general"
        // La comprobación de *cantidad* (ej: count > 100) debe hacerse en el componente específico
        // Por ahora retornamos true para límites numéricos, indicando que la feature existe pero está limitada
        return true;
    };

    // Helper especial para verificar límites numéricos
    // Retorna el límite numérico del plan actual
    const getFeatureLimit = (feature: 'inventory_limit' | 'users_limit'): number => {
        return PLAN_LIMITS[plan][feature];
    };

    const value = {
        plan,
        status,
        isPro,
        daysRemaining,
        loading,
        refreshSubscription,
        checkFeatureAccess,
        getFeatureLimit // Exponemos esto también si es necesario, o lo integramos en checkFeatureAccess
    };

    return (
        <SubscriptionContext.Provider value={{ ...value, getFeatureLimit } as any}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}
