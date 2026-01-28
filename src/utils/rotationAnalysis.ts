import type { Product } from '../types/inventory';
import type { Sale } from '../types/index';

/**
 * Analiza la rotación de productos basándose en las ventas
 * Identifica productos sin movimiento y calcula días desde última venta
 */

export interface ProductRotation {
    productId: string;
    productName: string;
    daysSinceLastSale: number;
    totalSales: number;
    lastSaleDate: Date | null;
    status: 'active' | 'slow' | 'dead';
}

export function analyzeProductRotation(
    products: Product[],
    sales: Sale[],
    daysThreshold = 30
): ProductRotation[] {
    const now = new Date();
    const rotationData: ProductRotation[] = [];

    products.forEach(product => {
        // Encontrar todas las ventas de este producto
        const productSales = sales.filter(sale =>
            sale.items?.some(item => item.productId === product.id)
        );

        let lastSaleDate: Date | null = null;
        let totalSales = 0;

        // Calcular última venta y total de ventas
        // Calcular última venta y total de ventas
        for (const sale of productSales) {
            const rawDate = sale.createdAt;
            const saleDate = rawDate instanceof Date ? rawDate : new Date(rawDate);

            if (!lastSaleDate || saleDate.getTime() > lastSaleDate.getTime()) {
                lastSaleDate = saleDate;
            }

            const productItem = sale.items?.find(item => item.productId === product.id);
            if (productItem) {
                totalSales += productItem.quantity || 0;
            }
        }

        // Calcular días desde última venta
        const daysSinceLastSale = lastSaleDate
            ? Math.floor((now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))
            : 999; // Si nunca se vendió, asignar un valor alto

        // Determinar estado
        let status: 'active' | 'slow' | 'dead' = 'active';
        if (daysSinceLastSale > 60) {
            status = 'dead';
        } else if (daysSinceLastSale > daysThreshold) {
            status = 'slow';
        }

        rotationData.push({
            productId: product.id,
            productName: product.name,
            daysSinceLastSale,
            totalSales,
            lastSaleDate,
            status
        });
    });

    // Ordenar por días sin vender (descendente)
    return rotationData.sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale);
}

/**
 * Obtiene productos sin movimiento en los últimos N días
 */
export function getDeadStock(
    products: Product[],
    sales: Sale[],
    daysThreshold = 60
): ProductRotation[] {
    const rotation = analyzeProductRotation(products, sales, daysThreshold);
    return rotation.filter(item => item.status === 'dead');
}

/**
 * Obtiene productos con rotación lenta
 */
export function getSlowMovingStock(
    products: Product[],
    sales: Sale[],
    daysThreshold = 30
): ProductRotation[] {
    const rotation = analyzeProductRotation(products, sales, daysThreshold);
    return rotation.filter(item => item.status === 'slow');
}
