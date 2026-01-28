import type { Product } from '../types/inventory';
import type { Sale } from '../types/index';

/**
 * Predicción de stock basada en velocidad de venta
 * Calcula cuándo se agotará un producto al ritmo actual
 */

export interface StockPrediction {
    productId: string;
    productName: string;
    currentStock: number;
    salesVelocity: number; // Unidades por día
    daysUntilStockout: number;
    reorderStatus: 'critical' | 'warning' | 'ok';
    suggestedReorderDate: Date | null;
    suggestedReorderQuantity: number;
}

/**
 * Calcula la velocidad de venta (unidades por día) de los últimos N días
 */
function calculateSalesVelocity(
    productId: string,
    sales: Sale[],
    days = 7
): number {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    let totalSold = 0;

    sales.forEach(sale => {
        const saleDate = sale.createdAt instanceof Date ? sale.createdAt : new Date(sale.createdAt);

        if (saleDate >= cutoffDate) {
            const productItem = sale.items?.find(item => item.productId === productId);
            if (productItem) {
                totalSold += productItem.quantity || 0;
            }
        }
    });

    return totalSold / days;
}

/**
 * Predice cuándo se agotará el stock de cada producto
 */
export function predictStockLevels(
    products: Product[],
    sales: Sale[],
    lookbackDays = 7,
    reorderLeadTimeDays = 3
): StockPrediction[] {
    const predictions: StockPrediction[] = [];

    products.forEach(product => {
        const currentStock = product.stock || 0;
        const salesVelocity = calculateSalesVelocity(product.id, sales, lookbackDays);

        // Calcular días hasta agotamiento
        const daysUntilStockout = salesVelocity > 0
            ? currentStock / salesVelocity
            : 999; // Si no hay ventas, asignar valor alto

        // Determinar estado de reorden
        let reorderStatus: 'critical' | 'warning' | 'ok' = 'ok';
        if (daysUntilStockout <= reorderLeadTimeDays) {
            reorderStatus = 'critical';
        } else if (daysUntilStockout <= reorderLeadTimeDays * 2) {
            reorderStatus = 'warning';
        }

        // Calcular fecha sugerida de reorden (antes del lead time)
        const suggestedReorderDate = salesVelocity > 0 && daysUntilStockout < 999
            ? new Date(Date.now() + (daysUntilStockout - reorderLeadTimeDays) * 24 * 60 * 60 * 1000)
            : null;

        // Calcular cantidad sugerida de reorden (para 14 días de stock)
        const suggestedReorderQuantity = Math.ceil(salesVelocity * 14);

        predictions.push({
            productId: product.id,
            productName: product.name,
            currentStock,
            salesVelocity,
            daysUntilStockout,
            reorderStatus,
            suggestedReorderDate,
            suggestedReorderQuantity
        });
    });

    // Ordenar por días hasta agotamiento (ascendente)
    return predictions.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
}

/**
 * Obtiene productos que requieren reorden urgente
 */
export function getCriticalStockAlerts(
    products: Product[],
    sales: Sale[],
    leadTimeDays = 3
): StockPrediction[] {
    const predictions = predictStockLevels(products, sales, 7, leadTimeDays);
    return predictions.filter(p => p.reorderStatus === 'critical' && p.salesVelocity > 0);
}

/**
 * Obtiene productos que pronto requerirán reorden
 */
export function getWarningStockAlerts(
    products: Product[],
    sales: Sale[],
    leadTimeDays = 3
): StockPrediction[] {
    const predictions = predictStockLevels(products, sales, 7, leadTimeDays);
    return predictions.filter(p => p.reorderStatus === 'warning' && p.salesVelocity > 0);
}

/**
 * Calcula el valor total en riesgo por agotamiento
 */
export function calculateStockoutRisk(
    products: Product[],
    sales: Sale[]
): { totalValue: number; affectedProducts: number } {
    const criticalAlerts = getCriticalStockAlerts(products, sales);

    const totalValue = criticalAlerts.reduce((sum, alert) => {
        const product = products.find(p => p.id === alert.productId);
        const productValue = (product?.costPrice || 0) * alert.currentStock;
        return sum + productValue;
    }, 0);

    return {
        totalValue,
        affectedProducts: criticalAlerts.length
    };
}
