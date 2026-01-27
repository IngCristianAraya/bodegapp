import { supabase } from './supabase';
import type { Customer } from '../types/index';

export async function crearCliente(data: Omit<Customer, 'id'>, tenantId: string): Promise<string> {
    const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert([{
            tenant_id: tenantId,
            name: data.name,
            phone: data.phone,
            address: data.address,
            email: data.email,
            total_purchases: 0,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creando cliente:', error);
        throw error;
    }
    return newCustomer.id;
}

export async function obtenerClientes(tenantId: string): Promise<Customer[]> {
    if (!tenantId) return [];

    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId);

    if (error) {
        console.error('Error obteniendo clientes:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        address: item.address,
        email: item.email,
        totalPurchases: Number(item.total_purchases),
        createdAt: new Date(item.created_at)
    }));
}

export async function actualizarCliente(id: string, data: Partial<Customer>, tenantId: string) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;
    if (data.address) updateData.address = data.address;
    if (data.email) updateData.email = data.email;
    if (data.totalPurchases !== undefined) updateData.total_purchases = data.totalPurchases;

    const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) throw error;
}

export async function eliminarCliente(id: string, tenantId: string) {
    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) throw error;
}

