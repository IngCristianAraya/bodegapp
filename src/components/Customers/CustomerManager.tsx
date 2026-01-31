'use client';
import React, { useEffect, useState } from 'react';
import {
  crearCliente,
  obtenerClientes,
  actualizarCliente,
  eliminarCliente
} from '../../lib/supabaseCustomers';
import { useTenant } from '../../contexts/TenantContext';
import { Customer } from '../../types/index';

const initialForm: Partial<Customer> = {
  name: '',
  phone: '',
  address: '',
  email: '',
};

const CustomerManager: React.FC = () => {
  const [editId, setEditId] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [form, setForm] = useState(initialForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const { tenant } = useTenant();

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const fetchClientes = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const data = await obtenerClientes(tenant.id);
      setClientes(data);
    } catch {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [tenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    try {
      if (editId && tenant?.id) {
        await actualizarCliente(editId, form, tenant.id);
        setSuccess('Cliente actualizado');
      } else if (tenant?.id) {
        await crearCliente(form as Customer, tenant.id);
        setSuccess('Cliente creado');
      }
      setModalOpen(false);
      setForm(initialForm);
      setEditId(null);
      fetchClientes();
    } catch {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Nuevo: Manejar Pago de Deuda
  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPayment || !tenant?.id) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    setLoading(true);
    try {
      // Importamos dinámicamente o usamos la función del lib
      const { registrarPagoDeuda } = await import('../../lib/supabaseCustomers');
      await registrarPagoDeuda(selectedCustomerForPayment.id, amount, tenant.id, paymentNotes);

      setSuccess(`Pago de S/ ${amount} registrado correctamente`);
      setPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentNotes('');
      setSelectedCustomerForPayment(null);
      fetchClientes(); // Recargar para ver nueva deuda
    } catch (error) {
      console.error(error);
      alert('Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cliente: Customer) => {
    setForm(cliente);
    setEditId(cliente.id);
    setModalOpen(true);
  };

  const openPaymentModal = (cliente: Customer) => {
    setSelectedCustomerForPayment(cliente);
    setPaymentModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar cliente?')) return;
    setLoading(true);
    try {
      if (tenant?.id) {
        await eliminarCliente(id, tenant.id);
        setClientes(clientes.filter(c => c.id !== id));
        setSuccess('Cliente eliminado correctamente');
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      setSuccess('Error al eliminar cliente');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Clientes</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona tu cartera de clientes y deudas</p>
        </div>
        <button
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 font-semibold transition-all flex items-center gap-2"
          onClick={() => { setModalOpen(true); setForm(initialForm); setEditId(null); }}
        >
          <span className="text-xl">+</span> Nuevo Cliente
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center animate-in fade-in">
          <span className="mr-2">✅</span> {success}
        </div>
      )}

      {/* Stats Cards (Optional future enhancement, for now just the table container) */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="py-4 px-6 text-left font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Nombre</th>
                <th className="py-4 px-6 text-left font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Contacto</th>
                <th className="py-4 px-6 text-left font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Ubicación</th>
                <th className="py-4 px-6 text-right font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Deuda Actual</th>
                <th className="py-4 px-6 text-center font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {clientes.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{c.phone}</span>
                      <span className="text-gray-400 text-xs">{c.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-400 text-sm max-w-[200px] truncate">
                    {c.address}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {c.currentDebt && c.currentDebt > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                        S/ {c.currentDebt.toFixed(2)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                        Sin Deuda
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        className="bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800/50"
                        onClick={() => openPaymentModal(c)}
                        title="Registrar Pago"
                      >
                        💳
                      </button>
                      <button
                        className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 p-2 rounded-lg transition-colors border border-blue-200 dark:border-blue-800/50"
                        onClick={() => handleEdit(c)}
                        title="Editar Cliente"
                      >
                        ✏️
                      </button>
                      <button
                        className="bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 p-2 rounded-lg transition-colors border border-rose-200 dark:border-rose-800/50"
                        onClick={() => handleDelete(c.id)}
                        title="Eliminar Cliente"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                      <span className="text-4xl mb-3">👥</span>
                      <p className="text-lg font-medium">No tienes clientes registrados aún</p>
                      <button
                        onClick={() => { setModalOpen(true); setForm(initialForm); setEditId(null); }}
                        className="mt-2 text-emerald-500 hover:text-emerald-400 text-sm font-semibold hover:underline"
                      >
                        Registrar el primero
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 transform transition-all scale-100">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editId ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre Completo</label>
                  <input
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Ej. Juan Pérez"
                    value={form.name || ''}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Teléfono</label>
                    <input
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                      placeholder="999..."
                      value={form.phone || ''}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email (Opcional)</label>
                    <input
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                      placeholder="cliente@mail.com"
                      type="email"
                      value={form.email || ''}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Dirección</label>
                  <input
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Dirección completa"
                    value={form.address || ''}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => { setModalOpen(false); setForm(initialForm); setEditId(null); }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Pago con Diseño Premium */}
      {paymentModalOpen && selectedCustomerForPayment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 border border-gray-200 dark:border-gray-700/50">
            <div className="text-center mb-8 relative">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-50 dark:ring-emerald-900/20">
                <span className="text-4xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Registrar Pago</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Cliente: <span className="font-bold text-gray-900 dark:text-white">{selectedCustomerForPayment.name}</span>
              </p>

              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
                  Deuda: S/ {selectedCustomerForPayment.currentDebt?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            <form onSubmit={handleRegisterPayment} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-center">Monto a Pagar (S/)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    className="w-full bg-gray-50 dark:bg-slate-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 text-3xl font-extrabold text-center text-gray-900 dark:text-white focus:ring-0 focus:border-emerald-500 outline-none transition-all placeholder-gray-300 dark:placeholder-gray-700"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Nota (Opcional)</label>
                <input
                  className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-sm"
                  placeholder="Ej. Pago parcial por Yape..."
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 px-4 py-3.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => { setPaymentModalOpen(false); setSelectedCustomerForPayment(null); }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? '...' : 'Confirmar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;
