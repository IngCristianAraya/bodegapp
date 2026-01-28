import { supabase } from './supabase';

/**
 * Obtiene los datos de un tenant basado en su subdominio.
 * Útil para el middleware o para cargar la configuración inicial de la tienda.
 */
export async function getTenantBySubdomain(subdomain: string) {
    console.log('--- Supabase Debug: getTenantBySubdomain START ---');
    console.log('Searching for subdomain:', subdomain);

    const { data, error, status, statusText } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain);

    console.log('Supabase Response Raw:', { data, error, status, statusText });

    if (error) {
        console.error('CRITICAL: Supabase Error fetching tenant:', error);
        return null;
    }

    if (!data || data.length === 0) {
        console.warn('WARNING: No tenant found in DB for subdomain:', subdomain);
        return null;
    }

    console.log('SUCCESS: Tenant found:', data[0]);
    console.log('--- Supabase Debug: getTenantBySubdomain END ---');
    return data[0];
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
