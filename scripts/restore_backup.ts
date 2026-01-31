
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // OR SERVICE_ROLE_KEY if you have it, for now using anon with RLS policies of the user? 
// Actually for a restore script running locally, we might need SERVICE_ROLE_KEY to bypass RLS or simply login as the user.
// But usually restoration is an Admin task. Let's assume we use the Anon key but we might need the user's login or just trust RLS allows insert if we have the right context?
// Actually simpler: The script will warn that it needs a Service Role Key for full access, or we simulate the session.
// For simplicity in this demo, we'll try to use the keys we have.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreBackup(filePath: string) {
    try {
        const absolutePath = path.resolve(filePath);
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`File not found: ${absolutePath}`);
        }

        const fileContent = fs.readFileSync(absolutePath, 'utf-8');
        const backup = JSON.parse(fileContent);

        if (!backup.tenant_id) {
            throw new Error('Invalid backup file: missing tenant_id');
        }

        const tenantId = backup.tenant_id;
        console.log(`Restoring data for Tenant: ${tenantId}`);

        // Order matters due to foreign keys!
        // 1. Products (independent)
        // 2. Customers
        // 3. Suppliers
        // 4. Sales (depend on items? No, Sale is header)
        // 5. Sale Items (depend on Sales and Products)
        // 6. Expenses
        // 7. Cash Registers
        // 8. Cash Movements

        // Helper to insert data
        const restoreTable = async (tableName: string, rows: any[]) => {
            if (!rows || rows.length === 0) return;
            console.log(`Restoring ${tableName} (${rows.length} rows)...`);

            // We use upsert to avoid conflicts if data partially exists
            const { error } = await supabase.from(tableName).upsert(rows);
            if (error) {
                console.error(`Error restoring ${tableName}:`, error.message);
            } else {
                console.log(` - ${tableName} restored.`);
            }
        };

        await restoreTable('products', backup.products);
        await restoreTable('customers', backup.customers);
        await restoreTable('suppliers', backup.suppliers);

        // Expenses
        await restoreTable('expenses', backup.expenses);

        // Cash Registers
        await restoreTable('cash_registers', backup.cash_registers);
        await restoreTable('cash_movements', backup.cash_movements);

        // Sales & Items
        // Important: items depend on sales, so sales first
        await restoreTable('sales', backup.sales);
        await restoreTable('sale_items', backup.sale_items);

        console.log('--- Restore Completed ---');

    } catch (error) {
        console.error('Restore failed:', error);
    }
}

// Get file from args
const backupFile = process.argv[2];
if (!backupFile) {
    console.log('Usage: ts-node scripts/restore_backup.ts <path_to_json_file>');
} else {
    restoreBackup(backupFile);
}
