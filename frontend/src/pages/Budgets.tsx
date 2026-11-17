import React, { useEffect, useState } from 'react';
import {
  Plus,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Trash2,
  X,
} from 'lucide-react';
import { getBudgets, setBudget, deleteBudget, getCategories } from '../api/client';
import { Budget, Category } from '../types';
import { formatCurrency } from '../utils/format';

export const Budgets: React.FC = () => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Set Budget Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<number | ''>(''); // empty means overall monthly budget
  const [amount, setAmount] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bRes, cRes] = await Promise.all([
        getBudgets(selectedMonth, selectedYear),
        getCategories('EXPENSE'),
      ]);
      setBudgets(bRes);
      setCategories(cRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await setBudget({
        category_id: categoryId ? Number(categoryId) : undefined,
        month: selectedMonth,
        year: selectedYear,
        amount: Number(amount),
      });
      setToast({ text: 'Budget updated successfully!', type: 'success' });
      setIsModalOpen(false);
      setAmount('');
      loadData();
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (!window.confirm('Delete this budget limit?')) return;
    try {
      await deleteBudget(id);
      setToast({ text: 'Budget target removed', type: 'success' });
      loadData();
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ text: 'Failed to delete budget', type: 'error' });
    }
  };

  const overallBudget = budgets.find((b) => !b.category_id);
  const categoryBudgets = budgets.filter((b) => !!b.category_id);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-indigo-600">
            Financial Discipline
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Monthly Budget Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Set overall and category spending limits with real-time 80% warnings and exceeded alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-slate-800 outline-none px-2 py-1 cursor-pointer font-bold"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx + 1} className="bg-white">
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-slate-800 outline-none px-2 py-1 cursor-pointer font-bold"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y} className="bg-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setCategoryId('');
              setAmount('');
              setError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Set Budget
          </button>
        </div>
      </div>

      {/* Overall Monthly Budget Card */}
      {overallBudget ? (
        <div
          className={`p-6 rounded-2xl border shadow-xs ${
            overallBudget.is_exceeded
              ? 'bg-rose-50 border-rose-200'
              : overallBudget.is_warning
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Overall Monthly Budget
                </span>
                {overallBudget.is_exceeded && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Budget Exceeded!
                  </span>
                )}
                {overallBudget.is_warning && !overallBudget.is_exceeded && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> 80% Warning!
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
                {formatCurrency(overallBudget.amount)}
              </h2>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium block">Spent so far</span>
              <p className="text-xl font-black text-slate-900 mt-0.5">
                {formatCurrency(overallBudget.spent)}
              </p>
              <span
                className={`text-xs font-bold mt-1 block ${
                  overallBudget.remaining >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {overallBudget.remaining >= 0
                  ? `Remaining: ${formatCurrency(overallBudget.remaining)}`
                  : `Overspent: ${formatCurrency(Math.abs(overallBudget.remaining))}`}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 space-y-2">
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallBudget.is_exceeded
                    ? 'bg-rose-500'
                    : overallBudget.is_warning
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(overallBudget.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-semibold">
              <span>0%</span>
              <span className="text-slate-800">{overallBudget.percentage}% consumed</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center shadow-xs">
          <p className="text-sm font-bold text-slate-800">No overall budget set for this month</p>
          <p className="text-xs text-slate-500 mt-1">
            Setting an overall budget gives you an instant progress bar of your total monthly expenditures.
          </p>
          <button
            onClick={() => {
              setCategoryId('');
              setAmount('');
              setIsModalOpen(true);
            }}
            className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            + Set Overall Budget
          </button>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">Category Specific Budgets</h2>
          <span className="text-xs text-slate-500 font-mono font-semibold">
            {categoryBudgets.length} Targets
          </span>
        </div>

        {categoryBudgets.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400 shadow-xs">
            <span className="font-semibold text-slate-600 block mb-1">No category targets set</span>
            Set budgets for Food & Dining, Groceries, Shopping, Entertainment, etc.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBudgets.map((b) => (
              <div
                key={b.id}
                className={`p-5 rounded-2xl border transition shadow-xs ${
                  b.is_exceeded
                    ? 'bg-rose-50 border-rose-200'
                    : b.is_warning
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-slate-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs"
                      style={{ backgroundColor: b.category_color || '#6366f1' }}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        {b.category_name}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Target: {formatCurrency(b.amount)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteBudget(b.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Spent: <b className="text-slate-900">{formatCurrency(b.spent)}</b></span>
                  <span
                    className={`font-bold ${
                      b.remaining >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {b.remaining >= 0 ? `Left: ${formatCurrency(b.remaining)}` : `Over: ${formatCurrency(Math.abs(b.remaining))}`}
                  </span>
                </div>

                {/* Meter */}
                <div className="mt-2 space-y-1">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        b.is_exceeded
                          ? 'bg-rose-500'
                          : b.is_warning
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                    <span>{b.percentage}% used</span>
                    {b.is_exceeded && <span className="text-rose-600 font-bold">Exceeded!</span>}
                    {b.is_warning && !b.is_exceeded && (
                      <span className="text-amber-600 font-bold">80% reached</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Set Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Set Budget ({monthNames[selectedMonth - 1]} {selectedYear})
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Budget Scope
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                >
                  <option value="">Overall Monthly Budget (All categories)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} Category Budget
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Budget Target Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 5000.00"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base font-black text-indigo-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
