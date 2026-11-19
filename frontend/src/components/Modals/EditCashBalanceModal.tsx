import React, { useState, useEffect } from 'react';
import { X, Wallet, CheckCircle2, AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { updateDirectBalance } from '../../api/client';
import { BankAccount } from '../../types';
import { formatCurrency } from '../../utils/format';

interface EditCashBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account: BankAccount | null;
}

export const EditCashBalanceModal: React.FC<EditCashBalanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  account,
}) => {
  const [balance, setBalance] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && account) {
      setBalance(account.current_balance);
      setError(null);
    }
  }, [isOpen, account]);

  if (!isOpen || !account) return null;

  const handleQuickAdd = (amount: number) => {
    const current = Number(balance) || 0;
    setBalance(Math.max(0, current + amount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (balance === '' || Number(balance) < 0) {
      setError('Please enter a valid balance of ₹0.00 or more');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await updateDirectBalance(account.id, Number(balance));
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {account.account_type === 'CASH' ? 'Edit Cash in Wallet' : `Edit Balance: ${account.name}`}
              </h3>
              <p className="text-xs text-slate-500">
                Directly adjust and count physical cash / wallet funds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Info */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">Account</span>
            <span className="text-sm font-bold text-slate-900">{account.name}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">Previous Balance</span>
            <span className="text-sm font-extrabold text-slate-600">
              {formatCurrency(account.current_balance)}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* New Balance Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {account.account_type === 'CASH' ? 'Actual Cash in Hand (₹) *' : 'New Current Balance (₹) *'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-base">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                required
                autoFocus
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-lg text-slate-900 font-black placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Count cash in your wallet or pocket and enter the real current total.
            </p>
          </div>

          {/* Quick Adjustment Pills */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Quick Add to Cash:</span>
            <div className="flex flex-wrap gap-2">
              {[100, 200, 500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAdd(amt)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition cursor-pointer active:scale-95 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />₹{amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBalance(0)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition cursor-pointer"
              >
                Reset to 0
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Cash Balance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
