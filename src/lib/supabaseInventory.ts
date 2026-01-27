import { supabase } from './supabase';
import type { Product, InventoryMovement } from '../types/inventory';

export async function crearProducto(
    producto: Omit<Product, 'id' | 'stock' | 'averageCost' | 'createdAt' | 'updatedAt'>,
    primerIngreso: { quantity: number; costPrice: number; date?: string },
    tenantId: string
) {
    const productData: any = {
        ...producto,
        tenant_id: tenantId,
        min_stock: producto.minStock,
        sale_price: producto.salePrice,
        cost_price: producto.costPrice,
        image_url: producto.imageUrl,
        unit_type: producto.unitType,
        is_exempt_igv: producto.isExemptIGV,
        is_exonerated: producto.isExonerated,
        igv_included: producto.igvIncluded,
        venta_por_peso: producto.ventaPorPeso,

        stock: primerIngreso.quantity,
        average_cost: primerIngreso.costPrice,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    Object.keys(productData).forEach(key => productData[key] === undefined && delete productData[key]);

    delete productData.minStock;
    delete productData.salePrice;
    delete productData.costPrice;
    delete productData.averageCost;
    delete productData.imageUrl;
    delete productData.unitType;
    delete productData.isExemptIGV;
    delete productData.isExonerated;
    delete productData.igvIncluded;
    delete productData.ventaPorPeso;

    const { data: newProduct, error: prodError } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

    if (prodError) {
        console.error('Error Supabase creando producto:', prodError);
        throw new Error(`Error al crear producto: ${prodError.message}`);
    }
    const productId = newProduct.id;

    const movementData = {
        tenant_id: tenantId,
        product_id: productId,
        product_name: productData.name,
        quantity: primerIngreso.quantity,
        cost_price: primerIngreso.costPrice,
        date: primerIngreso.date || new Date().toISOString(),
        type: 'ingreso',
        cashier_name: 'Sistema (SaaS)',
        initial_stock: 0,
        final_stock: primerIngreso.quantity
    };

    const { error: movError } = await supabase
        .from('inventory_movements')
        .insert([movementData]);

    if (movError) {
        console.error('Error creando movimiento inicial:', movError);
        await supabase.from('products').delete().eq('id', productId).eq('tenant_id', tenantId);
        throw new Error(`Error al registrar stock inicial: ${movError.message}`);
    }

    return productId;
}

export async function agregarIngresoProducto(
    productId: string,
    tenantId: string,
    ingreso: { quantity: number; costPrice: number; date?: string; type?: string; motivo?: string }
) {
    if (!ingreso.quantity || ingreso.quantity === 0) return;

    const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('tenant_id', tenantId)
        .single();

    if (fetchError || !product) throw new Error('Producto no encontrado');

    const currentStock = Number(product.stock) || 0;
    const newStock = currentStock + ingreso.quantity;
    const currentAvg = Number(product.average_cost) || 0;

    let newAvgCost = currentAvg;
    if (ingreso.type === 'ingreso' && ingreso.quantity > 0) {
        const totalValor = (currentStock * currentAvg) + (ingreso.quantity * ingreso.costPrice);
        newAvgCost = totalValor / newStock;
    }

    const movementData = {
        tenant_id: tenantId,
        product_id: productId,
        product_name: product.name,
        quantity: ingreso.quantity,
        cost_price: ingreso.costPrice,
        date: ingreso.date || new Date().toISOString(),
        type: ingreso.type || 'ingreso',
        motivo: ingreso.motivo,
        initial_stock: currentStock,
        final_stock: newStock,
    };

    const { error: movError } = await supabase
        .from('inventory_movements')
        .insert([movementData]);

    if (movError) throw movError;

    const { error: updateError } = await supabase
        .from('products')
        .update({
            stock: newStock,
            average_cost: newAvgCost,
            updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('tenant_id', tenantId);

    if (updateError) throw updateError;
}

export async function obtenerTodosMovimientosInventario(tenantId: string): Promise<InventoryMovement[]> {
    if (!tenantId) return [];

    const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error obteniendo movimientos:', error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((m: any) => ({
        id: m.id,
        productId: m.product_id,
        productName: m.product_name,
        quantity: Number(m.quantity),
        costPrice: Number(m.cost_price),
        date: m.date,
        type: m.type as 'ingreso' | 'egreso' | 'ajuste',
        motivo: m.motivo,
        cashierName: m.cashier_name,
        initialStock: Number(m.initial_stock),
        finalStock: Number(m.final_stock),
    }));
}

export async function obtenerMovimientosProducto(productId: string, tenantId: string): Promise<InventoryMovement[]> {
    if (!tenantId) return [];

    const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('product_id', productId)
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error obteniendo movimientos del producto:', error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((m: any) => ({
        id: m.id,
        productId: m.product_id,
        productName: m.product_name,
        quantity: Number(m.quantity),
        costPrice: Number(m.cost_price),
        date: m.date,
        type: m.type as 'ingreso' | 'egreso' | 'ajuste',
        motivo: m.motivo,
        cashierName: m.cashier_name,
        initialStock: Number(m.initial_stock),
        finalStock: Number(m.final_stock),
    }));
}

export async function obtenerProductosConStockYAverage(tenantId: string) {
    const { obtenerProductos } = await import('./supabaseProducts');
    return obtenerProductos(tenantId);
}

