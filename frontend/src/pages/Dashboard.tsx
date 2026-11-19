import React, { useEffect, useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  Clock,
  Trash2,
  Edit2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { getDashboardData, getTransactions, deleteTransaction, getCashWallet } from '../api/client';
import { DashboardData, Transaction, BankAccount } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { EditCashBalanceModal } from '../components/Modals/EditCashBalanceModal';

interface DashboardProps {
  dateFilter: string;
  onOpenQuickModal: (type: 'sent' | 'received' | 'transfer' | 'bank' | 'cash') => void;
  onNavigateTab: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  dateFilter,
  onOpenQuickModal,
  onNavigateTab,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [cashWallet, setCashWallet] = useState<BankAccount | null>(null);
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, txnRes, cashRes] = await Promise.all([
        getDashboardData({ filter_type: dateFilter }),
        getTransactions({ limit: 6, sort_by: 'date', sort_order: 'desc' }),
        getCashWallet().catch(() => null),
      ]);
      setData(dashRes);
      setRecentTxns(txnRes);
      setCashWallet(cashRes);
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const handleDeleteRecentTxn = async (id: number, desc: string) => {
    if (!window.confirm(`Delete "${desc}"? It will be permanently removed from database and balances will be recalculated.`)) return;
    try {
      await deleteTransaction(id);
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to delete transaction');
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const s = data?.summary;
  const budget = s?.budget_status;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Dynamic Smart Insights Banner */}
      {data?.insights && data.insights.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-emerald-50/80 border border-indigo-100 rounded-2xl p-3.5 sm:p-4.5 shadow-xs flex items-start gap-3 sm:gap-3.5">
          <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              Personalized Financial Insights
            </h2>
            <div className="mt-1.5 flex flex-wrap gap-1.5 sm:gap-2 text-xs font-medium text-slate-700">
              {data.insights.map((insight, idx) => (
                <span key={idx} className="flex items-center gap-1.5 bg-white/70 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-xs text-[11px] sm:text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span className="truncate">{insight}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Pending Money Notification Banner */}
      {s?.pending_incoming_amount !== undefined && s.pending_incoming_amount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-emerald-500/10 border border-amber-200 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">
                  Upcoming Money to Collect: {formatCurrency(s.pending_incoming_amount)}
                </span>
                {s.overdue_incoming_amount ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                    {formatCurrency(s.overdue_incoming_amount)} Overdue
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                You have {s.pending_incoming_count || 1} pending collection{(s.pending_incoming_count || 1) === 1 ? '' : 's'} waiting to be deposited.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('upcoming-money')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto shrink-0 active:scale-98"
          >
            <span>View & Collect</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Transfers To Others Banner */}
      {s?.pending_payable_amount !== undefined && s.pending_payable_amount > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-orange-400/15 to-rose-500/10 border border-rose-200 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 shadow-xs">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">
                  Pending Transfers to Others: {formatCurrency(s.pending_payable_amount)}
                </span>
                {s.overdue_payable_amount ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                    {formatCurrency(s.overdue_payable_amount)} Overdue
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                You have {s.pending_payable_count || 1} pending payment{(s.pending_payable_count || 1) === 1 ? '' : 's'} to transfer to contacts.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('upcoming-money')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto shrink-0 active:scale-98"
          >
            <span>View & Pay</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cash Wallet (Physical Cash in Hand) Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                💵 Cash Wallet (Cash in Hand)
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Directly Editable
              </span>
            </div>
            {cashWallet ? (
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(cashWallet.current_balance)}
                </span>
                <span className="text-xs text-slate-500 font-medium">({cashWallet.name})</span>
              </div>
            ) : (
              <p className="text-xs text-slate-600 mt-0.5">
                No cash wallet added yet. Track physical cash notes in your pocket directly.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {cashWallet ? (
            <>
              <button
                onClick={() => setIsEditingCash(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Cash Balance</span>
              </button>
              <button
                onClick={() => onNavigateTab('banks')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
              >
                <span>Accounts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => onOpenQuickModal('cash')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
            >
              <span>+ Add Cash Wallet</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
        {/* 1. Total Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4.5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] sm:text-xs font-semibold">Total Balance</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-slate-900 mt-1.5 sm:mt-2 tracking-tight truncate">
            {formatCurrency(s?.total_balance)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1 truncate">
            Across {s?.bank_accounts_count || 0} accounts
          </span>
        </div>

        {/* 2. Total Income */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4.5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] sm:text-xs font-semibold">Total Income</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-emerald-600 mt-1.5 sm:mt-2 tracking-tight truncate">
            +{formatCurrency(s?.total_income)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1 block truncate">
            {s?.top_sender ? `Top: ${s.top_sender}` : 'Selected period'}
          </span>
        </div>

        {/* 3. Total Expenses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4.5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] sm:text-xs font-semibold">Total Expenses</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-rose-600 mt-1.5 sm:mt-2 tracking-tight truncate">
            -{formatCurrency(s?.total_expenses)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1 block truncate">
            {s?.highest_expense_category ? `Top: ${s.highest_expense_category}` : 'Selected period'}
          </span>
        </div>

        {/* 4. Total Savings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4.5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] sm:text-xs font-semibold">Net Savings</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className={`text-base sm:text-xl font-black mt-1.5 sm:mt-2 tracking-tight truncate ${
            (s?.total_savings ?? 0) >= 0 ? 'text-sky-700' : 'text-rose-600'
          }`}>
            {formatCurrency(s?.total_savings)}
          </p>
          <span className="text-[10px] sm:text-[11px] text-sky-600 font-semibold mt-1 block truncate">
            {s?.savings_rate || 0}% Savings Rate
          </span>
        </div>

        {/* 5. Number of Bank Accounts */}
        <div
          onClick={() => onNavigateTab('banks')}
          className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4.5 shadow-xs hover:shadow-md hover:border-indigo-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] sm:text-xs font-semibold">My Banks</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-slate-900 mt-1.5 sm:mt-2 tracking-tight truncate">
            {s?.bank_accounts_count || 0} Accounts
          </p>
          <span className="text-[10px] sm:text-[11px] text-indigo-600 font-bold flex items-center gap-0.5 mt-1">
            Manage Banks <ChevronRight className="w-3 h-3" />
          </span>
        </div>

        {/* 6. Current Month Spending */}
        <div
          onClick={() => onNavigateTab('budgets')}
          className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4.5 shadow-xs hover:shadow-md hover:border-indigo-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] sm:text-xs font-semibold">Month Spending</span>
            <div className="p-1 sm:p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-black text-slate-900 mt-1.5 sm:mt-2 tracking-tight truncate">
            {formatCurrency(s?.current_month_spending)}
          </p>
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] mt-1 font-medium truncate">
            {s?.spending_change_percentage ? (
              s.spending_change_percentage > 0 ? (
                <span className="text-rose-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +{s.spending_change_percentage}%
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> {s.spending_change_percentage}%
                </span>
              )
            ) : (
              <span className="text-slate-500 truncate">Current month</span>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Budget Progress Bar Banner */}
      {budget && (
        <div className={`p-4.5 rounded-2xl border ${
          budget.is_exceeded
            ? 'bg-rose-50 border-rose-200'
            : budget.is_warning
            ? 'bg-amber-50 border-amber-200'
            : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              {budget.is_exceeded && <AlertTriangle className="w-4 h-4 text-rose-600" />}
              {budget.is_warning && <AlertTriangle className="w-4 h-4 text-amber-600" />}
              Monthly Budget Status: {budget.percentage}% Consumed
            </span>
            <span className="text-slate-600">
              Spent: <b className="text-slate-900">{formatCurrency(budget.spent)}</b> of{' '}
              {formatCurrency(budget.budget_amount)} (Remaining:{' '}
              <b className={budget.remaining >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                {formatCurrency(budget.remaining)}
              </b>)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                budget.is_exceeded
                  ? 'bg-rose-500'
                  : budget.is_warning
                  ? 'bg-amber-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(budget.percentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Daily Spending & Income Trend */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Daily Spending & Income Trends</h2>
              <p className="text-xs text-slate-500">Flow over the selected timeline</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expense
              </span>
            </div>
          </div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.charts.daily_spending_trend || []}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(val: any) => formatCurrency(Number(val))}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  name="Expense"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown by Category */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col min-w-0 overflow-hidden">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-900">Expense Breakdown</h2>
            <p className="text-xs text-slate-500">Category-wise expenditure distribution</p>
          </div>
          <div className="h-52 w-full flex-1 min-w-0">
            {data?.charts.category_breakdown && data.charts.category_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.category_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.charts.category_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#0f172a',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(val: any) => formatCurrency(Number(val))}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400">
                <span className="font-semibold text-slate-500">₹0.00 spent</span>
                <span>No expense recorded for this period</span>
              </div>
            )}
          </div>
          {/* Top categories list */}
          <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-100">
            {data?.charts.category_breakdown.slice(0, 3).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-700 font-medium truncate max-w-[120px]">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Bank Balance Distribution & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Account Balance Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bank Balance Distribution</h2>
              <p className="text-xs text-slate-500">Total: {formatCurrency(s?.total_balance)}</p>
            </div>
            <button
              onClick={() => onOpenQuickModal('transfer')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              Transfer
            </button>
          </div>
          <div className="space-y-3">
            {data?.charts.account_distribution.map((acc) => (
              <div key={acc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: acc.color }} />
                    <span className="font-bold text-slate-800">{acc.name}</span>
                  </div>
                  <span className="font-black text-slate-900">{formatCurrency(acc.balance)}</span>
                </div>
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(acc.percentage, acc.balance > 0 ? 3 : 0)}%`,
                      backgroundColor: acc.color || '#3b82f6',
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>{acc.percentage}% of total wealth</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Financial Activities */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-500">Latest financial activities across all accounts</p>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {recentTxns.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 py-10">
                <span className="font-bold text-slate-600 mb-1">No transactions recorded yet</span>
                <span>Click "+ Money Sent" or "+ Money Received" to record an activity.</span>
              </div>
            ) : (
              recentTxns.map((t) => {
                const isExpense = t.transaction_type === 'EXPENSE' || t.transaction_type === 'TRANSFER_OUT';
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isExpense ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {isExpense ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{t.description}</p>
                          {t.category_name && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                              style={{
                                backgroundColor: `${t.category_color}18`,
                                color: t.category_color || '#475569',
                              }}
                            >
                              {t.category_name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {formatDate(t.transaction_date)} • {t.bank_account_name} • {t.payment_method}
                          {t.person_name && ` • ${t.person_name}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p
                          className={`text-sm font-extrabold ${
                            isExpense ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isExpense ? '-' : '+'}
                          {formatCurrency(t.amount)}
                        </p>
                        {t.reference_number && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {t.reference_number}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteRecentTxn(t.id, t.description)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Edit Cash Balance Modal */}
      {cashWallet && (
        <EditCashBalanceModal
          isOpen={isEditingCash}
          onClose={() => setIsEditingCash(false)}
          onSuccess={loadData}
          account={cashWallet}
        />
      )}
    </div>
  );
};
