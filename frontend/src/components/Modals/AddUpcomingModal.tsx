import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { createUpcomingDue, getCategories, getPeople } from '../../api/client';
import { Category, Person } from '../../types';

interface AddUpcomingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDueType?: 'RECEIVABLE' | 'PAYABLE';
}

export const AddUpcomingModal: React.FC<AddUpcomingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDueType = 'RECEIVABLE',
}) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dueType, setDueType] = useState<'RECEIVABLE' | 'PAYABLE'>(initialDueType);

  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDueType(initialDueType);
      getPeople().then((res) => setPeople(res));
      setError(null);
    }
  }, [isOpen, initialDueType]);

  useEffect(() => {
    if (isOpen) {
      const catType = dueType === 'PAYABLE' ? 'EXPENSE' : 'INCOME';
      getCategories(catType).then((res) => {
        setCategories(res);
        const defaultCat = res.find(
          (c) => c.name === 'Borrowed Money' || c.name === 'Other' || c.name === 'Bills' || c.name === 'Personal'
        );
        if (defaultCat) {
          setCategoryId(defaultCat.id);
        } else if (res.length > 0) {
          setCategoryId(res[0].id);
        } else {
          setCategoryId('');
        }
      });
    }
  }, [isOpen, dueType]);

  if (!isOpen) return null;

  const isPayable = dueType === 'PAYABLE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) {
      setError(
        isPayable
          ? 'Please enter the name of the person you need to pay'
          : 'Please enter the name of the person who owes money'
      );
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount greater than zero');
      return;
    }

    const matchedPerson = people.find(
      (p) => p.name.trim().toLowerCase() === personName.trim().toLowerCase()
    );

    const finalDescription =
      description.trim() ||
      (isPayable
        ? `Pending transfer to ${personName.trim()}`
        : `Money to receive from ${personName.trim()}`);

    try {
      setLoading(true);
      setError(null);
      await createUpcomingDue({
        person_name: personName.trim(),
        person_id: matchedPerson ? matchedPerson.id : undefined,
        amount: Number(amount),
        description: finalDescription,
        category_id: categoryId ? Number(categoryId) : undefined,
        due_type: dueType,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record upcoming transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between ${
          isPayable ? 'bg-rose-50/60' : 'bg-amber-50/60'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              isPayable
                ? 'bg-rose-100 text-rose-600 border-rose-200'
                : 'bg-amber-100 text-amber-600 border-amber-200'
            }`}>
              {isPayable ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isPayable ? 'Record Pending Transfer' : 'Record Expected Money'}
              </h3>
              <p className="text-xs text-slate-500">
                {isPayable
                  ? 'Track pending money you need to transfer or pay to someone'
                  : 'Track pending money someone owes you'}
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

        {/* Due Type Toggle Tabs */}
        <div className="px-6 pt-4 pb-1">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setDueType('RECEIVABLE')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                dueType === 'RECEIVABLE'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Money to Receive (Owed to Me)</span>
            </button>
            <button
              type="button"
              onClick={() => setDueType('PAYABLE')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                dueType === 'PAYABLE'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pending Transfer (I Owe Others)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Person Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isPayable ? 'Who Do You Need to Pay / Transfer To? *' : 'Who Owes You Money? *'}
            </label>
            <input
              type="text"
              list="people-list"
              placeholder={isPayable ? 'e.g. Rahul, Landlord, Roommate' : 'e.g. Rahul, Amit, Client A'}
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <datalist id="people-list">
              {people.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
            <p className="text-[11px] text-slate-400 mt-1">
              Select an existing contact or type a new name
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Reason / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Description (Optional)
            </label>
            <input
              type="text"
              placeholder={
                isPayable
                  ? 'e.g. Monthly rent, Split bill repayment, borrowed cash'
                  : 'e.g. Dinner bill split, trip travel loan, freelance milestone'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category (Optional)
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Any additional details or context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
            />
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
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 ${
                isPayable
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {isPayable ? <ArrowUpRight className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              {loading
                ? 'Saving...'
                : isPayable
                ? 'Save Pending Transfer'
                : 'Save Expected Money'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
