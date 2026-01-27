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
  }, []);

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

  const handleEdit = (cliente: Customer) => {
    setForm(cliente);
    setEditId(cliente.id);
    setModalOpen(true);
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
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Clientes</h2>
        <button
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg"
          onClick={() => { setModalOpen(true); setForm(initialForm); setEditId(null); }}
        >
          Nuevo Cliente
        </button>
      </div>
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-3">Nombre</th>
            <th className="py-2 px-3">Teléfono</th>
            <th className="py-2 px-3">Dirección</th>
            <th className="py-2 px-3">Email</th>
            <th className="py-2 px-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(c => (
            <tr key={c.id} className="border-t">
              <td className="py-2 px-3">{c.name}</td>
              <td className="py-2 px-3">{c.phone}</td>
              <td className="py-2 px-3">{c.address}</td>
              <td className="py-2 px-3">{c.email}</td>
              <td className="py-2 px-3 space-x-2">
                <button className="text-blue-600" onClick={() => handleEdit(c)}>Editar</button>
                <button className="text-red-600" onClick={() => handleDelete(c.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-2">
            <h3 className="text-lg font-semibold mb-4">{editId ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <input
                className="w-full border px-3 py-2 rounded"
                placeholder="Nombre"
                value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                className="w-full border px-3 py-2 rounded"
                placeholder="Teléfono"
                value={form.phone || ''}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
              />
              <input
                className="w-full border px-3 py-2 rounded"
                placeholder="Dirección"
                value={form.address || ''}
                onChange={e => setForm({ ...form, address: e.target.value })}
                required
              />
              <input
                className="w-full border px-3 py-2 rounded"
                placeholder="Email"
                type="email"
                value={form.email || ''}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                  onClick={() => { setModalOpen(false); setForm(initialForm); setEditId(null); }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
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

export default CustomerManager;
