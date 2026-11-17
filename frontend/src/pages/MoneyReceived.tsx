import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, Search, Trash2 } from 'lucide-react';
import { getTransactions, deleteTransaction } from '../api/client';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface MoneyReceivedProps {
  onOpenQuickModal: (type: 'received') => void;
}

export const MoneyReceived: React.FC<MoneyReceivedProps> = ({ onOpenQuickModal }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    getTransactions({
      transaction_type: 'INCOME',
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
    if (!window.confirm(`Delete income "${desc}"? Account balance will be restored.`)) return;
    try {
      await deleteTransaction(id);
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to delete transaction');
    }
  };

  const totalReceived = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Group by sender
  const senderMap: { [name: string]: number } = {};
  transactions.forEach((t) => {
    const name = t.person_name || 'Others';
    senderMap[name] = (senderMap[name] || 0) + t.amount;
  });
  const topSenders = Object.entries(senderMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-emerald-600">
            Incoming Transactions
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Money Received (+{formatCurrency(totalReceived)})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track who sent you money, salary, client fees, refunds, and into which bank account.
          </p>
        </div>

        <button
          onClick={() => onOpenQuickModal('received')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer active:scale-98"
        >
          <ArrowDownLeft className="w-4 h-4" />
          + Money Received
        </button>
      </div>

      {/* Top Senders Cards */}
      {topSenders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topSenders.map(([name, amt]) => (
            <div key={name} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <span className="text-[11px] text-slate-500 font-semibold block truncate">Sender / Source</span>
              <p className="text-sm font-bold text-slate-900 mt-1 truncate">{name}</p>
              <p className="text-base font-black text-emerald-600 mt-0.5">{formatCurrency(amt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search money received by sender, description, bank..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs"
        />
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading incoming transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <span className="font-bold text-slate-700 block mb-1">No money received records</span>
              Click "+ Money Received" to record salary, payments, or gifts.
            </div>
          ) : (
            transactions.map((t) => (
              <div
                key={t.id}
                className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{t.description}</p>
                      {t.category_name && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded font-semibold"
                          style={{
                            backgroundColor: `${t.category_color}18`,
                            color: t.category_color || '#059669',
                          }}
                        >
                          {t.category_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(t.transaction_date)} • Credited to{' '}
                      <b className="text-slate-800">{t.bank_account_name}</b> • {t.payment_method}
                      {t.person_name && ` • Sender: ${t.person_name}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-base font-black text-emerald-600">
                      +{formatCurrency(t.amount)}
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
                    title="Delete income transaction"
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
