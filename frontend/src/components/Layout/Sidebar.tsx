import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Users,
  Tags,
  PieChart,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Wallet,
  ShieldCheck,
  Clock,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavItem =
  | 'dashboard'
  | 'banks'
  | 'transactions'
  | 'money-sent'
  | 'money-received'
  | 'upcoming-money'
  | 'transfer-money'
  | 'people'
  | 'categories'
  | 'budgets'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  onOpenQuickModal: (type: 'sent' | 'received' | 'transfer' | 'bank') => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickModal,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { id: 'banks', name: 'My Banks', icon: Building2 },
        { id: 'transactions', name: 'Transactions', icon: Receipt },
      ]
    },
    {
      title: 'TRANSFERS & MONEY',
      items: [
        { id: 'money-sent', name: 'Money Sent', icon: ArrowUpRight, badge: 'Out' },
        { id: 'money-received', name: 'Money Received', icon: ArrowDownLeft, badge: 'In' },
        { id: 'upcoming-money', name: 'Upcoming Money', icon: Clock, badge: 'Due' },
        { id: 'transfer-money', name: 'Transfer Money', icon: ArrowLeftRight },
      ]
    },
    {
      title: 'MANAGEMENT & REPORTS',
      items: [
        { id: 'people', name: 'People & Contacts', icon: Users },
        { id: 'categories', name: 'Categories', icon: Tags },
        { id: 'budgets', name: 'Budget Management', icon: PieChart },
        { id: 'analytics', name: 'Analytics & Reports', icon: BarChart3 },
        { id: 'settings', name: 'Settings', icon: SettingsIcon },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
        />
      )}

      {/* Responsive Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col h-screen select-none shadow-xl transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:max-w-none lg:shadow-sm lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none lg:pointer-events-auto'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 block">FinTrack</span>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Personal Finance
              </span>
            </div>
          </div>

          {/* Close drawer button for mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="p-4 space-y-2 border-b border-slate-100 bg-slate-50/70">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenQuickModal('sent');
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 text-rose-700 text-xs font-bold transition cursor-pointer shadow-xs active:scale-98"
            >
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              + Sent
            </button>
            <button
              onClick={() => {
                onOpenQuickModal('received');
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-700 text-xs font-bold transition cursor-pointer shadow-xs active:scale-98"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              + Received
            </button>
          </div>
          <button
            onClick={() => {
              onOpenQuickModal('transfer');
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 text-indigo-700 text-xs font-semibold transition cursor-pointer shadow-xs active:scale-98"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
            Transfer Between Banks
          </button>
        </div>

        {/* Nav List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id as NavItem);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${
                          item.badge === 'In'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.badge === 'Due'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User profile & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80">
          <div className="flex items-center justify-between px-2 py-2 rounded-xl">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
