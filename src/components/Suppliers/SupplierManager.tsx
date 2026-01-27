'use client';
import React, { useEffect, useState } from 'react';
import {
  crearProveedor,
  obtenerProveedores,
  actualizarProveedor,
  eliminarProveedor
} from '../../lib/supabaseSuppliers';
import { useTenant } from '../../contexts/TenantContext';
import type { Supplier } from '../../types/index';
import { Plus, Edit2, Trash2, Phone, Mail, MapPin, Truck } from 'lucide-react';

const initialForm: Partial<Supplier> = {
  name: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
  products: [],
};

const SupplierManager: React.FC = () => {
  const [proveedores, setProveedores] = useState<Supplier[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { tenant } = useTenant();

  const fetchProveedores = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await obtenerProveedores(tenant.id);
      setProveedores(data);
    } catch {
      setError('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (editId && tenant?.id) {
        await actualizarProveedor(editId, form, tenant.id);
        setSuccess('Proveedor actualizado');
      } else if (tenant?.id) {
        const { name, contact, phone, address } = form;
        if (!name || !contact || !phone || !address) {
          setError('Completa todos los campos obligatorios');
          setLoading(false);
          return;
        }
        const proveedorNuevo = {
          name,
          contact,
          phone,
          address,
          email: form.email || '',
          products: [],
          createdAt: new Date(),
        };
        await crearProveedor(proveedorNuevo, tenant.id);
        setSuccess('Proveedor creado');
      }
      setModalOpen(false);
      setForm(initialForm);
      setEditId(null);
      fetchProveedores();
    } catch {
      setError('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (proveedor: Supplier) => {
    setForm(proveedor);
    setEditId(proveedor.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar proveedor?')) return;
    setLoading(true);
    try {
      if (tenant?.id) {
        await eliminarProveedor(id, tenant.id);
        setSuccess('Proveedor eliminado');
        fetchProveedores();
      }
    } catch {
      setError('Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl shadow-xl w-full max-w-full overflow-hidden animate-in fade-in zoom-in duration-300 bg-white/90 dark:bg-slate-900 border border-white/40 dark:border-gray-700">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="text-emerald-600 dark:text-emerald-400" />
            Proveedores
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona tus relaciones comerciales</p>
        </div>
        <button
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-emerald-200 dark:hover:shadow-none active:scale-95 border border-transparent"
          onClick={() => { setModalOpen(true); setForm(initialForm); setEditId(null); }}
        >
          <Plus size={18} />
          Nuevo Proveedor
        </button>
      </div>

      <div className="p-6">
        {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm font-medium border border-red-200 dark:border-red-900/50">{error}</div>}
        {success && <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg mb-4 text-sm font-medium border border-emerald-200 dark:border-emerald-900/50">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proveedores.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{p.name}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 flex justify-center"><span className="font-semibold text-gray-400 dark:text-gray-500">👤</span></div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{p.contact}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 flex justify-center"><Phone size={14} className="text-gray-400 dark:text-gray-500" /></div>
                  <span>{p.phone}</span>
                </div>
                {p.email && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 flex justify-center"><Mail size={14} className="text-gray-400 dark:text-gray-500" /></div>
                    <span className="truncate">{p.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-6 flex justify-center"><MapPin size={14} className="text-gray-400 dark:text-gray-500" /></div>
                  <span className="truncate">{p.address}</span>
                </div>
              </div>
            </div>
          ))}

          {proveedores.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <Truck size={48} className="mx-auto mb-2 opacity-50" />
              <p>No hay proveedores registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 border border-transparent dark:border-gray-700">
            <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">{editId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Empresa</label>
                <input
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all placeholder-gray-400"
                  placeholder="Nombre de la empresa"
                  value={form.name || ''}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Contacto</label>
                <input
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all placeholder-gray-400"
                  placeholder="Nombre del contacto"
                  value={form.contact || ''}
                  onChange={e => setForm({ ...form, contact: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Teléfono</label>
                  <input
                    className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all placeholder-gray-400"
                    placeholder="Teléfono"
                    value={form.phone || ''}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Email</label>
                  <input
                    className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all placeholder-gray-400"
                    placeholder="Email (opcional)"
                    type="email"
                    value={form.email || ''}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Dirección</label>
                <input
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all placeholder-gray-400"
                  placeholder="Dirección fiscal o real"
                  value={form.address || ''}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                <button
                  type="button"
                  className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  onClick={() => { setModalOpen(false); setForm(initialForm); setEditId(null); }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-70"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManager;
