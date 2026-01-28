import type { Product } from '../types/inventory';
import type { Sale } from '../types/index';

/**
 * Análisis de rentabilidad por producto
 * Calcula márgenes, ROI y clasifica productos según su desempeño
 */

export interface ProductProfitability {
    productId: string;
    productName: string;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number; // Porcentaje
    unitsSold: number;
    avgSalePrice: number;
    category: string;
    classification: 'star' | 'cash-cow' | 'question-mark' | 'dog';
}

export function analyzeProfitability(
    products: Product[],
    sales: Sale[]
): ProductProfitability[] {
    const profitabilityData: ProductProfitability[] = [];

    products.forEach(product => {
        let totalRevenue = 0;
        let totalCost = 0;
        let unitsSold = 0;

        // Calcular ventas totales del producto
        sales.forEach(sale => {
            const productItem = sale.items?.find(item => item.productId === product.id);
            if (productItem) {
                const quantity = productItem.quantity || 0;
                const unitPrice = productItem.unitPrice || 0;
                const itemTotal = productItem.total || (quantity * unitPrice);

                totalRevenue += itemTotal;
                totalCost += quantity * (product.costPrice || 0);
                unitsSold += quantity;
            }
        });

        // Calcular métricas
        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        const avgSalePrice = unitsSold > 0 ? totalRevenue / unitsSold : 0;

        // Clasificar producto (Matriz BCG simplificada)
        const classification = classifyProduct(unitsSold, profitMargin);

        profitabilityData.push({
            productId: product.id,
            productName: product.name,
            totalRevenue,
            totalCost,
            totalProfit,
            profitMargin,
            unitsSold,
            avgSalePrice,
            category: product.category || 'Sin categoría',
            classification
        });
    });

    // Ordenar por margen de ganancia (descendente)
    return profitabilityData.sort((a, b) => b.profitMargin - a.profitMargin);
}

/**
 * Clasifica productos según volumen y margen
 * - Star: Alto volumen + Alto margen (>20%)
 * - Cash Cow: Alto volumen + Margen medio (10-20%)
 * - Question Mark: Bajo volumen + Alto margen
 * - Dog: Bajo volumen + Bajo margen
 */
function classifyProduct(
    unitsSold: number,
    profitMargin: number
): 'star' | 'cash-cow' | 'question-mark' | 'dog' {
    const isHighVolume = unitsSold > 10; // Umbral ajustable
    const isHighMargin = profitMargin > 20;
    const isMediumMargin = profitMargin >= 10 && profitMargin <= 20;

    if (isHighVolume && isHighMargin) return 'star';
    if (isHighVolume && isMediumMargin) return 'cash-cow';
    if (!isHighVolume && isHighMargin) return 'question-mark';
    return 'dog';
}

/**
 * Obtiene los productos más rentables
 */
export function getTopProfitableProducts(
    products: Product[],
    sales: Sale[],
    limit = 5
): ProductProfitability[] {
    const profitability = analyzeProfitability(products, sales);
    return profitability.slice(0, limit);
}

/**
 * Obtiene productos con bajo margen (requieren atención)
 */
export function getLowMarginProducts(
    products: Product[],
    sales: Sale[],
    marginThreshold = 10
): ProductProfitability[] {
    const profitability = analyzeProfitability(products, sales);
    return profitability.filter(p => p.profitMargin < marginThreshold && p.unitsSold > 0);
}

/**
 * Calcula el margen promedio de toda la tienda
 */
export function getAverageStoreMargin(
    products: Product[],
    sales: Sale[]
): number {
    const profitability = analyzeProfitability(products, sales);
    const productsWithSales = profitability.filter(p => p.unitsSold > 0);

    if (productsWithSales.length === 0) return 0;

    const totalMargin = productsWithSales.reduce((sum, p) => sum + p.profitMargin, 0);
    return totalMargin / productsWithSales.length;
}
