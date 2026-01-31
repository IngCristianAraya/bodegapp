import React from 'react';
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Sale, Product, Expense } from '../../types/index';
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Package } from 'lucide-react';

interface ReportsDashboardProps {
    ventas: Sale[];
    productos: Product[];
    gastos: Expense[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ ventas, productos, gastos }) => {

    // --- 1. Key Metrics ---
    const totalVentas = ventas.reduce((acc, v) => acc + (v.total || 0), 0);
    const totalCostos = ventas.reduce((acc, v) => {
        let cost = 0;
        v.items?.forEach(i => {
            const p = productos.find(prod => prod.id === i.productId || prod.name === i.productName);
            const unitCost = p?.averageCost || p?.costPrice || 0;
            cost += (i.quantity * unitCost);
        });
        return acc + cost;
    }, 0);

    const totalGastosOperativos = gastos.reduce((acc, g) => {
        // Only count expenses paid from cash for Net Profit calculation if requested by user logic
        // Given the user request: "Net Profit appears negative... make it not subtract if not paid from cash"
        if (g.paidFromCash) {
            return acc + (Number(g.amount) || 0);
        }
        return acc;
    }, 0);

    // Total expenses overall (for the Expenses Card context)
    const totalGastosReales = gastos.reduce((acc, g) => acc + (Number(g.amount) || 0), 0);

    const gananciaBruta = totalVentas - totalCostos;
    const gananciaNeta = gananciaBruta - totalGastosOperativos; // Now only subtracts cash expenses


    const margen = totalVentas > 0 ? (gananciaNeta / totalVentas) * 100 : 0;

    // --- 2. Charts Data Preparation ---

    // A. Sales vs Profit (Last 7 days or all time grouped by day)
    const getDailyData = () => {
        const data: Record<string, { name: string, ventas: number, ganancia: number }> = {};
        const sortedSales = [...ventas].sort((a, b) => {
            const dateA = new Date(a.createdAt instanceof Object && 'seconds' in a.createdAt ? (a.createdAt as { seconds: number }).seconds * 1000 : a.createdAt);
            const dateB = new Date(b.createdAt instanceof Object && 'seconds' in b.createdAt ? (b.createdAt as { seconds: number }).seconds * 1000 : b.createdAt);
            return dateA.getTime() - dateB.getTime();
        });

        sortedSales.forEach(v => {
            const d = new Date(v.createdAt instanceof Object && 'seconds' in v.createdAt ? (v.createdAt as { seconds: number }).seconds * 1000 : v.createdAt);
            // Group by Day/Month
            const key = d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
            if (!data[key]) data[key] = { name: key, ventas: 0, ganancia: 0 };

            let saleCost = 0;
            v.items?.forEach(i => {
                const p = productos.find(prod => prod.id === i.productId || prod.name === i.productName);
                saleCost += (i.quantity * (p?.averageCost || 0));
            });

            data[key].ventas += (v.total || 0);
            data[key].ganancia += ((v.total || 0) - saleCost);
        });
        // Take last 7-14 entries for cleaner chart if many
        const entries = Object.values(data);
        return entries.slice(-14);
    };

    const dailyData = getDailyData();

    // B. Sales by Category
    const getCategoryData = () => {
        const data: Record<string, number> = {};
        ventas.forEach(v => {
            v.items?.forEach(i => {
                const p = productos.find(prod => prod.id === i.productId || prod.name === i.productName);
                const cat = p?.category || 'Sin Categoría';
                if (!data[cat]) data[cat] = 0;
                data[cat] += (i.total || (i.quantity * i.unitPrice));
            });
        });

        return Object.entries(data)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 categories
    };

    const categoryData = getCategoryData();

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Ventas Totales</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">S/ {totalVentas.toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
                        <ArrowUpRight size={14} className="mr-1" />
                        <span>Ingresos brutos</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Ganancia Neta</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">S/ {gananciaNeta.toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-indigo-600 font-medium">
                        <span>Descontando costos y gastos</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Gastos de Caja</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">S/ {totalGastosOperativos.toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg">
                            <ArrowDownRight size={20} />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-400">
                        Total Registrado: S/ {totalGastosReales.toFixed(2)}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Margen Neto</p>
                            <h3 className={`text-2xl font-bold mt-1 ${margen >= 20 ? 'text-emerald-500' : margen >= 10 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {margen.toFixed(1)}%
                            </h3>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                            <Package size={20} />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-400">
                        Rentabilidad real del negocio
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Area Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Tendencia de Ventas vs Ganancias</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyData}>
                                <defs>
                                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorGanancia" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `S/${val}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
                                <Area type="monotone" dataKey="ganancia" name="Ganancia" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorGanancia)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Ventas por Categoría</h3>
                    <div className="h-[300px] w-full flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {categoryData.map((entry, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-gray-600 dark:text-gray-300">{entry.name}</span>
                                </div>
                                <span className="font-semibold text-gray-800 dark:text-white">S/ {entry.value.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsDashboard;
