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
  ArrowUpRight,
  ChevronRight,
  Filter,
  SendHorizontal
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
  const [activeTab, setActiveTab] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');
  const [dues, setDues] = useState<UpcomingDue[]>([]);
  const [summary, setSummary] = useState<UpcomingDueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'SETTLED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [settlingDue, setSettlingDue] = useState<UpcomingDue | null>(null);

  const isPayable = activeTab === 'PAYABLE';

  const loadData = async () => {
    try {
      setLoading(true);
      // Map 'SETTLED' to backend expected status: 'PAID' if payable, 'RECEIVED' if receivable
      let backendStatus: string | undefined = undefined;
      if (statusFilter === 'PENDING') {
        backendStatus = 'PENDING';
      } else if (statusFilter === 'SETTLED') {
        backendStatus = isPayable ? 'PAID' : 'RECEIVED';
      }

      const [duesRes, sumRes] = await Promise.all([
        getUpcomingDues({
          due_type: activeTab,
          status: backendStatus,
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
  }, [activeTab, statusFilter, searchQuery]);

  const handleDelete = async (id: number) => {
    const confirmMsg = isPayable
      ? 'Are you sure you want to delete this pending transfer record?'
      : 'Are you sure you want to delete this expected money record?';
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteUpcomingDue(id);
      loadData();
    } catch (e) {
      console.error('Failed to delete upcoming due', e);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Primary Category Switcher: Money to Receive vs Pending Transfers */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl flex-1 sm:max-w-xl">
          <button
            onClick={() => {
              setActiveTab('RECEIVABLE');
              setStatusFilter('PENDING');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              !isPayable
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-amber-600" />
            <span className="truncate">Money to Receive (Others Owe Me)</span>
            {summary && summary.total_pending_count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 ml-1">
                {summary.total_pending_count}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('PAYABLE');
              setStatusFilter('PENDING');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              isPayable
                ? 'bg-white text-rose-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
            <span className="truncate">Pending Transfers (I Owe Others)</span>
            {summary && (summary.total_payable_count || 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 ml-1">
                {summary.total_payable_count}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0 ${
            isPayable ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'
          }`}
        >
          <Plus className="w-4 h-4" />
          {isPayable ? '+ Record Pending Transfer' : '+ Record Expected Money'}
        </button>
      </div>

      {/* Header Info Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isPayable
          ? 'bg-rose-50/40 border-rose-100'
          : 'bg-amber-50/40 border-amber-100'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl shadow-xs border ${
            isPayable
              ? 'bg-rose-50 text-rose-600 border-rose-200'
              : 'bg-amber-50 text-amber-600 border-amber-200'
          }`}>
            {isPayable ? <SendHorizontal className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isPayable ? 'Pending Transfers to Others' : 'Upcoming Money from Others'}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {isPayable
                ? 'Track pending payments you owe friends, landlords, or merchants and settle them safely with one click'
                : 'Track money that friends, clients, or colleagues owe you and collect directly into your bank account'}
            </p>
          </div>
        </div>
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pending Amount */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isPayable ? 'Total Pending to Transfer' : 'Total Pending to Collect'}
            </span>
            <div className={`p-2 rounded-xl ${isPayable ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
              {isPayable ? <ArrowUpRight className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
          </div>
          <div className={`mt-2 text-2xl font-black ${isPayable ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatCurrency(isPayable ? summary?.total_payable_amount || 0 : summary?.total_pending_amount || 0)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {isPayable
              ? `${summary?.total_payable_count || 0} pending payment${(summary?.total_payable_count || 0) === 1 ? '' : 's'}`
              : `${summary?.total_pending_count || 0} pending payment${(summary?.total_pending_count || 0) === 1 ? '' : 's'}`}
          </span>
        </div>

        {/* People Count */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isPayable ? 'People You Owe Money' : 'People Owing You Money'}
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {isPayable ? summary?.total_payable_count || 0 : summary?.total_pending_count || 0}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {isPayable ? 'Contacts waiting for payment' : 'Contacts to collect from'}
          </span>
        </div>

        {/* Settled / Deposited / Deducted */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isPayable ? 'Paid & Deducted from Bank' : 'Received & Deposited in Bank'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {formatCurrency(
              isPayable ? summary?.paid_this_month_amount || 0 : summary?.received_this_month_amount || 0
            )}
          </div>
          <span className="text-xs text-emerald-600/80 font-medium mt-1 block">
            {isPayable
              ? `${summary?.paid_this_month_count || 0} settled payment${(summary?.paid_this_month_count || 0) === 1 ? '' : 's'}`
              : `${summary?.received_this_month_count || 0} settled payment${(summary?.received_this_month_count || 0) === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'PENDING', label: isPayable ? 'Pending Transfers' : 'Pending Money' },
            { id: 'SETTLED', label: isPayable ? 'Paid & Transferred' : 'Received & Deposited' },
            { id: 'ALL', label: 'All Records' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? isPayable
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-indigo-600 text-white shadow-xs'
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
            placeholder={isPayable ? 'Search person or reason...' : 'Search person or reason...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Records List */}
      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" />
        </div>
      ) : dues.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
            isPayable ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
          }`}>
            {isPayable ? <SendHorizontal className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
          </div>
          <h3 className="font-bold text-slate-900 text-sm">
            {isPayable ? 'No Pending Transfers Found' : 'No Expected Money Records Found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {statusFilter === 'PENDING'
              ? isPayable
                ? 'You have no pending money to transfer to anyone right now. Click "+ Record Pending Transfer" when you owe someone money.'
                : 'You have no pending dues to collect. Click "+ Record Expected Money" whenever someone owes you money.'
              : 'No records matching your selected filter.'}
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className={`mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition cursor-pointer shadow-xs ${
              isPayable ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            <Plus className="w-4 h-4" />
            {isPayable ? '+ Record Pending Transfer' : '+ Add Expected Money'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dues.map((due) => {
            const isSettled = due.status === 'RECEIVED' || due.status === 'PAID';
            const isOverdue = due.is_overdue;
            const dueIsPayable = due.due_type === 'PAYABLE';

            return (
              <div
                key={due.id}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 shadow-xs flex flex-col justify-between ${
                  isOverdue
                    ? 'border-rose-300 ring-1 ring-rose-300/40'
                    : isSettled
                    ? 'border-emerald-200/80 bg-emerald-50/20'
                    : dueIsPayable
                    ? 'border-rose-100 hover:border-rose-200'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Header: Person & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-xl text-white font-extrabold flex items-center justify-center shadow-xs text-sm ${
                          dueIsPayable
                            ? 'bg-gradient-to-tr from-rose-500 to-rose-400'
                            : 'bg-gradient-to-tr from-amber-500 to-amber-400'
                        }`}
                      >
                        {due.person_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">
                          {due.person_name}
                        </h4>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          {isSettled
                            ? dueIsPayable
                              ? 'Payment Completed'
                              : 'Payment Collected'
                            : dueIsPayable
                            ? 'Pending Transfer'
                            : 'Pending Payment'}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        isSettled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : dueIsPayable
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isSettled
                        ? dueIsPayable
                          ? '✓ Paid from Bank'
                          : '✓ Deposited'
                        : dueIsPayable
                        ? '📤 To Pay'
                        : '🕒 Pending'}
                    </span>
                  </div>

                  {/* Amount Expected / To Pay */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {isSettled
                          ? dueIsPayable
                            ? 'Amount Paid'
                            : 'Amount Received'
                          : dueIsPayable
                          ? 'Pending to Pay'
                          : 'Pending Amount'}
                      </span>
                      <span
                        className={`text-xl font-black ${
                          isSettled
                            ? 'text-emerald-600'
                            : dueIsPayable
                            ? 'text-rose-600'
                            : isOverdue
                            ? 'text-rose-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {formatCurrency(isSettled ? due.amount : due.remaining_amount)}
                      </span>
                      {due.amount_received > 0 && !isSettled && (
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

                  {/* Settled Details */}
                  {isSettled && (
                    <div className="mt-3 p-2 bg-emerald-50/80 rounded-xl border border-emerald-100 text-[11px] text-emerald-700 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {dueIsPayable
                          ? `Deducted from ${due.settled_bank_name || 'Bank'}`
                          : `Deposited to ${due.settled_bank_name || 'Bank'}`}
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
                  {!isSettled ? (
                    <button
                      onClick={() => setSettlingDue(due)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98 ${
                        dueIsPayable
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {dueIsPayable ? (
                        <>
                          <ArrowUpRight className="w-4 h-4" />
                          Transfer / Pay Money (Deduct from Bank)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Receive Money (Store in Bank)
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {dueIsPayable ? 'Paid & Completed' : 'Stored in Bank'}
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
        initialDueType={activeTab}
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
