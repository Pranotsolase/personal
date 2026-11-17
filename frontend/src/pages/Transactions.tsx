import React, { useEffect, useState } from 'react';
import {
  Search,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Edit2,
  Trash2,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  getTransactions,
  getBanks,
  getCategories,
  deleteTransaction,
  updateTransaction,
  getTransactionsCsvUrl
} from '../api/client';
import { Transaction, BankAccount, Category } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface TransactionsProps {
  onOpenQuickModal: (type: 'sent' | 'received' | 'transfer' | 'bank') => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ onOpenQuickModal }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [bankFilter, setBankFilter] = useState<number | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Edit modal
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState<number | ''>('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editBankId, setEditBankId] = useState<number | ''>('');
  const [editCatId, setEditCatId] = useState<number | ''>('');
  const [editLoading, setEditLoading] = useState(false);

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txns, bRes, cRes] = await Promise.all([
        getTransactions({
          search: search.trim() || undefined,
          transaction_type: typeFilter || undefined,
          bank_account_id: bankFilter ? Number(bankFilter) : undefined,
          category_id: categoryFilter ? Number(categoryFilter) : undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        }),
        getBanks(),
        getCategories(),
      ]);
      setTransactions(txns);
      setBanks(bRes);
      setCategories(cRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, typeFilter, bankFilter, categoryFilter, startDate, endDate, sortBy, sortOrder]);

  const handleDelete = async (id: number, desc: string) => {
    if (!window.confirm(`Delete transaction "${desc}"? Account balances will be automatically restored.`)) return;
    try {
      await deleteTransaction(id);
      setToast({ text: 'Transaction deleted and balance recalculated!', type: 'success' });
      loadData();
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ text: err.response?.data?.detail || 'Failed to delete transaction', type: 'error' });
    }
  };

  const handleStartEdit = (t: Transaction) => {
    setEditingTxn(t);
    setEditAmount(t.amount);
    setEditDesc(t.description);
    setEditDate(t.transaction_date);
    setEditBankId(t.bank_account_id);
    setEditCatId(t.category_id || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTxn) return;
    try {
      setEditLoading(true);
      await updateTransaction(editingTxn.id, {
        amount: Number(editAmount),
        description: editDesc,
        transaction_date: editDate,
        bank_account_id: Number(editBankId),
        category_id: editCatId ? Number(editCatId) : undefined,
      });
      setEditingTxn(null);
      setToast({ text: 'Transaction updated and balances recalculated!', type: 'success' });
      loadData();
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ text: err.response?.data?.detail || 'Failed to update transaction', type: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleExportExcel = () => {
    const exportData = transactions.map((t) => ({
      'Transaction ID': t.id,
      Date: formatDate(t.transaction_date),
      Type: t.transaction_type,
      'Amount (₹)': t.amount,
      'Bank Account': t.bank_account_name,
      Category: t.category_name || 'N/A',
      'Person / Contact': t.person_name || 'N/A',
      'Payment Method': t.payment_method,
      'Reference Number': t.reference_number || '',
      Description: t.description,
      Notes: t.notes || '',
      Refund: t.is_refund ? 'Yes' : 'No',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, `Transactions_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span className="font-semibold">{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner & Export Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-indigo-600">
            Financial Ledger
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Transactions History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Displaying {transactions.length} records with double-entry balance consistency
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer shadow-xs active:scale-98"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Export</span> Excel
          </button>

          <a
            href={getTransactionsCsvUrl()}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer shadow-xs active:scale-98"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Export</span> CSV
          </a>

          <button
            onClick={() => onOpenQuickModal('sent')}
            className="flex items-center gap-1 px-3 py-2 sm:px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-98"
          >
            + Sent
          </button>

          <button
            onClick={() => onOpenQuickModal('received')}
            className="flex items-center gap-1 px-3 py-2 sm:px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-98"
          >
            + Received
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4.5 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Search box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search description, reference no, person..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Type filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer font-medium"
            >
              <option value="">All Transaction Types</option>
              <option value="EXPENSE">Expense (Sent)</option>
              <option value="INCOME">Income (Received)</option>
              <option value="TRANSFER_OUT">Transfer Out</option>
              <option value="TRANSFER_IN">Transfer In</option>
            </select>
          </div>

          {/* Bank filter */}
          <div>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer font-medium"
            >
              <option value="">All Bank Accounts</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer font-medium"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[10px] font-bold text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-slate-800 outline-none w-full"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[10px] font-bold text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-slate-800 outline-none w-full"
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none flex-1 cursor-pointer font-medium"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-2.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs w-full max-w-full">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Sender / Receiver</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Bank Account</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <span className="font-bold text-slate-700 block mb-1">No transactions recorded</span>
                    Click "+ Sent" or "+ Received" to create your first transaction.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isExpense = t.transaction_type === 'EXPENSE' || t.transaction_type === 'TRANSFER_OUT';
                  const isTransfer = t.transaction_type === 'TRANSFER_IN' || t.transaction_type === 'TRANSFER_OUT';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-mono">
                        {formatDate(t.transaction_date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            t.transaction_type === 'EXPENSE'
                              ? 'bg-rose-100 text-rose-700'
                              : t.transaction_type === 'INCOME'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {t.transaction_type === 'EXPENSE' && <ArrowUpRight className="w-3 h-3" />}
                          {t.transaction_type === 'INCOME' && <ArrowDownLeft className="w-3 h-3" />}
                          {isTransfer && <ArrowLeftRight className="w-3 h-3" />}
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{t.description}</div>
                        {t.reference_number && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {t.reference_number}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {t.person_name || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {t.category_name ? (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${t.category_color}18`,
                              color: t.category_color || '#475569',
                            }}
                          >
                            {t.category_name}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: t.bank_account_color || '#3b82f6' }}
                          />
                          <span className="text-slate-800 font-semibold">{t.bank_account_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-medium">
                        {t.payment_method}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right font-black">
                        <span className={isExpense ? 'text-rose-600' : 'text-emerald-600'}>
                          {isExpense ? '-' : '+'}
                          {formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!t.transfer_id && (
                            <button
                              onClick={() => handleStartEdit(t)}
                              title="Edit transaction"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(t.id, t.description)}
                            title="Delete transaction and reverse balance"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Edit Transaction</h3>
              <button
                onClick={() => setEditingTxn(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(parseFloat(e.target.value) || '')}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account</label>
                <select
                  value={editBankId}
                  onChange={(e) => setEditBankId(Number(e.target.value))}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editCatId}
                  onChange={(e) => setEditCatId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingTxn(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
                >
                  {editLoading ? 'Saving...' : 'Update Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
