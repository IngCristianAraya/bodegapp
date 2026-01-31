
import { createClient } from '@supabase/supabase-js';

// Credentials for this run only
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bmlgtriutgwmpndrhlba.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbGd0cml1dGd3bXBuZHJobGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjIyODAsImV4cCI6MjA4NTAzODI4MH0.AH3Nuh4pBZlYLsjBEZHRqvWLYUhTKR8Yt_XLuIKIams';

console.log('Initializing Supabase for Recalculation...');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function recalculateHistory() {
    console.log('--- Recalculating Cash Register History ---');

    // 1. Fetch ALL closed registers
    const { data: registers, error: regError } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('status', 'closed')
        .order('closed_at', { ascending: false });

    if (regError) {
        console.error('Error fetching registers:', regError);
        return;
    }

    if (!registers || registers.length === 0) {
        console.log('No closed registers found.');
        return;
    }

    console.log(`Found ${registers.length} closed registers.`);

    let updatedCount = 0;

    for (const reg of registers) {
        // 2. Fetch sales for this register's window
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('total, payment_method')
            .eq('tenant_id', reg.tenant_id)
            .gte('created_at', reg.opened_at)
            .lte('created_at', reg.closed_at);

        if (salesError) {
            console.error(`Error fetching sales for Reg ${reg.id}:`, salesError);
            continue;
        }

        if (!sales) continue;

        // 3. Calculate Totals
        let calcCash = 0;
        let calcDigital = 0;

        sales.forEach(s => {
            const amount = Number(s.total) || 0;
            if (s.payment_method === 'cash') {
                calcCash += amount;
            } else {
                calcDigital += amount;
            }
        });

        // 4. Update if different
        const diffCash = Math.abs(calcCash - (reg.total_sales_cash || 0));
        const diffDigital = Math.abs(calcDigital - (reg.total_sales_digital || 0));

        if (diffCash > 0.1 || diffDigital > 0.1) {
            console.log(`[UPDATE] Reg ${reg.id} (${new Date(reg.closed_at).toLocaleString()}):`);
            console.log(`   - Cash: ${reg.total_sales_cash} -> ${calcCash.toFixed(2)}`);
            console.log(`   - Digital: ${reg.total_sales_digital} -> ${calcDigital.toFixed(2)}`);

            // Calculate new Expected Amount
            // Expected = Opening + SalesCash + Ingresos - Egresos
            // We need to keep Ingresos/Egresos as is (assuming they are correct or we re-fetch them)
            // For simplicity, we assume Ingresos/Egresos in DB are correct (calculated from movements)
            // But wait, Ingresos/Egresos are stored in DB too.

            const currentExpected = reg.expected_amount || 0;
            // Delta adjustment
            const cashDelta = calcCash - (reg.total_sales_cash || 0);
            // expected_amount only cares about CASH usually?
            // Let's check logic: expected = opening + totalSalesCash + ingresos - egresos.
            const newExpected = Number(reg.opening_amount) + calcCash + (reg.total_ingresos || 0) - (reg.total_egresos || 0);

            const { error: updateError } = await supabase
                .from('cash_registers')
                .update({
                    total_sales_cash: calcCash,
                    total_sales_digital: calcDigital,
                    expected_amount: newExpected
                })
                .eq('id', reg.id);

            if (updateError) {
                console.error('Failed to update:', updateError);
            } else {
                updatedCount++;
                console.log('   -> Success.');
            }
        }
    }

    console.log(`\nOperation Complete. Updated ${updatedCount} registers.`);
}

recalculateHistory();
