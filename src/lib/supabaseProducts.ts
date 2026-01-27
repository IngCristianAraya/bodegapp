import { supabase } from './supabase';
import type { Product } from '../types/inventory';

export async function crearProducto(producto: Partial<Product>, tenantId: string) {
    const cleanProduct: Record<string, unknown> = {
        tenant_id: tenantId
    };

    Object.entries(producto).forEach(([key, value]: [string, unknown]) => {
        if (value !== undefined && value !== null && value !== "") {
            let dbKey = key;
            if (key === 'minStock') dbKey = 'min_stock';
            if (key === 'salePrice') dbKey = 'sale_price';
            if (key === 'costPrice') dbKey = 'cost_price';
            if (key === 'averageCost') dbKey = 'average_cost';
            if (key === 'imageUrl') dbKey = 'image_url';
            if (key === 'unitType') dbKey = 'unit_type';
            if (key === 'isExemptIGV') dbKey = 'is_exempt_igv';
            if (key === 'isExonerated') dbKey = 'is_exonerated';
            if (key === 'igvIncluded') dbKey = 'igv_included';
            if (key === 'ventaPorPeso') dbKey = 'venta_por_peso';

            cleanProduct[dbKey] = value;
        }
    });

    const { data, error } = await supabase
        .from('products')
        .insert([
            {
                ...cleanProduct,
                is_exempt_igv: !!producto.isExemptIGV,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        ])
        .select();

    if (error) {
        console.error('Error creando producto:', error);
        throw error;
    }
    return data;
}

export async function obtenerProductos(tenantId: string) {
    if (!tenantId) return [];

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId);

    if (error) {
        console.error('Error obteniendo productos:', error);
        throw error;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        code: item.code || '',
        category: item.category || '',
        subcategory: item.subcategory || '',
        unit: item.unit || '',
        unitType: (item.unit_type || 'unidad') as 'unidad' | 'kg',
        stock: Number(item.stock) || 0,
        minStock: Number(item.min_stock) || 3,
        salePrice: Number(item.sale_price) || 0,
        costPrice: Number(item.cost_price) || 0,
        averageCost: Number(item.average_cost) || 0,
        supplier: item.supplier || '',
        imageUrl: item.image_url || '',
        barcode: item.barcode || '',
        isExemptIGV: !!item.is_exempt_igv,
        isExonerated: !!item.is_exonerated,
        igvIncluded: item.igv_included ?? true,
        ventaPorPeso: !!item.venta_por_peso,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
    }));
}

export async function actualizarProducto(id: string, data: Partial<Product>, tenantId: string) {
    const updateData: Record<string, any> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.minStock !== undefined) updateData.min_stock = data.minStock;
    if (data.salePrice !== undefined) updateData.sale_price = data.salePrice;
    if (data.costPrice !== undefined) updateData.cost_price = data.costPrice;
    if (data.averageCost !== undefined) updateData.average_cost = data.averageCost;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.isExemptIGV !== undefined) updateData.is_exempt_igv = data.isExemptIGV;

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) {
        console.error('Error actualizando producto:', error);
        throw error;
    }
}

export async function eliminarProducto(id: string, tenantId: string) {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) {
        console.error('Error eliminando producto:', error);
        throw error;
    }
}

