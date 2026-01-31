/* eslint-disable @typescript-eslint/no-explicit-any */
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
        currentDebt: Number(item.current_debt || 0),
        creditLimit: item.credit_limit ? Number(item.credit_limit) : undefined,
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
    if (data.currentDebt !== undefined) updateData.current_debt = data.currentDebt;
    if (data.creditLimit !== undefined) updateData.credit_limit = data.creditLimit;

    const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) throw error;
}

export async function registrarPagoDeuda(
    customerId: string,
    amount: number,
    tenantId: string,
    notes?: string
): Promise<void> {

    // 1. Registrar el pago en la tabla debt_payments
    const { error: paymentError } = await supabase
        .from('debt_payments')
        .insert({
            customer_id: customerId,
            tenant_id: tenantId,
            amount: amount,
            notes: notes,
            date: new Date().toISOString()
        });

    if (paymentError) throw paymentError;

    // 2. Actualizar la deuda del cliente (reducirla)
    // Primero obtenemos el cliente actual para asegurar atomicidad o usamos RPC idealmente, 
    // pero por ahora haremos lectura-escritura
    const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('current_debt')
        .eq('id', customerId)
        .single();

    if (fetchError || !customer) throw new Error('Cliente no encontrado para actualizar deuda');

    const newDebt = Math.max(0, (customer.current_debt || 0) - amount);

    const { error: updateError } = await supabase
        .from('customers')
        .update({ current_debt: newDebt })
        .eq('id', customerId);

    if (updateError) throw updateError;
}

export async function eliminarCliente(id: string, tenantId: string) {
    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) throw error;
}

