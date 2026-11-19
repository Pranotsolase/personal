import React, { useState, useEffect } from 'react';
import { X, Building2, Wallet, AlertCircle } from 'lucide-react';
import { createBank } from '../../api/client';
import { BankAccount } from '../../types';

interface AddBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: 'BANK' | 'CASH';
}

const COLOR_OPTIONS = [
  '#059669', // Emerald (Cash default)
  '#2563eb', // Blue
  '#0891b2', // Cyan
  '#7c3aed', // Purple
  '#ea580c', // Orange
  '#dc2626', // Red
  '#db2777', // Pink
  '#475569', // Slate
];

export const AddBankModal: React.FC<AddBankModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'BANK',
}) => {
  const [mode, setMode] = useState<'BANK' | 'CASH'>(initialType);
  const [name, setName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountType, setAccountType] = useState<BankAccount['account_type']>('SAVINGS');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number | ''>(0);
  const [currentBalance, setCurrentBalance] = useState<number | ''>(0);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialType);
      setError(null);
      if (initialType === 'CASH') {
        setName('Cash in Hand');
        setAccountHolderName('Cash in Hand');
        setAccountType('CASH');
        setColor('#059669');
        setOpeningBalance(0);
        setCurrentBalance(0);
      } else {
        setName('');
        setAccountHolderName('');
        setAccountType('SAVINGS');
        setColor('#2563eb');
        setOpeningBalance(0);
        setCurrentBalance(0);
      }
    }
  }, [isOpen, initialType]);

  const switchMode = (newMode: 'BANK' | 'CASH') => {
    setMode(newMode);
    setError(null);
    if (newMode === 'CASH') {
      setName('Cash in Hand');
      setAccountHolderName('Cash in Hand');
      setAccountType('CASH');
      setColor('#059669');
    } else {
      setName('');
      setAccountHolderName('');
      setAccountType('SAVINGS');
      setColor('#2563eb');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(mode === 'CASH' ? 'Please provide a name for your Cash Wallet' : 'Please provide Bank Name');
      return;
    }
    if (mode === 'BANK' && !accountHolderName.trim()) {
      setError('Please provide Account Holder Name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createBank({
        name: name.trim(),
        account_holder_name: mode === 'CASH' ? (accountHolderName.trim() || 'Cash in Hand') : accountHolderName.trim(),
        account_type: mode === 'CASH' ? 'CASH' : accountType,
        account_number_masked: mode === 'BANK' && accountNumber.trim() ? `•••• ${accountNumber.trim().slice(-4)}` : undefined,
        ifsc_code: mode === 'BANK' && ifscCode.trim() ? ifscCode.trim().toUpperCase() : undefined,
        opening_balance: Number(openingBalance) || 0,
        current_balance: currentBalance !== '' ? Number(currentBalance) : (Number(openingBalance) || 0),
        color,
        notes: notes.trim() || undefined,
        is_active: true,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between ${
          mode === 'CASH' ? 'bg-emerald-50/70' : 'bg-slate-50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${
              mode === 'CASH' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {mode === 'CASH' ? <Wallet className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {mode === 'CASH' ? 'Add Cash Wallet' : 'Add Bank Account'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'CASH'
                  ? 'Track physical cash in your pocket or wallet directly'
                  : 'Add a savings, current, or business bank account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Switcher */}
        <div className="px-6 pt-4 pb-1">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => switchMode('BANK')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'BANK' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Bank Account</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('CASH')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'CASH' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>💵 Cash Wallet</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {mode === 'CASH' ? (
            /* Cash Wallet Specific Inputs */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wallet / Cash Label *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cash in Hand, Pocket Cash, Home Safe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Cash in Hand (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-base">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={currentBalance}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setCurrentBalance(val);
                      setOpeningBalance(val);
                    }}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-lg text-slate-900 font-black placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  You can directly edit this cash amount anytime when counting cash.
                </p>
              </div>
            </div>
          ) : (
            /* Bank Account Specific Inputs */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank / Account Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Salary, SBI Savings"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pranoy Roy"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                  >
                    <option value="SAVINGS">Savings Account</option>
                    <option value="CURRENT">Current Account</option>
                    <option value="WALLET">Digital Wallet (Paytm/Amazon)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Number (Last 4 digits)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4892 (Stored masked)"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    maxLength={20}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IFSC Code (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="HDFC0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    maxLength={11}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={openingBalance}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                      setOpeningBalance(val);
                      if (currentBalance === 0 || currentBalance === '') {
                        setCurrentBalance(val);
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Balance (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>
            </>
          )}

          {/* Color tag */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Badge Color
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full cursor-pointer transition shadow-xs ${
                    color === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              placeholder={
                mode === 'CASH'
                  ? 'e.g. Physical cash in wallet, safe, or emergency cash'
                  : 'e.g. Primary salary account, linked with credit card'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
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
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-md cursor-pointer disabled:opacity-50 ${
                mode === 'CASH'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
              }`}
            >
              {loading
                ? 'Saving...'
                : mode === 'CASH'
                ? 'Create Cash Wallet'
                : 'Save Bank Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
