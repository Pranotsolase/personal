import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ArrowDownLeft, ArrowUpRight, AlertCircle } from 'lucide-react';
import { settleUpcomingDue, getBanks } from '../../api/client';
import { BankAccount, UpcomingDue } from '../../types';
import { formatCurrency } from '../../utils/format';

interface SettleUpcomingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  due: UpcomingDue | null;
}

export const SettleUpcomingModal: React.FC<SettleUpcomingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  due,
}) => {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [bankId, setBankId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPayable = due?.due_type === 'PAYABLE';

  useEffect(() => {
    if (isOpen && due) {
      setAmount(due.remaining_amount);
      setReceivedDate(new Date().toISOString().split('T')[0]);
      setNotes(
        due.due_type === 'PAYABLE'
          ? `Transferred payment to ${due.person_name} for ${due.description}`
          : `Settlement from ${due.person_name} for ${due.description}`
      );
      setError(null);
      getBanks().then((res) => {
        setBanks(res);
        if (res.length > 0) setBankId(res[0].id);
      });
    }
  }, [isOpen, due]);

  if (!isOpen || !due) return null;

  const selectedBank = banks.find((b) => b.id === Number(bankId));
  const isInsufficient =
    isPayable &&
    selectedBank !== undefined &&
    amount !== '' &&
    Number(amount) > selectedBank.current_balance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankId) {
      setError(
        isPayable
          ? 'Please select a bank account to deduct the payment from'
          : 'Please select a bank account to deposit the money into'
      );
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (isInsufficient) {
      setError(
        `Insufficient balance in ${selectedBank?.name}. Available balance is ${formatCurrency(
          selectedBank?.current_balance || 0
        )}. Negative balance is strictly prohibited.`
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await settleUpcomingDue(due.id, {
        bank_account_id: Number(bankId),
        amount: Number(amount),
        received_date: receivedDate,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to settle upcoming money');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between ${
            isPayable ? 'bg-rose-50/70' : 'bg-emerald-50/70'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl text-white ${
                isPayable ? 'bg-rose-600' : 'bg-emerald-600'
              }`}
            >
              {isPayable ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isPayable ? 'Transfer / Pay Money' : 'Receive Payment'}
              </h3>
              <p className="text-xs text-slate-500">
                {isPayable
                  ? 'Deduct from your bank account to pay contact'
                  : 'Deposit into your bank account'}
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

        {/* Highlight Card */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">
              {isPayable ? 'Pay To Contact' : 'From Contact'}
            </span>
            <span className="text-sm font-bold text-slate-900">{due.person_name}</span>
            <span className="text-xs text-slate-500 block truncate max-w-[200px]">
              {due.description}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">
              {isPayable ? 'Pending to Transfer' : 'Remaining Due'}
            </span>
            <span
              className={`text-base font-extrabold ${
                isPayable ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatCurrency(due.remaining_amount)}
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

          {/* Target Bank Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isPayable ? 'Deduct From Bank Account *' : 'Deposit Into Bank Account *'}
            </label>
            <select
              value={bankId}
              onChange={(e) => setBankId(Number(e.target.value))}
              required
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Available: {formatCurrency(b.current_balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Insufficient balance warning */}
          {isInsufficient && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">⚠️ Insufficient Bank Balance: </span>
                <span>
                  {selectedBank?.name} only has {formatCurrency(selectedBank?.current_balance || 0)}.
                  Deducting {formatCurrency(Number(amount))} would cause a negative balance, which is blocked.
                </span>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isPayable ? 'Amount to Pay / Transfer (₹) *' : 'Amount to Deposit (₹) *'}
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={due.remaining_amount}
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="UPI">UPI / GPay / PhonePe / Paytm</option>
              <option value="NET_BANKING">Net Banking (IMPS / NEFT)</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </select>
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
              disabled={loading || isInsufficient}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                isPayable
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {loading
                ? isPayable
                  ? 'Transferring...'
                  : 'Depositing...'
                : isPayable
                ? 'Confirm Payment & Deduct from Bank'
                : 'Confirm & Deposit into Bank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
