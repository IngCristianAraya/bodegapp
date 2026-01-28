import { supabase } from './supabase';
import type { Supplier } from '../types/index';

export async function crearProveedor(data: Omit<Supplier, 'id'>, tenantId: string): Promise<string> {
    const { data: newSupplier, error } = await supabase
        .from('suppliers')
        .insert([{
            tenant_id: tenantId,
            name: data.name,
            contact: data.contact,
            phone: data.phone,
            email: data.email,
            address: data.address,
            ruc: data.ruc,
            delivery_days: data.deliveryDays,
            rating: data.rating,
            notes: data.notes,
            category: data.category,
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creando proveedor:', error);
        throw error;
    }
    return newSupplier.id;
}

export async function obtenerProveedores(tenantId: string): Promise<Supplier[]> {
    if (!tenantId) return [];

    const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('tenant_id', tenantId);

    if (error) {
        console.error('Error obteniendo proveedores:', error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        contact: item.contact,
        phone: item.phone,
        email: item.email,
        address: item.address,
        ruc: item.ruc,
        deliveryDays: item.delivery_days || [],
        rating: item.rating || 0,
        notes: item.notes,
        category: item.category,
        products: [],
        createdAt: new Date(item.created_at)
    }));
}

export async function actualizarProveedor(id: string, data: Partial<Supplier>, tenantId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.contact) updateData.contact = data.contact;
    if (data.phone) updateData.phone = data.phone;
    if (data.email) updateData.email = data.email;
    if (data.address) updateData.address = data.address;
    if (data.ruc) updateData.ruc = data.ruc;
    if (data.deliveryDays) updateData.delivery_days = data.deliveryDays;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.notes) updateData.notes = data.notes;
    if (data.category) updateData.category = data.category;

    const { error } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) throw error;
}

export async function eliminarProveedor(id: string, tenantId: string) {
    const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) throw error;
}

