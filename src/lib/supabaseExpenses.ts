import { supabase } from './supabase';
import { Expense } from '../types/index';

export async function createExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<string> {
    const { data, error } = await supabase
        .from('expenses')
        .insert([{
            tenant_id: expense.tenantId,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: expense.date.toISOString(),
            user_id: expense.userId,
            paid_from_cash: expense.paidFromCash || false
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating expense DETAILS:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        throw error;
    }

    return data.id;
}

export async function getExpenses(tenantId: string): Promise<Expense[]> {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
        id: item.id,
        description: item.description,
        amount: Number(item.amount),
        category: item.category,
        date: new Date(item.date),
        userId: item.user_id,
        tenantId: item.tenant_id,
        createdAt: new Date(item.created_at),
        paidFromCash: item.paid_from_cash
    }));
}

export async function deleteExpense(id: string, tenantId: string): Promise<void> {
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) {
        console.error('Error deleting expense:', error);
        throw error;
    }
}
