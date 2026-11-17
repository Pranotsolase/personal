import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { createTransfer, getBanks } from '../../api/client';
import { BankAccount } from '../../types';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedFromId?: number;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedFromId,
}) => {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [fromAccountId, setFromAccountId] = useState<number | ''>(preselectedFromId || '');
  const [toAccountId, setToAccountId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getBanks().then((res) => {
        setBanks(res);
        if (!fromAccountId && res.length > 0) setFromAccountId(res[0].id);
        if (!toAccountId && res.length > 1) setToAccountId(res[1].id);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fromBank = banks.find((b) => b.id === Number(fromAccountId));
  const toBank = banks.find((b) => b.id === Number(toAccountId));
  const isInsufficient = fromBank && amount !== '' && Number(amount) > fromBank.current_balance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      setError('Please select both source and destination accounts');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('Source and Destination bank accounts must be different');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount greater than zero');
      return;
    }
    if (isInsufficient) {
      setError(`Insufficient balance in ${fromBank.name}. Available balance is ₹${fromBank.current_balance.toLocaleString('en-IN')}. Balance cannot go negative.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createTransfer({
        from_account_id: Number(fromAccountId),
        to_account_id: Number(toAccountId),
        amount: Number(amount),
        transfer_date: transferDate,
        reference_number: referenceNumber.trim() || undefined,
        description: description.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete internal transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Transfer Money Between Accounts</h2>
              <p className="text-xs text-indigo-600 font-medium">Moves funds without affecting income or expense totals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  From Account *
                </label>
                {fromBank && (
                  <span className={`text-[11px] font-bold ${
                    isInsufficient ? 'text-rose-600' : 'text-slate-500'
                  }`}>
                    Bal: ₹{fromBank.current_balance.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(Number(e.target.value))}
                required
                className={`w-full bg-white border rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none cursor-pointer font-medium ${
                  isInsufficient ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-500'
                }`}
              >
                <option value="">Select Source Bank</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.id === Number(toAccountId)}>
                    {b.name} (Bal: ₹{b.current_balance.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
              {isInsufficient && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  ⚠️ Transfer amount exceeds available balance. Balance cannot go negative.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                To Account *
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(Number(e.target.value))}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                <option value="">Select Destination Bank</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.id === Number(fromAccountId)}>
                    {b.name} (₹{b.current_balance.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {fromBank && toBank && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900 font-semibold">
              <span>{fromBank.name}</span>
              <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
              <span>{toBank.name}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transfer Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="10000.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              required
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base font-black text-indigo-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transfer Date *
              </label>
              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. IMPS/TRANSFER/901"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Transfer ₹10,000 from SBI to HDFC for savings rebalance"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isInsufficient}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Transferring Funds...' : isInsufficient ? 'Insufficient Balance' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
