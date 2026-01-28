'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { Truck, Plus, Edit2, Trash2, Phone, Package, Download, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { crearProveedor, obtenerProveedores, actualizarProveedor, eliminarProveedor } from '../../lib/supabaseSuppliers';
import { obtenerProductosPorProveedor } from '../../lib/supabaseProducts';
import type { Supplier } from '../../types/index';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const initialForm: any = {
  name: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
  ruc: '',
  deliveryDays: [],
  rating: 0,
  notes: '',
  category: '',
  products: [],
};

const Portal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return typeof document !== 'undefined'
    ? createPortal(children, document.body)
    : null;
};

const SupplierManager: React.FC = () => {
  const { tenant } = useTenant();
  const [proveedores, setProveedores] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'logistics' | 'notes'>('info');
  const [productsModalOpen, setProductsModalOpen] = useState(false);
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const fetchProveedores = useCallback(async () => {
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
  }, [tenant?.id]);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

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
        await crearProveedor(form as any, tenant.id);
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
    setActiveTab('info');
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

  const toggleDay = (day: string) => {
    const currentDays = form.deliveryDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d: string) => d !== day)
      : [...currentDays, day];
    setForm({ ...form, deliveryDays: newDays });
  };

  const handleViewProducts = async (proveedor: Supplier) => {
    if (!tenant?.id) return;
    setSelectedSupplier(proveedor);
    setProductsModalOpen(true);
    setSupplierProducts([]);

    try {
      const products = await obtenerProductosPorProveedor(tenant.id, proveedor.name);
      setSupplierProducts(products);
    } catch (err) {
      console.error(err);
    }
  };

  const generatePurchaseOrder = () => {
    if (!selectedSupplier || !tenant) return;

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-PE');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald color
    doc.text('ORDEN DE COMPRA', 105, 20, { align: 'center' });

    // Info
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Proveedor: ${selectedSupplier.name}`, 14, 35);
    doc.text(`RUC: ${selectedSupplier.ruc || '-'}`, 14, 40);
    doc.text(`Fecha: ${today}`, 14, 45);
    doc.text(`Tienda: ${tenant.name}`, 160, 35, { align: 'right' });

    // Table
    const tableData = supplierProducts
      .filter(p => p.stock <= (p.minStock || 0) * 1.5) // Solo productos que necesitan stock
      .map(p => {
        const suggested = Math.max(0, (p.minStock || 0) * 2 - (p.stock || 0));
        return [
          p.name,
          p.code || '-',
          p.stock,
          (p.minStock || 0) * 2, // Stock objetivo
          suggested === 0 ? '-' : suggested.toFixed(0)
        ];
      });

    if (tableData.length === 0) {
      doc.text('No hay productos con bajo stock para este proveedor.', 14, 60);
    } else {
      autoTable(doc, {
        head: [['Producto', 'Código', 'Stock Actual', 'Stock Objetivo', 'A Pedir']],
        body: tableData,
        startY: 55,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9 },
      });
    }

    // Footer
    const finalY = (doc as any).lastAutoTable?.finalY || 70;
    doc.setFontSize(8);
    doc.text('Generado automáticamente por BodegApp', 105, finalY + 20, { align: 'center' });

    doc.save(`orden_compra_${selectedSupplier.name.replace(/\s+/g, '_')}_${today}.pdf`);
  };

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-lg">
            {star <= rating ? '★' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="glass-card rounded-2xl shadow-xl w-full max-w-full overflow-hidden animate-in fade-in zoom-in duration-300 bg-white/90 dark:bg-slate-900 border border-white/40 dark:border-gray-700">

      {/* Header Area */}
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
          onClick={() => { setModalOpen(true); setForm(initialForm); setEditId(null); setActiveTab('info'); }}
        >
          <Plus size={18} />
          Nuevo Proveedor
        </button>
      </div>

      <div className="p-6">
        {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm font-medium border border-red-200 dark:border-red-900/50">{error}</div>}
        {success && <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg mb-4 text-sm font-medium border border-emerald-200 dark:border-emerald-900/50">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proveedores.map(p => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                <button
                  onClick={() => handleEdit(p)}
                  className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:scale-110 transition-transform"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:scale-110 transition-transform"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mb-4 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2">
                      {p.category || 'General'}
                    </span>
                    <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-1">{p.name}</h3>
                    {renderStars(p.rating)}
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">👤</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{p.contact}</p>
                    <p className="text-xs text-gray-500">Contacto</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">{p.phone}</p>
                    <p className="text-xs text-gray-500">Teléfono</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleViewProducts(p)}
                    className="w-full py-2 rounded-xl bg-gray-50 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-colors flex items-center justify-center gap-2 group-hover:bg-emerald-600 group-hover:text-white"
                  >
                    <Package size={14} /> Ver Productos y Pedidos
                  </button>
                </div>

                {p.deliveryDays && p.deliveryDays.length > 0 && (
                  <div className="pt-2 mt-2">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                      <Truck size={12} /> Días de Entrega
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {p.deliveryDays.map(day => (
                        <span key={day} className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                          {day.substring(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {proveedores.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Truck size={40} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No tienes proveedores aún</h3>
              <p className="max-w-xs mx-auto mb-6">Agrega tus proveedores para gestionar pedidos y contactos de forma eficiente.</p>
              <button
                className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-lg"
                onClick={() => { setModalOpen(true); setForm(initialForm); setEditId(null); }}
              >
                Agregar Primer Proveedor
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Modal - PORTAL */}
      {modalOpen && (
        <Portal>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 border border-transparent dark:border-gray-700 max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-md">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h3>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                  {[
                    { id: 'info', label: 'Información', icon: '📝' },
                    { id: 'logistics', label: 'Logística', icon: '🚛' },
                    { id: 'notes', label: 'Notas', icon: '📌' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700/50'
                        }`}
                    >
                      <span>{tab.icon}</span> {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-6 flex-1">

                {/* Tab: General Info */}
                {activeTab === 'info' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Empresa</label>
                        <input
                          className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Nombre comercial"
                          value={form.name || ''}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">RUC</label>
                        <input
                          className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="RUC (11 dígitos)"
                          value={form.ruc || ''}
                          onChange={e => setForm({ ...form, ruc: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Contacto Principal</label>
                        <input
                          className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Nombre del vendedor"
                          value={form.contact || ''}
                          onChange={e => setForm({ ...form, contact: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Categoría</label>
                        <input
                          className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Ej: Bebidas, Lácteos"
                          value={form.category || ''}
                          onChange={e => setForm({ ...form, category: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Teléfono</label>
                        <input
                          className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Celular / Teléfono"
                          value={form.phone || ''}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Email</label>
                        <input
                          className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="correo@ejemplo.com"
                          type="email"
                          value={form.email || ''}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Dirección</label>
                      <input
                        className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Dirección fiscal o almacén"
                        value={form.address || ''}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Tab: Logistics */}
                {activeTab === 'logistics' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Días de Visita / Entrega</label>
                      <div className="grid grid-cols-4 gap-2">
                        {daysOfWeek.map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${(form.deliveryDays || []).includes(day)
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                              }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Calificación del Servicio</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setForm({ ...form, rating: star })}
                            className={`text-3xl transition-transform hover:scale-110 ${star <= (form.rating || 0) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
                              }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Evalúa puntualidad, calidad y atención.</p>
                    </div>
                  </div>
                )}

                {/* Tab: Notes */}
                {activeTab === 'notes' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 h-full">
                    <div className="h-full">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Notas Internas</label>
                      <textarea
                        className="w-full h-40 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        placeholder="Escribe aquí acuerdos especiales, descuentos, recordatorios o detalles importantes sobre este proveedor..."
                        value={form.notes || ''}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                      />
                    </div>
                  </div>
                )}

              </form>

              <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end gap-3 sticky bottom-0 backdrop-blur-md">
                <button
                  type="button"
                  className="px-6 py-2.5 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  onClick={() => { setModalOpen(false); setForm(initialForm); setEditId(null); }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (editId ? 'Guardar Cambios' : 'Crear Proveedor')}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* NEW: Products Modal - PORTAL */}
      {productsModalOpen && selectedSupplier && (
        <Portal>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in duration-200 border border-transparent dark:border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/80 dark:bg-slate-800/80 backdrop-blur-md z-10">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="text-emerald-500" />
                    {selectedSupplier.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Catálogo de productos ({supplierProducts.length} items encontrados)
                  </p>
                </div>
                <button onClick={() => setProductsModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X size={24} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6">
                {supplierProducts.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <Package size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No se encontraron productos asociados a este proveedor.</p>
                    <p className="text-sm">Asegúrate de que el campo &quot;Proveedor&quot; en tus productos coincida con &quot;{selectedSupplier.name}&quot;.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-800/40 rounded-full text-amber-600 dark:text-amber-400">
                        <Download size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-900 dark:text-amber-200">Generar Orden de Compra Inteligente</h4>
                        <p className="text-sm text-amber-800 dark:text-amber-300/80 mb-2">Crear automáticamente un PDF con los productos que necesitan reabastecimiento (Stock actual &lt; Stock mínimo).</p>
                        <button
                          onClick={generatePurchaseOrder}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
                        >
                          <Download size={14} /> Descargar Orden PDF
                        </button>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 uppercase font-bold text-xs">
                          <tr>
                            <th className="px-6 py-3">Producto</th>
                            <th className="px-6 py-3 text-center">Stock</th>
                            <th className="px-6 py-3 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {supplierProducts.map(prod => {
                            const isLowStock = prod.stock <= (prod.minStock || 0);
                            return (
                              <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-3">
                                  <div className="font-bold text-gray-900 dark:text-white">{prod.name}</div>
                                  <div className="text-xs text-gray-500 font-mono">{prod.code}</div>
                                </td>
                                <td className="px-6 py-3 text-center">
                                  <span className="font-mono text-base">{prod.stock}</span>
                                </td>
                                <td className="px-6 py-3 text-center">
                                  {isLowStock ? (
                                    <span className="inline-flex px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-md text-xs font-bold border border-red-200 dark:border-red-900/50">
                                      BAJO STOCK
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-md text-xs font-bold border border-green-200 dark:border-green-900/50">
                                      OK
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default SupplierManager;
