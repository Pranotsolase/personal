import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Search, Trash2 } from 'lucide-react';
import { getTransactions, deleteTransaction } from '../api/client';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface MoneySentProps {
  onOpenQuickModal: (type: 'sent') => void;
}

export const MoneySent: React.FC<MoneySentProps> = ({ onOpenQuickModal }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    getTransactions({
      transaction_type: 'EXPENSE',
      search: search.trim() || undefined,
      sort_by: 'date',
      sort_order: 'desc',
    })
      .then((res) => setTransactions(res))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleDelete = async (id: number, desc: string) => {
    if (!window.confirm(`Delete expense "${desc}"? Account balance will be restored.`)) return;
    try {
      await deleteTransaction(id);
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to delete transaction');
    }
  };

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Group by payee
  const payeeMap: { [name: string]: number } = {};
  transactions.forEach((t) => {
    const name = t.person_name || 'Others';
    payeeMap[name] = (payeeMap[name] || 0) + t.amount;
  });
  const topPayees = Object.entries(payeeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-rose-600">
            Outgoing Transactions
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Money Sent ({formatCurrency(totalSpent)})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track who you sent money to, what categories you spent on, and from which bank accounts.
          </p>
        </div>

        <button
          onClick={() => onOpenQuickModal('sent')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20 cursor-pointer active:scale-98"
        >
          <ArrowUpRight className="w-4 h-4" />
          + Money Sent
        </button>
      </div>

      {/* Top Payees Cards */}
      {topPayees.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topPayees.map(([name, amt]) => (
            <div key={name} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold block truncate">Payee / Receiver</span>
              <p className="text-sm font-bold text-slate-900 mt-1 truncate">{name}</p>
              <p className="text-base font-black text-rose-600 mt-0.5">{formatCurrency(amt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search money sent by payee, description, bank..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-xs"
        />
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading outgoing transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <span className="font-bold text-slate-700 block mb-1">No money sent records</span>
              Click "+ Money Sent" to record your first expense.
            </div>
          ) : (
            transactions.map((t) => (
              <div
                key={t.id}
                className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{t.description}</p>
                      {t.category_name && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded font-semibold"
                          style={{
                            backgroundColor: `${t.category_color}18`,
                            color: t.category_color || '#e11d48',
                          }}
                        >
                          {t.category_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(t.transaction_date)} • Deducted from{' '}
                      <b className="text-slate-800">{t.bank_account_name}</b> • {t.payment_method}
                      {t.person_name && ` • Receiver: ${t.person_name}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-base font-black text-rose-600">
                      -{formatCurrency(t.amount)}
                    </p>
                    {t.reference_number && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {t.reference_number}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(t.id, t.description)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
