import { useState, useEffect, useCallback } from 'react';
import { obtenerCajaActiva, abrirCaja, cerrarCaja, obtenerResumenCaja, CashRegister, CashRegisterSummary } from '../lib/supabaseCashRegister';
import { useTenant } from '../contexts/TenantContext';
import { useToast } from '../contexts/ToastContext';

export function useCashRegister() {
    const { tenant } = useTenant();
    const { showToast } = useToast();
    const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<CashRegisterSummary | null>(null);

    const checkRegisterStatus = useCallback(async () => {
        if (!tenant) return;
        try {
            setLoading(true);
            const register = await obtenerCajaActiva(tenant.id);
            setCashRegister(register);
        } catch (error) {
            console.error('Error checking register status:', error);
        } finally {
            setLoading(false);
        }
    }, [tenant]);

    useEffect(() => {
        checkRegisterStatus();
    }, [checkRegisterStatus]);

    const openRegister = async (amount: number) => {
        if (!tenant) return;
        try {
            const newRegister = await abrirCaja(tenant.id, amount);
            setCashRegister(newRegister);
            showToast('Caja aperturada correctamente', 'success');
            return newRegister;
        } catch (error) {
            console.error('Error opening register:', error);
            showToast('Error al abrir caja', 'error');
            throw error;
        }
    };

    const closeRegister = async (closingAmount: number, notes?: string) => {
        if (!tenant || !cashRegister) return;
        try {
            // Recalcular esperado antes de cerrar por seguridad
            const currentSummary = await obtenerResumenCaja(cashRegister.id, tenant.id);

            await cerrarCaja(
                cashRegister.id,
                tenant.id,
                closingAmount,
                currentSummary.expected_amount,
                notes,
                {
                    salesCash: currentSummary.total_sales_cash,
                    salesDigital: currentSummary.total_sales_digital,
                    ingresos: currentSummary.total_ingresos,
                    egresos: currentSummary.total_egresos
                }
            );

            setCashRegister(null); // Clear active register
            setSummary(null);
            showToast('Caja cerrada correctamente', 'success');
        } catch (error) {
            console.error('Error closing register:', error);
            showToast('Error al cerrar caja', 'error');
            throw error;
        }
    };

    const fetchSummary = async () => {
        if (!tenant || !cashRegister) return;
        try {
            const data = await obtenerResumenCaja(cashRegister.id, tenant.id);
            setSummary(data);
            return data;
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    return {
        cashRegister,
        loading,
        checkRegisterStatus,
        openRegister,
        closeRegister,
        fetchSummary,
        summary
    };
}
