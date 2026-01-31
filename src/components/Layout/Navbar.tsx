import React from 'react';
import { Home, ShoppingCart, Package, Truck, BarChart3, Settings, LogOut, CircleAlert, Users, Wallet, Calendar, Bell } from 'lucide-react';
import { useLowStock } from '../../contexts/LowStockContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'pos', label: 'Punto de Venta', icon: ShoppingCart },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'expenses', label: 'Gastos', icon: Wallet },
  { id: 'inventory', label: 'Inventario', icon: Package },
  { id: 'expirations', label: 'Vencimientos', icon: Calendar },
  { id: 'lowstock', label: 'Bajo Stock', icon: CircleAlert },
  { id: 'suppliers', label: 'Proveedores', icon: Truck },
  { id: 'reports', label: 'Reportes', icon: BarChart3 },
  { id: 'settings', label: 'Configuración', icon: Settings }
];

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange, onLogout }) => {
  // Use try-catch to handle case where context might not be available
  let criticalStockCount = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isPro: _isPro } = useSubscription();
  try {
    const lowStockContext = useLowStock();
    criticalStockCount = lowStockContext.criticalStockCount;
  } catch {
    // Context not available yet, use default value
    console.warn('LowStockContext not available in Navbar');
  }
  // Broadcast Logic
  const [activeAnnouncement, setActiveAnnouncement] = React.useState<{ title: string, message: string, type: string } | null>(null);
  const [showAnnouncement, setShowAnnouncement] = React.useState(false);

  React.useEffect(() => {
    // Check for announcements
    const checkAnnouncements = async () => {
      // Dynamic import to avoid SSR issues if any, or just standard import usage
      const { supabase } = await import('../../lib/supabase');

      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { data, error } = await supabase
          .from('system_announcements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          // Simple logic: Show if we haven't seen this ID in session or specific logic
          // For now, just show it once per refresh or if it's new.
          // To be less annoying, we could check localStorage.
          const lastSeen = localStorage.getItem('last_seen_announcement');
          if (lastSeen !== data.id) {
            setActiveAnnouncement(data);
            setShowAnnouncement(true);
            localStorage.setItem('last_seen_announcement', data.id);
          }
        }
      } catch (err) {
        console.error('Error fetching announcements', err);
      }
    };

    checkAnnouncements();
  }, []);

  return (
    <nav className="fixed top-4 left-4 right-4 z-50 rounded-2xl glass shadow-lg border border-white/20 dark:border-white/10 dark:bg-slate-900/80">
      <div className="w-full px-6 flex items-center justify-between h-18">
        {/* Logo con degradado premium */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-emerald-500/20 shadow-lg">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent tracking-tight font-heading">
            Bodegapp
          </span>
        </div>

        {/* Menú de Navegación */}
        <div className="flex-1 flex justify-center">
          <ul className="flex items-center space-x-2 bg-secondary/50 dark:bg-slate-800/50 p-1.5 rounded-full backdrop-blur-sm">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onPageChange(item.id)}
                    className={`
                      relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ease-out
                      ${isActive
                        ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-md font-semibold transform scale-105'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'}
                    `}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-emerald-600 dark:text-white' : ''} />
                    <span className="text-sm hidden sm:inline-block">{item.label}</span>
                    {item.id === 'lowstock' && criticalStockCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                        {criticalStockCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Plan Badge Removed */}

        {/* Botón Cerrar Sesión */}
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm hidden sm:inline-block">Salir</span>
        </button>
      </div>

      {/* Broadcast Modal/Popup */}
      {
        showAnnouncement && activeAnnouncement && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className={`
              bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border-2
              ${activeAnnouncement.type === 'warning' ? 'border-amber-500' :
                activeAnnouncement.type === 'success' ? 'border-emerald-500' : 'border-indigo-500'}
           `}>
              <div className={`p-6 ${activeAnnouncement.type === 'warning' ? 'bg-amber-500/10' :
                activeAnnouncement.type === 'success' ? 'bg-emerald-500/10' : 'bg-indigo-500/10'
                }`}>
                <div className="flex items-start gap-4">
                  <div className={`
                          p-3 rounded-2xl flex-shrink-0
                          ${activeAnnouncement.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                      activeAnnouncement.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30'}
                      `}>
                    <Bell size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {activeAnnouncement.title}
                    </h3>
                    <div className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                      {activeAnnouncement.message}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-slate-800/50 flex justify-end">
                <button
                  onClick={() => setShowAnnouncement(false)}
                  className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:scale-105 transition-transform"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )
      }
    </nav >
  );
};

export default Navbar;
