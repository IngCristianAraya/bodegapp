import { supabase } from './supabase';

export interface StoreSettings {
    id?: string;
    tenant_id: string;
    business_name: string;
    ruc?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
    ticket_footer?: string;
    admin_password?: string;
    admin_pin?: string; // PIN de 4 dígitos para operaciones de caja

    // Campos de Pago
    yape_qr_url?: string;
    plin_qr_url?: string;
    yape_number?: string;
    plin_number?: string;

    updated_at?: string;
}

/**
 * Obtiene la configuración de la tienda para un tenant específico.
 */
export async function getStoreSettings(tenantId: string): Promise<StoreSettings | null> {
    const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No existe configuración, es normal para nuevos tenants
            return null;
        }
        console.error('Error fetching store settings:', error);
        throw error;
    }

    return data;
}

/**
 * Actualiza o crea la configuración de la tienda.
 */
export async function updateStoreSettings(tenantId: string, settings: Partial<StoreSettings>) {
    // Limpiamos el objeto para evitar conflictos de ID si es un upsert por tenant_id
    const cleanSettings = { ...settings };
    delete cleanSettings.id;
    delete cleanSettings.updated_at;

    const { data, error } = await supabase
        .from('store_settings')
        .upsert({
            ...cleanSettings,
            tenant_id: tenantId,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'tenant_id'
        })
        .select()
        .single();

    if (error) {
        console.error('Error updating store settings (detallado):', JSON.stringify(error, null, 2));
        throw new Error(`Configuración: ${error.message || 'Error desconocido'} (${error.code})`);
    }

    return data;
}
