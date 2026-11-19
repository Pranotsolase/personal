import axios from 'axios';
import {
  BankAccount,
  Category,
  Person,
  Transaction,
  Transfer,
  Budget,
  DashboardData,
  UpcomingDue,
  UpcomingDueSummary
} from '../types';

const API_BASE = '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const resetToZero = () => api.post('/auth/reset-zero').then((r) => r.data);

// Banks API
export const getBanks = () => api.get<BankAccount[]>('/banks/').then((r) => r.data);
export const getBanksSummary = () => api.get('/banks/summary').then((r) => r.data);
export const getCashWallet = () => api.get<BankAccount | null>('/banks/cash-wallet').then((r) => r.data);
export const createBank = (data: Partial<BankAccount>) => api.post<BankAccount>('/banks/', data).then((r) => r.data);
export const updateBank = (id: number, data: Partial<BankAccount>) => api.put<BankAccount>(`/banks/${id}`, data).then((r) => r.data);
export const updateDirectBalance = (id: number, balance: number) => api.put<BankAccount>(`/banks/${id}/balance`, { balance }).then((r) => r.data);
export const deleteBank = (id: number, hard = false) => api.delete(`/banks/${id}?hard_delete=${hard}`).then((r) => r.data);
export const recalculateBankBalance = (id: number) => api.post(`/banks/${id}/recalculate`).then((r) => r.data);
export const getBankTransactions = (id: number) => api.get<Transaction[]>(`/banks/${id}/transactions`).then((r) => r.data);

// Categories API
export const getCategories = (type?: 'INCOME' | 'EXPENSE') =>
  api.get<Category[]>('/categories/', { params: { type } }).then((r) => r.data);
export const createCategory = (data: Partial<Category>) => api.post<Category>('/categories/', data).then((r) => r.data);
export const updateCategory = (id: number, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data).then((r) => r.data);
export const deleteCategory = (id: number) => api.delete(`/categories/${id}`).then((r) => r.data);

// People API
export const getPeople = (search?: string) => api.get<Person[]>('/people/', { params: { search } }).then((r) => r.data);
export const createPerson = (data: Partial<Person>) => api.post<Person>('/people/', data).then((r) => r.data);
export const updatePerson = (id: number, data: Partial<Person>) => api.put<Person>(`/people/${id}`, data).then((r) => r.data);
export const deletePerson = (id: number) => api.delete(`/people/${id}`).then((r) => r.data);
export const getPersonTransactions = (id: number) => api.get<{ person: Person; transactions: Transaction[] }>(`/people/${id}/transactions`).then((r) => r.data);

// Transfers API
export const getTransfers = () => api.get<Transfer[]>('/transfers/').then((r) => r.data);
export const createTransfer = (data: {
  from_account_id: number;
  to_account_id: number;
  amount: number;
  transfer_date?: string;
  reference_number?: string;
  description?: string;
}) => api.post<Transfer>('/transfers/', data).then((r) => r.data);
export const deleteTransfer = (id: number) => api.delete(`/transfers/${id}`).then((r) => r.data);

// Transactions API
export const getTransactions = (params?: {
  search?: string;
  transaction_type?: string;
  bank_account_id?: number;
  category_id?: number;
  person_id?: number;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: string;
  limit?: number;
}) => api.get<Transaction[]>('/transactions/', { params }).then((r) => r.data);

export const createTransaction = (data: {
  transaction_type: 'INCOME' | 'EXPENSE';
  amount: number;
  bank_account_id: number;
  person_id?: number;
  person_name?: string;
  category_id?: number;
  transaction_date?: string;
  payment_method?: string;
  reference_number?: string;
  description: string;
  notes?: string;
  is_refund?: boolean;
}) => api.post<Transaction>('/transactions/', data).then((r) => r.data);

export const updateTransaction = (id: number, data: Partial<Transaction>) =>
  api.put<Transaction>(`/transactions/${id}`, data).then((r) => r.data);
export const deleteTransaction = (id: number) => api.delete(`/transactions/${id}`).then((r) => r.data);
export const getTransactionsCsvUrl = () => `${API_BASE}/transactions/export/csv`;

// Budgets API
export const getBudgets = (month?: number, year?: number) =>
  api.get<Budget[]>('/budgets/', { params: { month, year } }).then((r) => r.data);
export const setBudget = (data: { category_id?: number; month: number; year: number; amount: number }) =>
  api.post<Budget>('/budgets/', data).then((r) => r.data);
export const deleteBudget = (id: number) => api.delete(`/budgets/${id}`).then((r) => r.data);

// Analytics API
export const getDashboardData = (params?: {
  filter_type?: string;
  start_date?: string;
  end_date?: string;
}) => api.get<DashboardData>('/analytics/dashboard', { params }).then((r) => r.data);

export const getReports = (params: {
  report_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'bank_wise' | 'person_wise' | 'category_wise' | 'savings';
  year?: number;
  month?: number;
}) => api.get('/analytics/reports', { params }).then((r) => r.data);

// Upcoming & Pending Money API (Both Receivables and Payables)
export const getUpcomingDues = (params?: {
  status?: string;
  due_type?: string;
  is_overdue?: boolean;
  search?: string;
}) => api.get<UpcomingDue[]>('/upcoming/', { params }).then((r) => r.data);

export const getUpcomingSummary = () =>
  api.get<UpcomingDueSummary>('/upcoming/summary').then((r) => r.data);

export const createUpcomingDue = (data: {
  person_name: string;
  amount: number;
  due_type?: 'RECEIVABLE' | 'PAYABLE';
  due_date?: string;
  description?: string;
  person_id?: number;
  category_id?: number;
  notes?: string;
}) => api.post<UpcomingDue>('/upcoming/', data).then((r) => r.data);

export const updateUpcomingDue = (id: number, data: Partial<UpcomingDue>) =>
  api.put<UpcomingDue>(`/upcoming/${id}`, data).then((r) => r.data);

export const deleteUpcomingDue = (id: number) =>
  api.delete(`/upcoming/${id}`).then((r) => r.data);

export const settleUpcomingDue = (id: number, data: {
  bank_account_id: number;
  amount?: number;
  received_date?: string;
  payment_method?: string;
  notes?: string;
}) => api.post<UpcomingDue>(`/upcoming/${id}/settle`, data).then((r) => r.data);
