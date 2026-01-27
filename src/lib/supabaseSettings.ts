import { supabase } from './supabase';

export interface StoreInfo {
    businessName: string;
    ruc: string;
    address: string;
}

export async function saveStoreInfo(tenantId: string, info: StoreInfo) {
    const { error } = await supabase
        .from('store_settings')
        .upsert(
            {
                tenant_id: tenantId,
                business_name: info.businessName,
                ruc: info.ruc,
                address: info.address,
                updated_at: new Date().toISOString()
            },
            { onConflict: 'tenant_id' }
        );

    if (error) {
        console.error('Error guardando configuración:', error);
        throw error;
    }
}

export async function getStoreInfo(tenantId: string): Promise<StoreInfo | null> {
    if (!tenantId) return null;

    const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error obteniendo configuración:', error);
        return null;
    }

    return {
        businessName: data.business_name,
        ruc: data.ruc,
        address: data.address
    };
}

