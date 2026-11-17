import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  ArrowLeftRight,
  Receipt,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { getBanks, deleteBank, recalculateBankBalance, getBankTransactions, updateBank } from '../api/client';
import { BankAccount, Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface BanksProps {
  onOpenAddBank: () => void;
  onOpenTransfer: (fromBankId?: number) => void;
}

export const Banks: React.FC<BanksProps> = ({ onOpenAddBank, onOpenTransfer }) => {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Bank transactions modal state
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [bankTxns, setBankTxns] = useState<Transaction[]>([]);
  const [txnsLoading, setTxnsLoading] = useState(false);

  // Edit bank modal state
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editHolder, setEditHolder] = useState('');
  const [editType, setEditType] = useState<BankAccount['account_type']>('SAVINGS');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const res = await getBanks();
      setBanks(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const totalBalance = banks.reduce((sum, b) => sum + (b.is_active ? b.current_balance : 0), 0);
  const totalOpening = banks.reduce((sum, b) => sum + (b.is_active ? b.opening_balance : 0), 0);

  const handleRecalculate = async (id: number) => {
    try {
      await recalculateBankBalance(id);
      setMsg({ text: 'Bank balance recalculated and audited successfully!', type: 'success' });
      fetchBanks();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Failed to recalculate balance', type: 'error' });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete account "${name}"? It will be removed from your dashboard and database.`)) return;
    try {
      await deleteBank(id, true);
      setMsg({ text: `Account "${name}" deleted from database successfully`, type: 'success' });
      fetchBanks();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Failed to delete account', type: 'error' });
    }
  };

  const handleViewTransactions = async (bank: BankAccount) => {
    setSelectedBank(bank);
    try {
      setTxnsLoading(true);
      const txns = await getBankTransactions(bank.id);
      setBankTxns(txns);
    } catch (e) {
      console.error(e);
    } finally {
      setTxnsLoading(false);
    }
  };

  const handleStartEdit = (b: BankAccount) => {
    setEditingBank(b);
    setEditName(b.name);
    setEditHolder(b.account_holder_name);
    setEditType(b.account_type);
    setEditNotes(b.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBank) return;
    try {
      setEditLoading(true);
      await updateBank(editingBank.id, {
        name: editName,
        account_holder_name: editHolder,
        account_type: editType,
        notes: editNotes,
      });
      setEditingBank(null);
      setMsg({ text: 'Bank account updated successfully', type: 'success' });
      fetchBanks();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ text: 'Failed to update bank details', type: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Notification Toast */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span className="font-semibold">{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-indigo-600">
            Total Across All Accounts
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            {formatCurrency(totalBalance)}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Total Opening Capital: <b className="text-slate-700">{formatCurrency(totalOpening)}</b> • {banks.length} bank accounts tracked
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => onOpenTransfer()}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer shadow-xs active:scale-98"
          >
            <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
            Transfer Money
          </button>

          <button
            onClick={onOpenAddBank}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            + Add Bank
          </button>
        </div>
      </div>

      {/* Notice Card */}
      <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-3">
        <Building2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-indigo-950 block">Personal Bank Ledger</span>
          Bank details and balances are tracked manually in your local database with 100% privacy, zero third-party network calls, and no storage of bank credentials.
        </div>
      </div>

      {/* Grid of Bank Accounts */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading your accounts...</div>
      ) : banks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No bank accounts added yet</h3>
          <p className="text-xs text-slate-500 mt-1">Start by adding your primary savings or cash account.</p>
          <button
            onClick={onOpenAddBank}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer shadow-xs"
          >
            + Add First Bank Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {banks.map((b) => (
            <div
              key={b.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs transition flex flex-col justify-between ${
                b.is_active ? 'border-slate-200 hover:shadow-md hover:border-slate-300' : 'border-slate-200 opacity-60'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs"
                      style={{ backgroundColor: b.color || '#3b82f6' }}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">{b.name}</h3>
                      <span className="text-[11px] text-slate-500 block">{b.account_holder_name}</span>
                    </div>
                  </div>

                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                    style={{
                      backgroundColor: `${b.color || '#3b82f6'}15`,
                      color: b.color || '#3b82f6',
                    }}
                  >
                    {b.account_type}
                  </span>
                </div>

                {/* Balances */}
                <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block font-medium">Current Balance</span>
                  <p className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
                    {formatCurrency(b.current_balance)}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex justify-between text-[11px] text-slate-500">
                    <span>Opening: {formatCurrency(b.opening_balance)}</span>
                    {b.account_number_masked && <span>{b.account_number_masked}</span>}
                  </div>
                </div>

                {/* Account Details & Notes */}
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  {b.ifsc_code && (
                    <p className="text-[11px]">
                      IFSC: <span className="font-mono text-slate-700 font-semibold">{b.ifsc_code}</span>
                    </p>
                  )}
                  {b.notes && <p className="text-[11px] text-slate-600 italic line-clamp-2">"{b.notes}"</p>}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleViewTransactions(b)}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  Ledger
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenTransfer(b.id)}
                    title="Transfer money from this account"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRecalculate(b.id)}
                    title="Audit and recalculate balance from transactions"
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStartEdit(b)}
                    title="Edit account details"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id, b.name)}
                    title="Deactivate account"
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bank Transactions Ledger Modal */}
      {selectedBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                  style={{ backgroundColor: selectedBank.color }}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{selectedBank.name} - Ledger</h3>
                  <span className="text-xs text-slate-500">
                    Current Balance: <b className="text-slate-900">{formatCurrency(selectedBank.current_balance)}</b>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBank(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-2">
              {txnsLoading ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading ledger...</div>
              ) : bankTxns.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  <span className="font-semibold text-slate-600 block mb-1">Ledger Empty</span>
                  No transactions recorded for this bank yet.
                </div>
              ) : (
                bankTxns.map((t) => {
                  const isExp = t.transaction_type === 'EXPENSE' || t.transaction_type === 'TRANSFER_OUT';
                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{t.description}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {formatDate(t.transaction_date)} • {t.payment_method}
                          {t.person_name && ` • ${t.person_name}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${isExp ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isExp ? '-' : '+'}
                          {formatCurrency(t.amount)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">{t.transaction_type}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={() => setSelectedBank(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bank Modal */}
      {editingBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Edit Bank Account</h3>
              <button
                onClick={() => setEditingBank(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder</label>
                <input
                  type="text"
                  value={editHolder}
                  onChange={(e) => setEditHolder(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="SAVINGS">Savings</option>
                  <option value="CURRENT">Current</option>
                  <option value="CASH">Cash</option>
                  <option value="WALLET">Wallet</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingBank(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
