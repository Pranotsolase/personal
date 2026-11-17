import React, { useEffect, useState } from 'react';
import {
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  Trash2,
  ArrowDownLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { getUpcomingDues, getUpcomingSummary, deleteUpcomingDue } from '../api/client';
import { UpcomingDue, UpcomingDueSummary } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { AddUpcomingModal } from '../components/Modals/AddUpcomingModal';
import { SettleUpcomingModal } from '../components/Modals/SettleUpcomingModal';

interface UpcomingMoneyProps {
  onOpenQuickModal: (type: 'sent' | 'received' | 'transfer' | 'bank') => void;
}

export const UpcomingMoney: React.FC<UpcomingMoneyProps> = () => {
  const [dues, setDues] = useState<UpcomingDue[]>([]);
  const [summary, setSummary] = useState<UpcomingDueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'RECEIVED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [settlingDue, setSettlingDue] = useState<UpcomingDue | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [duesRes, sumRes] = await Promise.all([
        getUpcomingDues({
          status: statusFilter === 'OVERDUE' ? 'PENDING' : statusFilter,
          is_overdue: statusFilter === 'OVERDUE' ? true : undefined,
          search: searchQuery.trim() || undefined,
        }),
        getUpcomingSummary(),
      ]);
      setDues(duesRes);
      setSummary(sumRes);
    } catch (e) {
      console.error('Failed to load upcoming money data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, searchQuery]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this expected money record?')) return;
    try {
      await deleteUpcomingDue(id);
      loadData();
    } catch (e) {
      console.error('Failed to delete upcoming due', e);
    }
  };

  const getDaysDiffText = (dateStr: string, isReceived: boolean) => {
    if (isReceived) return 'Settled';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    } else if (diffDays === 0) {
      return 'Due Today';
    } else if (diffDays === 1) {
      return 'Due Tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shadow-xs">
              <Clock className="w-6 h-6" />
            </span>
            Upcoming Money from Others
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track money that friends, clients, or colleagues owe you and collect directly into your bank account
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Add Expected Money
        </button>
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pending */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Money to Collect</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {formatCurrency(summary?.total_pending_amount || 0)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {summary?.total_pending_count || 0} pending payment{(summary?.total_pending_count || 0) === 1 ? '' : 's'}
          </span>
        </div>

        {/* People Owing */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">People Owing Money</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {summary?.total_pending_count || 0}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Contacts to collect from
          </span>
        </div>

        {/* Received and Stored in Bank */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Received & Deposited in Bank</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {formatCurrency(summary?.received_this_month_amount || 0)}
          </div>
          <span className="text-xs text-emerald-600/80 font-medium mt-1 block">
            {summary?.received_this_month_count || 0} settled payment{(summary?.received_this_month_count || 0) === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'PENDING', label: 'Pending Money' },
            { id: 'RECEIVED', label: 'Received & Deposited' },
            { id: 'ALL', label: 'All Records' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search person or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Upcoming Dues List */}
      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" />
        </div>
      ) : dues.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">No Expected Money Records Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {statusFilter === 'PENDING'
              ? 'You have no pending dues to collect. Click "+ Add Expected Money" whenever someone owes you money.'
              : statusFilter === 'OVERDUE'
              ? 'Awesome! You have zero overdue collections.'
              : 'No records matching your selected filter.'}
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            + Add Expected Money
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dues.map((due) => {
            const isReceived = due.status === 'RECEIVED';
            const isOverdue = due.is_overdue;

            return (
              <div
                key={due.id}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 shadow-xs flex flex-col justify-between ${
                  isOverdue
                    ? 'border-rose-300 ring-1 ring-rose-300/40'
                    : isReceived
                    ? 'border-emerald-200/80 bg-emerald-50/20'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Header: Person & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white font-extrabold flex items-center justify-center shadow-xs text-sm">
                        {due.person_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">
                          {due.person_name}
                        </h4>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          {isReceived ? 'Payment Collected' : 'Pending Payment'}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        isReceived
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isReceived ? '✓ Deposited' : '🕒 Pending'}
                    </span>
                  </div>

                  {/* Amount Expected */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {isReceived ? 'Amount Received' : 'Pending Amount'}
                      </span>
                      <span
                        className={`text-xl font-black ${
                          isReceived
                            ? 'text-emerald-600'
                            : isOverdue
                            ? 'text-rose-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {formatCurrency(isReceived ? due.amount : due.remaining_amount)}
                      </span>
                      {due.amount_received > 0 && !isReceived && (
                        <span className="text-[11px] text-slate-400 block">
                          (Total ₹{due.amount.toLocaleString('en-IN')})
                        </span>
                      )}
                    </div>

                    {due.category_name && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                        {due.category_name}
                      </span>
                    )}
                  </div>

                  {/* Description / Reason */}
                  <p className="mt-2.5 text-xs text-slate-600 line-clamp-2 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                    {due.description}
                  </p>

                  {/* Notes if any */}
                  {due.notes && (
                    <p className="mt-1 text-[11px] text-slate-400 italic">
                      "{due.notes}"
                    </p>
                  )}

                  {/* Settled Details if received */}
                  {isReceived && (
                    <div className="mt-3 p-2 bg-emerald-50/80 rounded-xl border border-emerald-100 text-[11px] text-emerald-700 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Deposited to {due.settled_bank_name || 'Bank'}
                      </span>
                      {due.received_date && (
                        <span className="text-[10px] text-emerald-600">
                          {formatDate(due.received_date)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!isReceived ? (
                    <button
                      onClick={() => setSettlingDue(due)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Receive Money (Store in Bank)
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 py-1">
                      <CheckCircle2 className="w-4 h-4" /> Stored in Bank
                    </span>
                  )}

                  <button
                    onClick={() => handleDelete(due.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete record from database"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Upcoming Due Modal */}
      <AddUpcomingModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadData}
      />

      {/* Settle Due Modal */}
      <SettleUpcomingModal
        isOpen={!!settlingDue}
        onClose={() => setSettlingDue(null)}
        onSuccess={loadData}
        due={settlingDue}
      />
    </div>
  );
};
