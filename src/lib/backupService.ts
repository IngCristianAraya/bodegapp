
import { supabase } from './supabase';

export interface BackupData {
    timestamp: string;
    tenant_id: string;
    products: any[];
    sales: any[];
    sale_items: any[];
    customers: any[];
    suppliers: any[];
    expenses: any[];
    cash_registers: any[];
    cash_movements: any[];
}

export async function generateFullBackup(tenantId: string): Promise<BackupData> {
    console.log('Iniciando respaldo completo...');

    const backup: BackupData = {
        timestamp: new Date().toISOString(),
        tenant_id: tenantId,
        products: [],
        sales: [],
        sale_items: [],
        customers: [],
        suppliers: [],
        expenses: [],
        cash_registers: [],
        cash_movements: []
    };

    try {
        // 1. Products
        const { data: products } = await supabase.from('products').select('*').eq('tenant_id', tenantId);
        backup.products = products || [];

        // 2. Sales
        const { data: sales } = await supabase.from('sales').select('*').eq('tenant_id', tenantId);
        backup.sales = sales || [];

        // 3. Sale Items (We need to fetch all, potentially large, but for MVP assumes it fits)
        const { data: saleItems } = await supabase.from('sale_items').select('*').eq('tenant_id', tenantId);
        backup.sale_items = saleItems || [];

        // 4. Customers
        const { data: customers } = await supabase.from('customers').select('*').eq('tenant_id', tenantId);
        backup.customers = customers || [];

        // 5. Suppliers
        const { data: suppliers } = await supabase.from('suppliers').select('*').eq('tenant_id', tenantId);
        backup.suppliers = suppliers || [];

        // 6. Expenses
        const { data: expenses } = await supabase.from('expenses').select('*').eq('tenant_id', tenantId);
        backup.expenses = expenses || [];

        // 7. Cash Registers
        const { data: registers } = await supabase.from('cash_registers').select('*').eq('tenant_id', tenantId);
        backup.cash_registers = registers || [];

        // 8. Cash Movements
        const { data: movements } = await supabase.from('cash_movements').select('*').eq('tenant_id', tenantId);
        backup.cash_movements = movements || [];

        console.log('Respaldo generado con éxito.');
        return backup;

    } catch (error) {
        console.error('Error generando respaldo:', error);
        throw new Error('Falló la generación del respaldo.');
    }
}
