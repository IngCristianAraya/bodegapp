
import React, { FC, useCallback, useEffect, useState, useMemo } from 'react';
import type { Product } from '../../types/inventory';
import type { Sale } from '../../types/index';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShoppingCart,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatsCard from './StatsCard';
import RotationAlert from './RotationAlert';
import ProfitabilityMatrix from './ProfitabilityMatrix';
import StockPredictionAlert from './StockPredictionAlert';
import TemporalComparison from './TemporalComparison';
import { obtenerVentas } from '../../lib/supabaseSales';
import { obtenerProductos } from '../../lib/supabaseProducts';
import { useTenant } from '../../contexts/TenantContext';
import { useLowStock } from '../../contexts/LowStockContext';
import { useToast } from '../../contexts/ToastContext';
import { calculateDailyEarnings } from '../../utils/calculateDailyEarnings';
import { analyzeProductRotation, getDeadStock, getSlowMovingStock } from '../../utils/rotationAnalysis';
import { analyzeProfitability, getAverageStoreMargin } from '../../utils/profitabilityAnalysis';
import { getCriticalStockAlerts, getWarningStockAlerts } from '../../utils/stockPrediction';
import { compareWeeks, compareMonths, getBusinessTrend } from '../../utils/temporalAnalysis';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

type Period = 'day' | 'week' | 'month';

interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  weekSales: number;
  monthSales: number;
  lowStockCount: number;
  topProducts: { name: string; sales: number; revenue: number }[];
}

