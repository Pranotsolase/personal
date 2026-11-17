import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Building2,
  Users,
  Tags,
  TrendingUp,
  PiggyBank,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import * as XLSX from 'xlsx';
import { getReports } from '../api/client';
import { formatCurrency } from '../utils/format';

type ReportType =
  | 'monthly'
  | 'daily'
  | 'yearly'
  | 'bank_wise'
  | 'person_wise'
  | 'category_wise'
  | 'savings';

export const Analytics: React.FC = () => {
  const today = new Date();
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await getReports({
        report_type: reportType,
        year,
        month,
      });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, year, month]);

  const reportButtons: Array<{ id: ReportType; label: string; icon: any }> = [
    { id: 'monthly', label: 'Monthly Report', icon: BarChart3 },
    { id: 'daily', label: 'Daily Expenses', icon: Calendar },
    { id: 'yearly', label: 'Yearly Trend', icon: TrendingUp },
    { id: 'bank_wise', label: 'Bank-wise Breakdown', icon: Building2 },
    { id: 'person_wise', label: 'Person-wise Sent/Recv', icon: Users },
    { id: 'category_wise', label: 'Category Expenses', icon: Tags },
    { id: 'savings', label: 'Savings & Net Worth', icon: PiggyBank },
  ];

  const handleExportReportExcel = () => {
    if (!data?.data || !Array.isArray(data.data)) return;
    const ws = XLSX.utils.json_to_sheet(data.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reportType);
    XLSX.writeFile(wb, `Report_${reportType}_${year}.xlsx`);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-indigo-600">
            Intelligence & Analytics
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Financial Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Understand exactly where every Rupee comes from and where every Rupee goes.
          </p>
        </div>

        <button
          onClick={handleExportReportExcel}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer shadow-xs active:scale-98 self-start md:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Export Report (.xlsx)
        </button>
      </div>

      {/* Report Selection Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-2 rounded-2xl shadow-xs">
        {reportButtons.map((btn) => {
          const Icon = btn.icon;
          const active = reportType === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setReportType(btn.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                active
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* Year / Month Filter bar if applicable */}
      {(reportType === 'monthly' || reportType === 'daily') && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600">Target Year:</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none font-semibold shadow-xs"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {reportType === 'daily' && (
            <>
              <span className="text-xs font-bold text-slate-600 ml-2">Month:</span>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none font-semibold shadow-xs"
              >
                {[
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ].map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      {/* Report Content View */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Computing financial analytics...</div>
      ) : (
        <div className="space-y-6">
          {/* 1. Monthly Report */}
          {reportType === 'monthly' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4">
                  Monthly Income vs Expenses vs Savings ({year})
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
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
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="savings" name="Net Savings" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs w-full max-w-full">
                <div className="overflow-x-auto w-full scrollbar-thin">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="py-3 px-4">Month</th>
                        <th className="py-3 px-4 text-right">Income</th>
                        <th className="py-3 px-4 text-right">Expense</th>
                        <th className="py-3 px-4 text-right">Net Savings</th>
                        <th className="py-3 px-4 text-right">Savings Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data?.data?.map((m: any) => (
                        <tr key={m.month_num} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{m.month}</td>
                          <td className="py-3 px-4 text-right text-emerald-600 font-bold">
                            {formatCurrency(m.income)}
                          </td>
                          <td className="py-3 px-4 text-right text-rose-600 font-bold">
                            {formatCurrency(m.expense)}
                          </td>
                          <td className={`py-3 px-4 text-right font-black ${m.savings >= 0 ? 'text-sky-700' : 'text-rose-600'}`}>
                            {formatCurrency(m.savings)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700 font-semibold">
                            {m.savings_rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. Daily Report */}
          {reportType === 'daily' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4">
                  Daily Expense & Income Breakdown (Month {month}/{year})
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
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
                      <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" fill="#f43f5e20" />
                      <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fill="#10b98120" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs w-full max-w-full">
                <div className="overflow-x-auto w-full scrollbar-thin">
                  <table className="w-full text-left text-xs min-w-[450px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Income</th>
                        <th className="py-3 px-4 text-right">Expense</th>
                        <th className="py-3 px-4 text-right">Net Flow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data?.data?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">No daily records for this month</td>
                        </tr>
                      ) : (
                        data?.data?.map((d: any) => (
                          <tr key={d.date} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono text-slate-800 font-semibold">{d.date}</td>
                            <td className="py-3 px-4 text-right text-emerald-600 font-bold">
                              +{formatCurrency(d.income)}
                            </td>
                            <td className="py-3 px-4 text-right text-rose-600 font-bold">
                              -{formatCurrency(d.expense)}
                            </td>
                            <td className={`py-3 px-4 text-right font-black ${d.net >= 0 ? 'text-sky-700' : 'text-rose-600'}`}>
                              {formatCurrency(d.net)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. Yearly Report */}
          {reportType === 'yearly' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs min-w-0 overflow-hidden">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Multi-Year Financial Trends</h3>
                <div className="h-72 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 11 }} />
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
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="savings" name="Savings" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 4. Bank-wise Report */}
          {reportType === 'bank_wise' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs w-full max-w-full">
              <div className="overflow-x-auto w-full scrollbar-thin">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-3 px-4">Bank Account</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Opening Bal</th>
                      <th className="py-3 px-4 text-right">Total Inflow</th>
                      <th className="py-3 px-4 text-right">Total Outflow</th>
                      <th className="py-3 px-4 text-right">Transfers In</th>
                      <th className="py-3 px-4 text-right">Transfers Out</th>
                      <th className="py-3 px-4 text-right">Current Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.data?.map((b: any) => (
                      <tr key={b.bank_id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                            <span className="font-bold text-slate-900">{b.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{b.account_type}</td>
                        <td className="py-3 px-4 text-right text-slate-500 font-semibold">{formatCurrency(b.opening_balance)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-bold">+{formatCurrency(b.total_income)}</td>
                        <td className="py-3 px-4 text-right text-rose-600 font-bold">-{formatCurrency(b.total_expense)}</td>
                        <td className="py-3 px-4 text-right text-indigo-700 font-mono">+{formatCurrency(b.total_transfers_in)}</td>
                        <td className="py-3 px-4 text-right text-indigo-700 font-mono">-{formatCurrency(b.total_transfers_out)}</td>
                        <td className="py-3 px-4 text-right text-slate-900 font-black">{formatCurrency(b.current_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Person-wise Report */}
          {reportType === 'person_wise' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs w-full max-w-full">
              <div className="overflow-x-auto w-full scrollbar-thin">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-3 px-4">Contact / Payee</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4 text-right">Total Sent To Person</th>
                      <th className="py-3 px-4 text-right">Total Received From Person</th>
                      <th className="py-3 px-4 text-right">Net Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.data?.map((p: any) => (
                      <tr key={p.person_id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{p.phone || '—'}</td>
                        <td className="py-3 px-4 text-right text-rose-600 font-bold">{formatCurrency(p.total_sent)}</td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-bold">{formatCurrency(p.total_received)}</td>
                        <td className={`py-3 px-4 text-right font-black ${
                          p.net_sent > 0 ? 'text-amber-600' : p.net_sent < 0 ? 'text-emerald-600' : 'text-slate-500'
                        }`}>
                          {p.net_sent > 0
                            ? `You Sent ₹${p.net_sent.toLocaleString('en-IN')} more`
                            : p.net_sent < 0
                            ? `Received ₹${Math.abs(p.net_sent).toLocaleString('en-IN')} more`
                            : 'Settled'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. Category-wise Report */}
          {reportType === 'category_wise' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Expense Distribution by Category</h3>
                <div className="h-64 w-full">
                  {data?.data?.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No expenses recorded yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.data || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="amount"
                        >
                          {data?.data?.map((entry: any, index: number) => (
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
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs w-full max-w-full">
                <div className="overflow-x-auto w-full scrollbar-thin">
                  <table className="w-full text-left text-xs min-w-[280px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Total Expense</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.data?.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-slate-400">No category expenditures yet</td>
                      </tr>
                    ) : (
                      data?.data?.map((c: any) => (
                        <tr key={c.category_id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                              <span className="font-bold text-slate-900">{c.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-rose-600 font-bold">
                            {formatCurrency(c.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

          {/* 7. Savings & Net Worth */}
          {reportType === 'savings' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-2">Net Savings & Growth Analysis</h3>
              <p className="text-xs text-slate-500 mb-6">
                Your savings rate represents how much of your total incoming cash flow is retained across all accounts.
              </p>
              <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-indigo-900">Financial Independence Rule</span>
                <p className="text-xs text-slate-600 mt-1">
                  Aim for a consistent savings rate above 20%. Any surplus retained in savings accounts or cash reserves compounds over time.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
