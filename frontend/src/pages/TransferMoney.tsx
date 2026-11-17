import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, Trash2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { getTransfers, getBanks, createTransfer, deleteTransfer } from '../api/client';
import { Transfer, BankAccount } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface TransferMoneyProps {
  onOpenQuickModal: (type: 'transfer') => void;
}

export const TransferMoney: React.FC<TransferMoneyProps> = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [fromAccountId, setFromAccountId] = useState<number | ''>('');
  const [toAccountId, setToAccountId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trRes, bRes] = await Promise.all([getTransfers(), getBanks()]);
      setTransfers(trRes);
      setBanks(bRes);
      if (bRes.length >= 2) {
        if (!fromAccountId) setFromAccountId(bRes[0].id);
        if (!toAccountId) setToAccountId(bRes[1].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      setError('Select both source and target bank accounts');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('Source and Destination accounts must be different');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createTransfer({
        from_account_id: Number(fromAccountId),
        to_account_id: Number(toAccountId),
        amount: Number(amount),
        transfer_date: transferDate,
        reference_number: referenceNumber.trim() || undefined,
        description: description.trim() || undefined,
      });
      setSuccess('Transfer executed successfully! Balances updated.');
      setAmount('');
      setReferenceNumber('');
      setDescription('');
      loadData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransfer = async (id: number) => {
    if (!window.confirm('Delete this transfer and reverse both bank account balances?')) return;
    try {
      await deleteTransfer(id);
      setSuccess('Transfer reversed and removed from ledger.');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to reverse transfer');
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Title Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <span className="text-xs uppercase tracking-wider font-bold text-indigo-600">
          Internal Reallocation
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
          Internal Bank Transfers
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Move funds seamlessly between your personal accounts (e.g. Transfer ₹10,000 from SBI to HDFC). Does not count as an income or expense.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-semibold">{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {/* Grid: Form on Left, History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Execution Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
            New Account Transfer
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Deducts from source and credits target simultaneously.
          </p>

          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">From Account</label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.id === Number(toAccountId)}>
                    {b.name} (Bal: {formatCurrency(b.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center -my-1 text-slate-400">
              <ArrowLeftRight className="w-4 h-4 rotate-90" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">To Account</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.id === Number(fromAccountId)}>
                    {b.name} (Bal: {formatCurrency(b.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="10000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-black text-indigo-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reference / IMPS / Txn ID
              </label>
              <input
                type="text"
                placeholder="e.g. IMPS/TRANSFER/901"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Transfer from SBI to HDFC"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 mt-2 active:scale-98"
            >
              {submitting ? 'Processing Transfer...' : 'Execute Internal Transfer'}
            </button>
          </form>
        </div>

        {/* Transfer History */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Transfer History</h2>
              <p className="text-xs text-slate-500">All recorded internal movements between your bank accounts</p>
            </div>
            <span className="text-xs font-mono text-slate-500 font-semibold">{transfers.length} transfers</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-12 text-xs text-slate-400">Loading transfers...</div>
            ) : transfers.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-400">
                <span className="font-bold text-slate-700 block mb-1">No transfers recorded yet</span>
                Transfer money from one account to another above.
              </div>
            ) : (
              transfers.map((tr) => (
                <div
                  key={tr.id}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{tr.from_account_name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-900">{tr.to_account_name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {formatDate(tr.transfer_date)}
                        {tr.description && ` • ${tr.description}`}
                        {tr.reference_number && ` • Ref: ${tr.reference_number}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-black text-indigo-700">
                        {formatCurrency(tr.amount)}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold">Reallocated</span>
                    </div>

                    <button
                      onClick={() => handleDeleteTransfer(tr.id)}
                      title="Reverse transfer"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
    </div>
  );
};
