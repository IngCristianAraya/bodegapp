import type { Sale } from '../types/index';

/**
 * Análisis temporal comparativo
 * Compara métricas actuales con períodos anteriores
 */

export interface PeriodComparison {
    current: PeriodMetrics;
    previous: PeriodMetrics;
    change: {
        sales: number; // Porcentaje
        orders: number; // Porcentaje
        avgTicket: number; // Porcentaje
    };
}

export interface PeriodMetrics {
    totalSales: number;
    totalOrders: number;
    avgTicket: number;
    startDate: Date;
    endDate: Date;
}

/**
 * Calcula métricas para un período específico
 */
function calculatePeriodMetrics(
    sales: Sale[],
    startDate: Date,
    endDate: Date
): PeriodMetrics {
    const periodSales = sales.filter(sale => {
        const saleDate = sale.createdAt instanceof Date ? sale.createdAt : new Date(sale.createdAt);
        return saleDate >= startDate && saleDate <= endDate;
    });

    const totalSales = periodSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalOrders = periodSales.length;
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
        totalSales,
        totalOrders,
        avgTicket,
        startDate,
        endDate
    };
}

/**
 * Compara la semana actual con la semana anterior
 */
export function compareWeeks(sales: Sale[]): PeriodComparison {
    const now = new Date();

    // Semana actual (últimos 7 días)
    const currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const currentEnd = now;

    // Semana anterior (días 8-14 atrás)
    const previousStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const previousEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const current = calculatePeriodMetrics(sales, currentStart, currentEnd);
    const previous = calculatePeriodMetrics(sales, previousStart, previousEnd);

    return {
        current,
        previous,
        change: {
            sales: calculatePercentageChange(previous.totalSales, current.totalSales),
            orders: calculatePercentageChange(previous.totalOrders, current.totalOrders),
            avgTicket: calculatePercentageChange(previous.avgTicket, current.avgTicket)
        }
    };
}

/**
 * Compara el mes actual con el mes anterior
 */
export function compareMonths(sales: Sale[]): PeriodComparison {
    const now = new Date();

    // Mes actual (últimos 30 días)
    const currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const currentEnd = now;

    // Mes anterior (días 31-60 atrás)
    const previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const previousEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const current = calculatePeriodMetrics(sales, currentStart, currentEnd);
    const previous = calculatePeriodMetrics(sales, previousStart, previousEnd);

    return {
        current,
        previous,
        change: {
            sales: calculatePercentageChange(previous.totalSales, current.totalSales),
            orders: calculatePercentageChange(previous.totalOrders, current.totalOrders),
            avgTicket: calculatePercentageChange(previous.avgTicket, current.avgTicket)
        }
    };
}

/**
 * Calcula el cambio porcentual entre dos valores
 */
function calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Determina la tendencia general del negocio
 */
export function getBusinessTrend(sales: Sale[]): {
    trend: 'growing' | 'stable' | 'declining';
    strength: 'strong' | 'moderate' | 'weak';
    weeklyChange: number;
    monthlyChange: number;
} {
    const weekComparison = compareWeeks(sales);
    const monthComparison = compareMonths(sales);

    const weeklyChange = weekComparison.change.sales;
    const monthlyChange = monthComparison.change.sales;

    // Determinar tendencia
    let trend: 'growing' | 'stable' | 'declining' = 'stable';
    if (weeklyChange > 5 && monthlyChange > 5) {
        trend = 'growing';
    } else if (weeklyChange < -5 && monthlyChange < -5) {
        trend = 'declining';
    }

    // Determinar fuerza de la tendencia
    let strength: 'strong' | 'moderate' | 'weak' = 'weak';
    const avgChange = (Math.abs(weeklyChange) + Math.abs(monthlyChange)) / 2;
    if (avgChange > 20) {
        strength = 'strong';
    } else if (avgChange > 10) {
        strength = 'moderate';
    }

    return {
        trend,
        strength,
        weeklyChange,
        monthlyChange
    };
}