const Dashboard: FC = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { criticalStockCount, lowStockCount } = useLowStock();
  const toast = useToast();
  const [ventas, setVentas] = useState<Sale[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; sales: number; revenue: number }[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [hasShownAlert, setHasShownAlert] = useState(false);

  // Calcular ventas reales de la semana agrupadas por día
  const salesData = useMemo(() => {
    // Inicializar estructura para cada día de la semana
    const hoy = new Date();
    // Buscar el lunes de la semana actual
    const primerDiaSemana = new Date(hoy);
    primerDiaSemana.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7)); // Lunes
    const ventasPorDia: Record<string, number> = {
      'Lun': 0, 'Mar': 0, 'Mie': 0, 'Jue': 0, 'Vie': 0, 'Sab': 0, 'Dom': 0
    };

    ventas.forEach(v => {
      if (!v.createdAt) return;
      const fecha = v.createdAt instanceof Date ? v.createdAt : new Date(v.createdAt);
      // Solo ventas de esta semana
      const diff = (fecha.getTime() - primerDiaSemana.getTime()) / (1000 * 60 * 60 * 24);
      if (diff < 0 || diff >= 7) return;

      const diaNombre = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][fecha.getDay()];
      ventasPorDia[diaNombre] += Number(v.total) || 0;
    });

    // Retornar en orden Lun-Dom
    return ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(dia => ({
      name: dia,
      ventas: ventasPorDia[dia]
    }));
  }, [ventas]);

  // Calcular ventas reales por categoría de los últimos 30 días
  const categoryData = React.useMemo(() => {
    const ventasPorCategoria: Record<string, number> = {};
    const hoy = new Date();

    ventas.forEach((v) => {
      if (!v.createdAt) return;
      const fecha = v.createdAt instanceof Date ? v.createdAt : new Date(v.createdAt);
      const diffDias = (hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDias > 30 || diffDias < 0) return;

      (v.items || []).forEach((item) => {
        const prod = productos.find(p => p.id === item.productId);
        const categoria = prod?.category || 'Otros';
        const valorItem = 'total' in item && item.total !== undefined
          ? Number(item.total)
          : ('salePrice' in item ? Number(item.salePrice) : 0) * (Number(item.quantity) || 0);

        ventasPorCategoria[categoria] = (ventasPorCategoria[categoria] || 0) + valorItem;
      });
    });

    return Object.entries(ventasPorCategoria)
      .filter(([, value]) => value > 0)
      .map(([name, value], index) => ({
        name,
        value: Number(value.toFixed(2)),
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [ventas, productos]);

  const filtrarVentasPorPeriodo = (ventas: Sale[], periodo: Period): Sale[] => {
    const ahora = new Date();
    const fechaLimite = new Date();

    switch (periodo) {
      case 'day': fechaLimite.setDate(ahora.getDate() - 1); break;
      case 'week': fechaLimite.setDate(ahora.getDate() - 7); break;
      case 'month': default: fechaLimite.setMonth(ahora.getMonth() - 1); break;
    }

    return ventas.filter(venta => {
      const fechaVenta = venta.createdAt instanceof Date ? venta.createdAt : new Date(venta.createdAt);
      return fechaVenta >= fechaLimite;
    });
  };

  const procesarProductosVendidos = useCallback((ventas: Sale[], productos: Product[]) => {
    const ventasFiltradas = filtrarVentasPorPeriodo(ventas, selectedPeriod);
    const productosVendidos = new Map<string, { name: string; sales: number; revenue: number }>();

    ventasFiltradas.forEach(venta => {
      (venta.items || []).forEach(item => {
        const producto = productos.find(p => p.id === item.productId);
        if (!producto) return;

        const cantidad = item.quantity || 0;
        const precio = Number(item.unitPrice) || 0;
        const total = Number(item.total) || precio * cantidad;

        const existente = productosVendidos.get(producto.id) || { name: producto.name, sales: 0, revenue: 0 };
        productosVendidos.set(producto.id, {
          name: producto.name,
          sales: existente.sales + cantidad,
          revenue: existente.revenue + total
        });
      });
    });

    return Array.from(productosVendidos.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [selectedPeriod]);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!tenant?.id) return;
      try {
        const [ventasCargadas, productosCargados] = await Promise.all([
          obtenerVentas(tenant.id),
          obtenerProductos(tenant.id)
        ]);
        setVentas(ventasCargadas);
        setProductos(productosCargados);
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      }
    };
    cargarDatos();
  }, [tenant?.id]);

  useEffect(() => {
    if (productos.length > 0 && ventas.length > 0) {
      setTopProducts(procesarProductosVendidos(ventas, productos));
    }
  }, [ventas, productos, selectedPeriod, procesarProductosVendidos]);

  // Show low stock alert on mount
  useEffect(() => {
    if (!hasShownAlert && criticalStockCount > 0) {
      toast.warning(`⚠️ ${criticalStockCount} producto${criticalStockCount > 1 ? 's' : ''} en stock crítico`);
      setHasShownAlert(true);
    }
  }, [criticalStockCount, hasShownAlert, toast]);

  // Cálculos rápidos
  const ventasHoy = ventas.filter(v => {
    if (!v.createdAt) return false;
    const fecha = v.createdAt instanceof Date ? v.createdAt : new Date(v.createdAt);
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }).reduce((acc, v) => acc + (Number(v.total) || 0), 0);

  const ordenesHoy = ventas.filter(v => {
    if (!v.createdAt) return false;
    const fecha = v.createdAt instanceof Date ? v.createdAt : new Date(v.createdAt);
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }).length;

  const gananciaHoy = calculateDailyEarnings(ventas, productos);
  const stockBajo = productos.filter(p => (p.stock ?? 0) <= (p.minStock ?? 3)).length;

  // Analytics: Rotación y Rentabilidad
  const rotationData = useMemo(() => {
    if (productos.length === 0 || ventas.length === 0) return { dead: [], slow: [] };
    return {
      dead: getDeadStock(productos, ventas, 60),
      slow: getSlowMovingStock(productos, ventas, 30)
    };
  }, [productos, ventas]);

  const profitabilityData = useMemo(() => {
    if (productos.length === 0 || ventas.length === 0) return [];
    return analyzeProfitability(productos, ventas);
  }, [productos, ventas]);

  const averageMargin = useMemo(() => {
    if (productos.length === 0 || ventas.length === 0) return 0;
    return getAverageStoreMargin(productos, ventas);
  }, [productos, ventas]);

  // Analytics: Predicción de Stock
  const stockPredictions = useMemo(() => {
    if (productos.length === 0 || ventas.length === 0) return { critical: [], warning: [] };
    return {
      critical: getCriticalStockAlerts(productos, ventas, 3),
      warning: getWarningStockAlerts(productos, ventas, 3)
    };
  }, [productos, ventas]);

  // Analytics: Comparación Temporal
  const temporalData = useMemo(() => {
    if (ventas.length === 0) return null;
    return {
      weekComparison: compareWeeks(ventas),
      monthComparison: compareMonths(ventas),
      trend: getBusinessTrend(ventas)
    };
  }, [ventas]);

  return (
    <div className="space-y-8 pb-8 animate-in fade-in zoom-in duration-500">
      {/* Header with Glass Effect */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight">
            Dashboard
            <span className="text-emerald-500">.</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">Resumen general de tu negocio</p>
        </div>

        <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/40 dark:border-white/10 shadow-sm">
          <Calendar className="text-emerald-600 dark:text-emerald-400" size={18} />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 capitalize">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Main Stats */}
        <StatsCard
          title="Ventas del Día"
          value={`S /.${ventasHoy.toLocaleString('es-PE', { minimumFractionDigits: 2 })} `}
          icon={DollarSign}
          color="bg-emerald-500"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Ganancias"
          value={`S /.${gananciaHoy.toLocaleString('es-PE', { minimumFractionDigits: 2 })} `}
          icon={TrendingUp}
          color="bg-amber-500"
          trend={{ value: 8.4, isPositive: true }}
        />
        <StatsCard
          title="Órdenes Hoy"
          value={ordenesHoy.toString()}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatsCard
          title="Stock Crítico"
          value={stockBajo.toString()}
          icon={AlertTriangle}
          color="bg-red-500"
          trend={{ value: 2, isPositive: false }}
        />

        {/* Charts Row */}
        <div className="lg:col-span-3 glass-card rounded-3xl p-6 min-h-[400px] flex flex-col bg-white/90 dark:bg-slate-900 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Activity className="text-emerald-600" size={20} />
              Rendimiento Semanal
            </h3>
            {/* Legend or actions could go here */}
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.1} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--chart-text)', fontSize: 13, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--chart-text)', fontSize: 13, fontWeight: 500 }}
                  tickFormatter={(value) => `S /.${value} `}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    padding: '10px',
                    color: '#000000',
                    fontWeight: 600
                  }}
                  itemStyle={{ color: '#10b981', fontWeight: 700 }}
                  formatter={(value: number) => [`S /.${value.toFixed(2)} `, 'Ventas']}
                />
                <Area
                  type="monotone"
                  dataKey="ventas"
                  stroke="#059669"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVentas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart - Vertical Card */}
        <div className="glass-card rounded-3xl p-6 flex flex-col h-[400px] bg-white/90 dark:bg-slate-900 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Por Categoría</h3>
          <div className="flex-1 relative">
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
                    <Cell key={`cell - ${index} `} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `S /.${value.toFixed(2)} `}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    borderColor: '#e5e7eb',
                    padding: '10px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    color: '#000000',
                    fontWeight: 600
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text overlay could go here */}
          </div>
          <div className="mt-4 space-y-2 overflow-y-auto max-h-[120px] custom-scrollbar">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[100px]">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{((item.value / (categoryData.reduce((a, b) => a + b.value, 0) || 1)) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products Table */}
        <div className="col-span-1 lg:col-span-2 glass-card rounded-3xl p-6 bg-white/90 dark:bg-slate-900 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Top Productos</h3>
            <div className="flex bg-gray-100 dark:bg-slate-700/50 p-1 rounded-lg">
              {(['day', 'week', 'month'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px - 3 py - 1 rounded - md text - xs font - bold transition - all ${selectedPeriod === p ? 'bg-white dark:bg-slate-600 shadow-sm text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    } `}
                >
                  {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100/80 dark:border-gray-700/50 last:border-0 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors px-3 rounded-lg group">
                <div className="flex items-center gap-3">
                  <div className={`w - 8 h - 8 rounded - lg flex items - center justify - center font - bold text - sm shadow - sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-emerald-50 text-emerald-700'} `}>
                    #{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{product.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{product.sales} ventas</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-gray-800 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">S/. {product.revenue.toFixed(2)}</span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 font-medium py-8 text-sm">No hay datos para este período</p>}
          </div>
        </div>

        {/* Rotation Alert */}
        <div className="col-span-1 lg:col-span-2">
          <RotationAlert deadStock={rotationData.dead} slowMoving={rotationData.slow} />
        </div>

        {/* Stock Prediction */}
        <div className="col-span-1 lg:col-span-2">
          <StockPredictionAlert
            criticalAlerts={stockPredictions.critical}
            warningAlerts={stockPredictions.warning}
          />
        </div>

        {/* Profitability Matrix */}
        <div className="col-span-1 lg:col-span-2">
          <ProfitabilityMatrix profitabilityData={profitabilityData} averageMargin={averageMargin} />
        </div>

        {/* Temporal Comparison */}
        {temporalData && (
          <div className="col-span-1 lg:col-span-2">
            <TemporalComparison
              weekComparison={temporalData.weekComparison}
              monthComparison={temporalData.monthComparison}
              trend={temporalData.trend}
            />
          </div>
        )}

        {/* Quick Actions or Other Info */}
        <div className="col-span-1 lg:col-span-2 glass-card rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-800 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-fullblur-3xl -translate-y-1/2 translate-x-1/2" />

          <h3 className="text-xl font-bold mb-2 relative z-10">Resumen Rápido</h3>
          <div className="grid grid-cols-2 gap-4 relative z-10 mt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
              <p className="text-emerald-100 text-sm mb-1">Total Productos</p>
              <p className="text-2xl font-bold">{productos.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
              <p className="text-emerald-100 text-sm mb-1">Valor Inventario Estimate</p>
              <p className="text-2xl font-bold">
                S/. {productos.reduce((acc, p) => acc + ((p.stock || 0) * (p.costPrice || 0)), 0).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;