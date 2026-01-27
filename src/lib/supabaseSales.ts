import { supabase } from './supabase';
import type { Sale, SaleItem } from '../types/index';

export async function obtenerVentas(tenantId: string): Promise<Sale[]> {
    if (!tenantId) return [];

    const { data, error } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .eq('tenant_id', tenantId);

    if (error) {
        console.error('Error obteniendo ventas:', error);
        return [];
    }

    return data.map((sale: any) => ({
        id: sale.id,
        receiptNumber: sale.receipt_number || '',
        cashierId: sale.cashier_id || '',
        cashierName: sale.cashier_name || '',
        customerId: sale.customer_id,
        customerName: sale.customer_name || '',
        total: Number(sale.total) || 0,
        subtotal: Number(sale.subtotal) || 0,
        discount: Number(sale.discount) || 0,
        tax: Number(sale.tax) || 0,
        paymentMethod: sale.payment_method || '',
        createdAt: sale.created_at ? new Date(sale.created_at) : new Date(),

        items: Array.isArray(sale.sale_items)
            ? sale.sale_items.map((item: any) => ({
                productId: item.product_id,
                productName: item.product_name,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unit_price),
                total: Number(item.total)
            }))
            : []
    }));
}

export async function crearVenta(sale: Sale, tenantId: string): Promise<string> {
    const { items, ...saleHeader } = sale;

    const { data: newSale, error: saleError } = await supabase
        .from('sales')
        .insert([{
            id: saleHeader.id,
            tenant_id: tenantId,
            receipt_number: saleHeader.receiptNumber,
            cashier_id: saleHeader.cashierId,
            cashier_name: saleHeader.cashierName,
            customer_id: saleHeader.customerId || null,
            customer_name: saleHeader.customerName,
            total: saleHeader.total,
            subtotal: saleHeader.subtotal,
            discount: saleHeader.discount,
            tax: saleHeader.tax,
            payment_method: saleHeader.paymentMethod,
            created_at: saleHeader.createdAt instanceof Date
                ? saleHeader.createdAt.toISOString()
                : (saleHeader.createdAt || new Date().toISOString())
        }])
        .select()
        .single();

    if (saleError) throw saleError;
    const saleId = newSale.id;

    if (items && items.length > 0) {
        const itemsData = items.map((item: SaleItem) => ({
            tenant_id: tenantId,
            sale_id: saleId,
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total: typeof item.total === 'number' ? item.total : (item.unitPrice * item.quantity)
        }));

        const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(itemsData);

        if (itemsError) {
            console.error('Error insertando items de venta:', itemsError);
        }
    }

    await descontarStockProductos(items, tenantId);

    return saleId;
}

export async function descontarStockProductos(items: SaleItem[], tenantId: string) {
    for (const item of items) {
        const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.productId)
            .eq('tenant_id', tenantId)
            .single();

        if (product) {
            const newStock = Number(product.stock) - item.quantity;
            await supabase
                .from('products')
                .update({ stock: newStock, updated_at: new Date().toISOString() })
                .eq('id', item.productId)
                .eq('tenant_id', tenantId);

            await supabase.from('inventory_movements').insert([{
                tenant_id: tenantId,
                product_id: item.productId,
                quantity: item.quantity * -1,
                type: 'egreso',
                date: new Date().toISOString(),
                product_name: item.productName,
                motivo: 'Venta',
                initial_stock: product.stock,
                final_stock: newStock
            }]);
        }
    }
}

export async function actualizarVenta(id: string, data: Partial<Sale>, tenantId: string) {
    const updateData: any = {};
    if (data.cashierName) updateData.cashier_name = data.cashierName;

    const { error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) throw error;
}

export async function eliminarVenta(id: string, tenantId: string) {
    const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) throw error;
}

