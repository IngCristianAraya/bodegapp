import { supabase } from './supabase';

export interface CashRegister {
    id: string;
    tenant_id: string;
    opening_amount: number;
    closing_amount?: number;
    expected_amount?: number;
    status: 'open' | 'closed';
    opened_at: string;
    closed_at?: string;
    notes?: string;
}

export interface CashMovement {
    id: string;
    cash_register_id: string;
    type: 'ingreso' | 'egreso';
    amount: number;
    description: string;
    created_at: string;
}

export interface CashRegisterSummary {
    opening_amount: number;
    total_sales_cash: number;
    total_sales_digital: number;
    total_ingresos: number;
    total_egresos: number;
    expected_amount: number;
}

export async function obtenerCajaActiva(tenantId: string): Promise<CashRegister | null> {
    const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'open')
        .maybeSingle();

    if (error) {
        console.error('Error obteniendo caja activa:', error);
        return null; // Graceful fallback
    }

    return data;
}

export async function abrirCaja(tenantId: string, openingAmount: number): Promise<CashRegister | null> {
    // Verificar si ya hay una abierta
    const activa = await obtenerCajaActiva(tenantId);
    if (activa) throw new Error('Ya existe una caja abierta.');

    const { data, error } = await supabase
        .from('cash_registers')
        .insert([{
            tenant_id: tenantId,
            opening_amount: openingAmount,
            status: 'open',
            opened_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function cerrarCaja(
    registerId: string,
    tenantId: string,
    closingAmount: number,
    expectedAmount: number,
    notes?: string,
    totals?: {
        salesCash: number;
        salesDigital: number;
        ingresos: number;
        egresos: number;
    }
): Promise<void> {
    const { error } = await supabase
        .from('cash_registers')
        .update({
            status: 'closed',
            closing_amount: closingAmount,
            expected_amount: expectedAmount,
            closed_at: new Date().toISOString(),
            notes: notes,
            // Guardar históricos si existen
            total_sales_cash: totals?.salesCash || 0,
            total_sales_digital: totals?.salesDigital || 0,
            total_ingresos: totals?.ingresos || 0,
            total_egresos: totals?.egresos || 0
        })
        .eq('id', registerId)
        .eq('tenant_id', tenantId);

    if (error) throw error;
}

export async function registrarMovimiento(
    tenantId: string,
    registerId: string,
    type: 'ingreso' | 'egreso',
    amount: number,
    description: string
): Promise<void> {
    const { error } = await supabase
        .from('cash_movements')
        .insert([{
            tenant_id: tenantId,
            cash_register_id: registerId,
            type,
            amount,
            description
        }]);

    if (error) throw error;
}

export async function obtenerResumenCaja(registerId: string, tenantId: string): Promise<CashRegisterSummary> {
    // 1. Obtener datos de la caja
    const { data: register, error: regError } = await supabase
        .from('cash_registers')
        .select('opening_amount, opened_at')
        .eq('id', registerId)
        .single();

    if (regError || !register) throw new Error('Error al obtener datos de la caja');

    // 2. Obtener ventas en EFECTIVO desde que se abrió
    // NOTA: Esto asume que las ventas tienen 'created_at' >= opened_at.
    // Para mayor precisión, idealmente cada venta tendría `cash_register_id`,
    // pero por ahora usaremos rango de fechas.
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total, payment_method')
        .eq('tenant_id', tenantId)
        .gte('created_at', register.opened_at);

    if (salesError) throw new Error('Error al calcular ventas');

    // Define temporary interface for sales accumulator
    interface SaleCalc {
        total: number;
        payment_method: string;
    }

    const totalSalesCash = (sales as SaleCalc[])
        ?.filter((s) => s.payment_method === 'cash')
        .reduce((sum: number, sale: SaleCalc) => sum + (Number(sale.total) || 0), 0) || 0;

    const totalSalesDigital = (sales as SaleCalc[])
        ?.filter((s) => s.payment_method !== 'cash') // yape, plin, card
        .reduce((sum: number, sale: SaleCalc) => sum + (Number(sale.total) || 0), 0) || 0;

    // 3. Obtener movimientos manuales
    const { data: movements, error: movError } = await supabase
        .from('cash_movements')
        .select('type, amount')
        .eq('cash_register_id', registerId);

    if (movError) throw new Error('Error al obtener movimientos');

    const totalIngresos = movements
        ?.filter(m => m.type === 'ingreso')
        .reduce((sum, m) => sum + Number(m.amount), 0) || 0;

    const totalEgresos = movements
        ?.filter(m => m.type === 'egreso')
        .reduce((sum, m) => sum + Number(m.amount), 0) || 0;

    const expectedAmount = Number(register.opening_amount) + totalSalesCash + totalIngresos - totalEgresos;

    return {
        opening_amount: Number(register.opening_amount), // Renamed from initialAmount for consistency
        total_sales_cash: totalSalesCash,
        total_sales_digital: totalSalesDigital,
        total_ingresos: totalIngresos,
        total_egresos: totalEgresos,
        expected_amount: expectedAmount
    };
}

export async function obtenerHistorialCajas(tenantId: string): Promise<CashRegister[]> {
    const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'closed')
        .order('closed_at', { ascending: false });

    if (error) {
        console.error('Error obteniendo historial de cajas:', error);
        return [];
    }

    return data;
}

// Helper para recalcular totales históricos (útil si hubo errores de sincronización)
export async function recalculateRegisterTotals(registerId: string, tenantId: string): Promise<boolean> {
    // 1. Obtener la caja cerrada
    const { data: register, error: regError } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('id', registerId)
        .eq('tenant_id', tenantId)
        .single();

    if (regError || !register || !register.closed_at) {
        console.error('Error fetching register for recalc:', regError);
        return false;
    }

    // 2. Obtener ventas en ese rango
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total, payment_method')
        .eq('tenant_id', tenantId)
        .gte('created_at', register.opened_at)
        .lte('created_at', register.closed_at);

    if (salesError) {
        console.error('Error fetching sales for recalc:', salesError);
        return false;
    }

    // 3. Recalcular
    interface SaleCalc { total: number; payment_method: string; }

    let calcCash = 0;
    let calcDigital = 0;

    (sales as SaleCalc[] || []).forEach(s => {
        const amount = Number(s.total) || 0;
        if (s.payment_method === 'cash') {
            calcCash += amount;
        } else {
            calcDigital += amount;
        }
    });

    // 4. Actualizar registro
    // Nota: Recalculamos el esperado también, asumiendo ingresos/egresos ya están correctos en DB
    const expected = Number(register.opening_amount) + calcCash + (Number(register.total_ingresos) || 0) - (Number(register.total_egresos) || 0);

    const { error: updateError } = await supabase
        .from('cash_registers')
        .update({
            total_sales_cash: calcCash,
            total_sales_digital: calcDigital,
            expected_amount: expected
        })
        .eq('id', registerId);

    if (updateError) {
        console.error('Error updating register:', updateError);
        return false;
    }

    return true;
}
