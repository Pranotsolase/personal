import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, AlertCircle } from 'lucide-react';
import { createTransaction, getBanks, getCategories, getPeople } from '../../api/client';
import { BankAccount, Category, Person } from '../../types';

interface MoneySentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedBankId?: number;
}

export const MoneySentModal: React.FC<MoneySentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedBankId,
}) => {
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const [amount, setAmount] = useState<number | ''>('');
  const [bankId, setBankId] = useState<number | ''>(preselectedBankId || '');
  const [personName, setPersonName] = useState('');
  const [receiverBank, setReceiverBank] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getBanks().then((res) => {
        setBanks(res);
        if (!bankId && res.length > 0) setBankId(res[0].id);
      });
      getCategories('EXPENSE').then((res) => {
        setCategories(res);
        if (res.length > 0) setCategoryId(res[0].id);
      });
      getPeople().then((res) => setPeople(res));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedBank = banks.find((b) => b.id === Number(bankId));
  const isInsufficient = selectedBank && amount !== '' && Number(amount) > selectedBank.current_balance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount greater than zero');
      return;
    }
    if (!bankId) {
      setError('Please select a bank account to deduct money from');
      return;
    }
    if (selectedBank && Number(amount) > selectedBank.current_balance) {
      setError(`Insufficient balance in ${selectedBank.name}. Current balance is ₹${selectedBank.current_balance.toLocaleString('en-IN')}. Balance cannot go negative.`);
      return;
    }
    const selectedCat = categories.find((c) => c.id === categoryId);
    const finalDescription =
      description.trim() ||
      (personName.trim()
        ? `Paid to ${personName.trim()}`
        : selectedCat
        ? `${selectedCat.name} Expense`
        : 'Money Sent');

    try {
      setLoading(true);
      setError(null);
      await createTransaction({
        transaction_type: 'EXPENSE',
        amount: Number(amount),
        bank_account_id: Number(bankId),
        person_name: personName.trim() || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        transaction_date: transactionDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || undefined,
        description: finalDescription,
        notes: [receiverBank ? `Receiver Bank: ${receiverBank}` : '', notes].filter(Boolean).join(' | '),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record outgoing transaction');
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
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Money Sent (Expense)</h2>
              <p className="text-xs text-rose-600 font-medium">Deducts automatically from selected bank account</p>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="5000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base font-black text-rose-600 placeholder-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  From Bank Account *
                </label>
                {selectedBank && (
                  <span className={`text-[11px] font-bold ${
                    isInsufficient ? 'text-rose-600' : 'text-slate-500'
                  }`}>
                    Bal: ₹{selectedBank.current_balance.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <select
                value={bankId}
                onChange={(e) => setBankId(Number(e.target.value))}
                required
                className={`w-full bg-white border rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none cursor-pointer font-medium ${
                  isInsufficient ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-500'
                }`}
              >
                <option value="">Select Bank</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (Bal: ₹{b.current_balance.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
              {isInsufficient && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  ⚠️ Amount exceeds balance. Negative balance is not allowed.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receiver Name / Payee
              </label>
              <input
                type="text"
                list="people-list"
                placeholder="e.g. Rahul, Electricity Dept"
                value={personName}
                onChange={(e) => {
                  setPersonName(e.target.value);
                  if (!description) {
                    setDescription(`Sent ₹${amount || ''} to ${e.target.value}`);
                  }
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <datalist id="people-list">
                {people.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Receiver Bank (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC, ICICI, Google Pay"
                value={receiverBank}
                onChange={(e) => setReceiverBank(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="NET_BANKING">Net Banking / IMPS / NEFT</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction ID / UPI Reference
              </label>
              <input
                type="text"
                placeholder="e.g. UPI/3910248/sent"
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
              placeholder="e.g. Sent ₹5,000 to Rahul or dinner split"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Additional notes about this expenditure..."
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
              disabled={loading || isInsufficient}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Recording Expense...' : isInsufficient ? 'Insufficient Balance' : 'Record Money Sent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
