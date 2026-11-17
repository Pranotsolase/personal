import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { createTransaction, getBanks, getCategories, getPeople } from '../../api/client';
import { BankAccount, Category, Person } from '../../types';

interface MoneyReceivedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedBankId?: number;
}

export const MoneyReceivedModal: React.FC<MoneyReceivedModalProps> = ({
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
  const [senderBank, setSenderBank] = useState('');
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
      getCategories('INCOME').then((res) => {
        setCategories(res);
        if (res.length > 0) setCategoryId(res[0].id);
      });
      getPeople().then((res) => setPeople(res));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount greater than zero');
      return;
    }
    if (!bankId) {
      setError('Please select a bank account to receive money into');
      return;
    }
    const selectedCat = categories.find((c) => c.id === categoryId);
    const finalDescription =
      description.trim() ||
      (personName.trim()
        ? `Received from ${personName.trim()}`
        : selectedCat
        ? `${selectedCat.name} Income`
        : 'Money Received');

    try {
      setLoading(true);
      setError(null);
      await createTransaction({
        transaction_type: 'INCOME',
        amount: Number(amount),
        bank_account_id: Number(bankId),
        person_name: personName.trim() || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        transaction_date: transactionDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || undefined,
        description: finalDescription,
        notes: [senderBank ? `Sender Bank: ${senderBank}` : '', notes].filter(Boolean).join(' | '),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record incoming transaction');
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
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Money Received (Income)</h2>
              <p className="text-xs text-emerald-600 font-medium">Adds automatically into selected bank account</p>
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
                placeholder="10000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-base font-black text-emerald-600 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                To Bank Account *
              </label>
              <select
                value={bankId}
                onChange={(e) => setBankId(Number(e.target.value))}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                <option value="">Select Bank</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (Bal: ₹{b.current_balance.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sender Name
              </label>
              <input
                type="text"
                list="income-people-list"
                placeholder="e.g. Rahul, Employer, Amit"
                value={personName}
                onChange={(e) => {
                  setPersonName(e.target.value);
                  if (!description) {
                    setDescription(`Received ₹${amount || ''} from ${e.target.value}`);
                  }
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <datalist id="income-people-list">
                {people.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sender Bank (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. State Bank of India, Axis"
                value={senderBank}
                onChange={(e) => setSenderBank(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Income Category *
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
                placeholder="e.g. UPI/88219481/rec"
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
              placeholder="e.g. Monthly Salary or Freelance Payment"
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
              placeholder="Additional notes about this receipt..."
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Recording Income...' : 'Record Money Received'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
