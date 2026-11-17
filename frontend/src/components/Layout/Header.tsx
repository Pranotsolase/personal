import React from 'react';
import {
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Menu
} from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  dateFilter: string;
  onDateFilterChange: (filter: string) => void;
  startDate?: string;
  endDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  onOpenQuickModal: (type: 'sent' | 'received' | 'transfer' | 'bank') => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  dateFilter,
  onDateFilterChange,
  onOpenQuickModal,
  onToggleMobileMenu,
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 shadow-xs w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer shrink-0"
          title="Toggle Navigation Menu"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full max-w-full md:w-auto scrollbar-none">
        {/* Global Date Filter */}
        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs shrink-0">
          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
          <select
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="bg-transparent text-slate-700 border-none outline-none pr-2 py-0.5 cursor-pointer font-semibold text-xs"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => onOpenQuickModal('bank')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer shadow-xs whitespace-nowrap active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">+</span> Bank
          </button>

          <button
            onClick={() => onOpenQuickModal('sent')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-rose-600/20 whitespace-nowrap active:scale-98"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Sent</span>
          </button>

          <button
            onClick={() => onOpenQuickModal('received')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-emerald-600/20 whitespace-nowrap active:scale-98"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Received</span>
          </button>

          <button
            onClick={() => onOpenQuickModal('transfer')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-indigo-600/20 whitespace-nowrap active:scale-98"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>
        </div>
      </div>
    </header>
  );
};
