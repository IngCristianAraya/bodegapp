import { supabase } from './supabase';

/**
 * Obtiene los datos de un tenant basado en su subdominio.
 * Útil para el middleware o para cargar la configuración inicial de la tienda.
 */
export async function getTenantBySubdomain(subdomain: string) {
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .single();

    if (error) {
        console.error('Error fetching tenant:', error);
        return null;
    }

    return data;
}

/**
 * Función para registrar un nuevo tenant (Onboarding)
 */
export async function createTenant(tenantData: { name: string; subdomain: string; owner_id: string }) {
    const { data, error } = await supabase
        .from('tenants')
        .insert([tenantData])
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Función para inicializar la configuración de la tienda para un nuevo tenant
 */
export async function initTenantSettings(tenantId: string, businessName: string) {
    const { error } = await supabase
        .from('store_settings')
        .insert([{
            tenant_id: tenantId,
            business_name: businessName
        }]);

    if (error) throw error;
}
