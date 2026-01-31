console.log('Script started...');
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bmlgtriutgwmpndrhlba.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbGd0cml1dGd3bXBuZHJobGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjIyODAsImV4cCI6MjA4NTAzODI4MH0.AH3Nuh4pBZlYLsjBEZHRqvWLYUhTKR8Yt_XLuIKIams';

console.log('Initializing Supabase...', SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugCashRegister() {
    console.log('--- Debugging Cash Register Sales ---');

    // 1. Fetch the most recent closed cash registers
    const { data: registers, error: regError } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(3);

    if (regError) {
        console.error('Error fetching registers:', regError);
        return;
    }

    if (!registers || registers.length === 0) {
        console.log('No closed registers found.');
        return;
    }

    for (const reg of registers) {
        console.log(`\nChecking Register ID: ${reg.id}`);
        console.log(`Opened: ${reg.opened_at}`);
        console.log(`Closed: ${reg.closed_at}`);
        console.log(`Stored Sales Cash: ${reg.total_sales_cash}`);
        console.log(`Stored Sales Digital: ${reg.total_sales_digital}`);

        // 2. Fetch sales that occurred during this window
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('id, created_at, total, payment_method')
            .eq('tenant_id', reg.tenant_id)
            .gte('created_at', reg.opened_at)
            .lte('created_at', reg.closed_at);

        if (salesError) {
            console.error('Error fetching sales for this period:', salesError);
            continue;
        }

        console.log(`Found ${sales?.length} sales in this timeframe.`);

        if (sales && sales.length > 0) {
            let calcCash = 0;
            let calcDigital = 0;

            sales.forEach(sale => {
                console.log(` - Sale ${sale.id}: ${sale.created_at} | Method: '${sale.payment_method}' | Total: ${sale.total}`);

                // Check exact string match
                if (sale.payment_method === 'cash') {
                    calcCash += Number(sale.total);
                } else {
                    calcDigital += Number(sale.total);
                }
            });

            console.log(`Calculated Cash: ${calcCash.toFixed(2)}`);
            console.log(`Calculated Digital: ${calcDigital.toFixed(2)}`);

            if (Math.abs(calcCash - (reg.total_sales_cash || 0)) > 0.1) {
                console.error(`MISMATCH FOUND in CASH! Stored: ${reg.total_sales_cash}, Calculated: ${calcCash}`);
            }
            if (Math.abs(calcDigital - (reg.total_sales_digital || 0)) > 0.1) {
                console.error(`MISMATCH FOUND in DIGITAL! Stored: ${reg.total_sales_digital}, Calculated: ${calcDigital}`);
            }

        } else {
            // Check if there are sales just BEFORE opening? (Timezone issue)
            const { data: earlySales } = await supabase
                .from('sales')
                .select('created_at')
                .eq('tenant_id', reg.tenant_id)
                .lt('created_at', reg.opened_at)
                .order('created_at', { ascending: false })
                .limit(3);

            console.log('Last 3 sales BEFORE opening:', earlySales);
        }
    }
}

debugCashRegister();
