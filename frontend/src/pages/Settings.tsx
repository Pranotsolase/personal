import React, { useState } from 'react';
import {
  ShieldCheck,
  Database,
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  X,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTransactionsCsvUrl } from '../api/client';

export const Settings: React.FC = () => {
  const { user, seedDemoLogin, resetZero } = useAuth();
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [resetting, setResetting] = useState(false);

  const handleResetZero = async () => {
    if (!window.confirm('Reset ALL account balances, transactions, and budgets to 0? This cannot be undone.')) return;
    try {
      setResetting(true);
      await resetZero();
      setToast({ text: 'All values successfully reset to 0.00!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast({ text: 'Failed to reset values to 0', type: 'error' });
    } finally {
      setResetting(false);
    }
  };

  const handleSeedSampleData = async () => {
    if (!window.confirm('Populate realistic sample transactions and budgets for demo testing?')) return;
    try {
      setResetting(true);
      await seedDemoLogin();
      setToast({ text: 'Sample data populated successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast({ text: 'Failed to populate sample data', type: 'error' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
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

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <span className="text-xs uppercase tracking-wider font-bold text-indigo-600">
          Preferences & Controls
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal profile, currency formatting, database ledger exports, and data protection settings.
        </p>
      </div>

      {/* Profile Details */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-lg font-black text-indigo-700">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{user?.full_name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <span className="text-slate-500 block font-medium">Default Currency</span>
            <p className="text-slate-900 font-bold mt-1">Indian Rupee (₹ INR)</p>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Date Format</span>
            <p className="text-slate-900 font-bold mt-1">DD-MM-YYYY</p>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Ledger State</span>
            <p className="text-emerald-700 font-bold mt-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Active Private Ledger
            </p>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Authentication Mode</span>
            <p className="text-slate-900 font-bold mt-1">JWT Bearer + BCrypt Encryption</p>
          </div>
        </div>
      </div>

      {/* Data Controls & Ledger Management */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
          <Database className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Database & Ledger Controls</h3>
            <p className="text-xs text-slate-500">Export financial records or reset data state</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <span className="text-xs text-slate-900 font-bold block">Download Full Ledger (CSV)</span>
            <span className="text-xs text-slate-500">Complete raw transaction history with timestamps and references.</span>
          </div>

          <a
            href={getTransactionsCsvUrl()}
            download
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer self-start sm:self-auto shadow-xs active:scale-98"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            Download CSV Export
          </a>
        </div>

        {/* Reset to 0 button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div>
            <span className="text-xs text-rose-700 font-bold block">Reset All Values to 0</span>
            <span className="text-xs text-slate-500">Sets all bank balances to ₹0.00 and clears all transactions and budgets.</span>
          </div>

          <button
            onClick={handleResetZero}
            disabled={resetting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition cursor-pointer self-start sm:self-auto shadow-xs active:scale-98"
          >
            <Trash2 className="w-4 h-4" />
            {resetting ? 'Resetting...' : 'Reset All to 0'}
          </button>
        </div>

        {/* Sample data populator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-900 font-bold block">Load Realistic Sample Data</span>
            <span className="text-xs text-slate-500">Populate realistic demo transactions and budgets for analytics testing.</span>
          </div>

          <button
            onClick={handleSeedSampleData}
            disabled={resetting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition cursor-pointer self-start sm:self-auto shadow-xs active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            {resetting ? 'Loading...' : 'Populate Sample Data'}
          </button>
        </div>
      </div>

      {/* Security Principles */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-xs">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Security & Privacy Architecture</h3>
        </div>

        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <span><b className="text-slate-800">Zero credential storage:</b> The application never stores bank passwords, UPI PINs, ATM PINs, CVVs, or OTPs.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <span><b className="text-slate-800">Account Number Masking:</b> Account numbers are stored masked (e.g. •••• 4892) to prevent accidental exposure.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <span><b className="text-slate-800">Cryptographic Hash:</b> Passwords are protected using salted BCrypt hashing.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <span><b className="text-slate-800">Atomic Database Transactions:</b> All financial balance updates and reversals use database transaction boundaries to prevent balance drift.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
