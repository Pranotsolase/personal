export interface User {
  id: number;
  email: string;
  full_name: string;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface BankAccount {
  id: number;
  name: string;
  account_holder_name: string;
  account_type: 'SAVINGS' | 'CURRENT' | 'CASH' | 'WALLET' | 'OTHER';
  account_number_masked?: string;
  ifsc_code?: string;
  opening_balance: number;
  current_balance: number;
  color: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
  is_system: boolean;
  created_at: string;
}

export interface Person {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  total_sent?: number;
  total_received?: number;
  net_sent?: number;
  outstanding?: number;
  transactions_count?: number;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export interface Transaction {
  id: number;
  transaction_type: TransactionType;
  amount: number;
  bank_account_id: number;
  bank_account_name?: string;
  bank_account_color?: string;
  person_id?: number;
  person_name?: string;
  category_id?: number;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  transfer_id?: number;
  transaction_date: string;
  payment_method: string;
  reference_number?: string;
  description: string;
  notes?: string;
  is_refund: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transfer {
  id: number;
  from_account_id: number;
  to_account_id: number;
  from_account_name: string;
  to_account_name: string;
  amount: number;
  transfer_date: string;
  reference_number?: string;
  description?: string;
  created_at: string;
}

export interface Budget {
  id: number;
  category_id?: number;
  category_name?: string;
  category_color?: string;
  month: number;
  year: number;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  is_warning: boolean;
  is_exceeded: boolean;
}

export interface DashboardData {
  summary: {
    total_balance: number;
    total_income: number;
    total_expenses: number;
    total_savings: number;
    savings_rate: number;
    bank_accounts_count: number;
    current_month_spending: number;
    last_month_spending: number;
    spending_change_percentage: number;
    highest_expense_category: string;
    highest_expense_amount: number;
    top_sender?: string;
    top_sender_amount: number;
    top_receiver?: string;
    top_receiver_amount: number;
    budget_status?: {
      budget_amount: number;
      spent: number;
      remaining: number;
      percentage: number;
      is_warning: boolean;
      is_exceeded: boolean;
    };
    pending_incoming_amount?: number;
    pending_incoming_count?: number;
    overdue_incoming_amount?: number;
  };
  insights: string[];
  charts: {
    category_breakdown: Array<{ name: string; value: number; color: string; count: number }>;
    account_distribution: Array<{ id: number; name: string; balance: number; color: string; percentage: number }>;
    daily_spending_trend: Array<{ date: string; expense: number; income: number }>;
  };
}

export interface UpcomingDue {
  id: number;
  person_name: string;
  amount: number;
  amount_received: number;
  due_date: string;
  description: string;
  person_id?: number;
  category_id?: number;
  category_name?: string;
  notes?: string;
  status: 'PENDING' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';
  received_date?: string;
  settled_bank_id?: number;
  settled_bank_name?: string;
  settled_transaction_id?: number;
  is_overdue: boolean;
  remaining_amount: number;
  created_at: string;
  updated_at: string;
}

export interface UpcomingDueSummary {
  total_pending_amount: number;
  total_pending_count: number;
  overdue_amount: number;
  overdue_count: number;
  received_this_month_amount: number;
  received_this_month_count: number;
}
