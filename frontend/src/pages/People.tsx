import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { getPeople, createPerson, updatePerson, deletePerson, getPersonTransactions } from '../api/client';
import { Person, Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

export const People: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Selected person detail modal
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [personTxns, setPersonTxns] = useState<Transaction[]>([]);
  const [txnsLoading, setTxnsLoading] = useState(false);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const res = await getPeople(search.trim() || undefined);
      setPeople(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingPerson(null);
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Person) => {
    setEditingPerson(p);
    setName(p.name);
    setPhone(p.phone || '');
    setEmail(p.email || '');
    setNotes(p.notes || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter contact name');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      if (editingPerson) {
        await updatePerson(editingPerson.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        setToast({ text: 'Contact updated successfully!', type: 'success' });
      } else {
        await createPerson({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        setToast({ text: 'New contact added successfully!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchPeople();
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save contact');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, pName: string) => {
    if (!window.confirm(`Delete contact "${pName}"? Transactions associated will be preserved.`)) return;
    try {
      await deletePerson(id);
      setToast({ text: `Contact "${pName}" deleted`, type: 'success' });
      fetchPeople();
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ text: 'Failed to delete contact', type: 'error' });
    }
  };

  const handleViewPersonDetail = async (p: Person) => {
    setSelectedPerson(p);
    try {
      setTxnsLoading(true);
      const res = await getPersonTransactions(p.id);
      setPersonTxns(res.transactions);
      setSelectedPerson(res.person);
    } catch (e) {
      console.error(e);
    } finally {
      setTxnsLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span className="font-semibold">{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-indigo-600">
            Contacts & Settlements
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
            People & Contacts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track who sends you money, whom you send money to, and calculate net sent/received outstanding amounts.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer active:scale-98 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Add Person
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search people by name, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
        />
      </div>

      {/* People Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading contacts...</div>
      ) : people.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No contacts found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Add friends, colleagues, vendors, or institutions to track money exchanges.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            + Add First Person
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {people.map((p) => {
            const netSent = (p.total_sent || 0) - (p.total_received || 0);
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-5 shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-sm font-black text-indigo-700 shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">{p.name}</h3>
                        {p.phone && (
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" /> {p.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sent vs Received stats */}
                  <div className="mt-4 grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3 text-rose-500" /> Total Sent
                      </span>
                      <p className="text-xs font-black text-rose-600 mt-0.5">
                        {formatCurrency(p.total_sent)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <ArrowDownLeft className="w-3 h-3 text-emerald-500" /> Total Received
                      </span>
                      <p className="text-xs font-black text-emerald-600 mt-0.5">
                        {formatCurrency(p.total_received)}
                      </p>
                    </div>
                  </div>

                  {/* Net status */}
                  <div className="mt-3 flex items-center justify-between text-xs px-1">
                    <span className="text-slate-500 font-medium">Net Position:</span>
                    <span
                      className={`font-black ${
                        netSent > 0 ? 'text-amber-600' : netSent < 0 ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      {netSent > 0
                        ? `You Sent ₹${netSent.toLocaleString('en-IN')} more`
                        : netSent < 0
                        ? `Received ₹${Math.abs(netSent).toLocaleString('en-IN')} more`
                        : 'Settled (₹0.00)'}
                    </span>
                  </div>

                  {p.notes && (
                    <p className="mt-2 text-[11px] text-slate-500 italic line-clamp-2 px-1">
                      "{p.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleViewPersonDetail(p)}
                    className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                  >
                    <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                    View History ({p.transactions_count || 0})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingPerson ? 'Edit Contact' : 'Add New Person / Contact'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  placeholder="e.g. Roommate, split rent and utility bills"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Person Transaction History Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">{selectedPerson.name}</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs mt-1 font-semibold">
                  <span className="text-rose-600">Sent: {formatCurrency(selectedPerson.total_sent)}</span>
                  <span className="text-emerald-600">Received: {formatCurrency(selectedPerson.total_received)}</span>
                  <span className="text-amber-600">Net: {formatCurrency(selectedPerson.net_sent)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPerson(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-2">
              {txnsLoading ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading transactions...</div>
              ) : personTxns.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  <span className="font-semibold text-slate-600 block mb-1">No transactions</span>
                  No transactions recorded with {selectedPerson.name} yet.
                </div>
              ) : (
                personTxns.map((t) => {
                  const isExpense = t.transaction_type === 'EXPENSE';
                  return (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{t.description}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {formatDate(t.transaction_date)} • {t.bank_account_name} • {t.payment_method}
                          {t.category_name && ` • ${t.category_name}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isExpense ? '-' : '+'}
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
                onClick={() => setSelectedPerson(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
