import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavItem } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Banks } from './pages/Banks';
import { Transactions } from './pages/Transactions';
import { MoneySent } from './pages/MoneySent';
import { MoneyReceived } from './pages/MoneyReceived';
import { UpcomingMoney } from './pages/UpcomingMoney';
import { TransferMoney } from './pages/TransferMoney';
import { People } from './pages/People';
import { Categories } from './pages/Categories';
import { Budgets } from './pages/Budgets';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Modals
import { AddBankModal } from './components/Modals/AddBankModal';
import { MoneySentModal } from './components/Modals/MoneySentModal';
import { MoneyReceivedModal } from './components/Modals/MoneyReceivedModal';
import { TransferModal } from './components/Modals/TransferModal';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [dateFilter, setDateFilter] = useState('this_month');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Quick Modal States
  const [isAddBankOpen, setIsAddBankOpen] = useState(false);
  const [addBankInitialType, setAddBankInitialType] = useState<'BANK' | 'CASH'>('BANK');
  const [isMoneySentOpen, setIsMoneySentOpen] = useState(false);
  const [isMoneyReceivedOpen, setIsMoneyReceivedOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [preselectedBankId, setPreselectedBankId] = useState<number | undefined>(undefined);

  // Refresh trigger when any modal creates a transaction or bank
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  const handleOpenQuickModal = (type: 'sent' | 'received' | 'transfer' | 'bank' | 'cash', bankId?: number) => {
    setPreselectedBankId(bankId);
    if (type === 'sent') setIsMoneySentOpen(true);
    else if (type === 'received') setIsMoneyReceivedOpen(true);
    else if (type === 'transfer') setIsTransferOpen(true);
    else if (type === 'bank') {
      setAddBankInitialType('BANK');
      setIsAddBankOpen(true);
    } else if (type === 'cash') {
      setAddBankInitialType('CASH');
      setIsAddBankOpen(true);
    }
  };

  const getPageTitle = (tab: NavItem) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Centralized financial monitoring & analytics' };
      case 'banks':
        return { title: 'My Banks & Accounts', subtitle: 'Manage your savings, current, and cash accounts' };
      case 'transactions':
        return { title: 'Transactions Ledger', subtitle: 'Search, filter, and audit all financial activities' };
      case 'money-sent':
        return { title: 'Money Sent (Expenses)', subtitle: 'Outgoing transactions and payment records' };
      case 'money-received':
        return { title: 'Money Received (Income)', subtitle: 'Incoming revenue, earnings, and credit inflows' };
      case 'upcoming-money':
        return { title: 'Upcoming Money from Others', subtitle: 'Track receivables, pending debts, and collect payments into your bank accounts' };
      case 'transfer-money':
        return { title: 'Transfer Between Banks', subtitle: 'Internal transfers without income/expense impact' };
      case 'people':
        return { title: 'People & Contacts', subtitle: 'Track payees, payers, and net settlements' };
      case 'categories':
        return { title: 'Categories', subtitle: 'Organize income streams and expenditure buckets' };
      case 'budgets':
        return { title: 'Budget Management', subtitle: 'Monthly targets, actuals, and threshold warnings' };
      case 'analytics':
        return { title: 'Financial Analytics & Reports', subtitle: 'Visual charts and deep-dive expense reports' };
      case 'settings':
        return { title: 'Settings & Security', subtitle: 'Preferences, profile, and ledger exports' };
    }
  };

  const { title, subtitle } = getPageTitle(currentTab);

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 w-full max-w-full overflow-x-hidden relative">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        onOpenQuickModal={handleOpenQuickModal}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
        <Header
          title={title}
          subtitle={subtitle}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          onOpenQuickModal={handleOpenQuickModal}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        <main key={refreshKey} className="flex-1 pb-16 overflow-y-auto overflow-x-hidden w-full max-w-full">
          {currentTab === 'dashboard' && (
            <Dashboard
              dateFilter={dateFilter}
              onOpenQuickModal={handleOpenQuickModal}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'banks' && (
            <Banks
              onOpenAddBank={(type) => {
                setAddBankInitialType(type || 'BANK');
                setIsAddBankOpen(true);
              }}
              onOpenTransfer={(bankId) => handleOpenQuickModal('transfer', bankId)}
            />
          )}

          {currentTab === 'transactions' && (
            <Transactions onOpenQuickModal={handleOpenQuickModal} />
          )}

          {currentTab === 'money-sent' && (
            <MoneySent onOpenQuickModal={() => setIsMoneySentOpen(true)} />
          )}

          {currentTab === 'money-received' && (
            <MoneyReceived onOpenQuickModal={() => setIsMoneyReceivedOpen(true)} />
          )}

          {currentTab === 'upcoming-money' && (
            <UpcomingMoney onOpenQuickModal={handleOpenQuickModal} />
          )}

          {currentTab === 'transfer-money' && (
            <TransferMoney onOpenQuickModal={() => setIsTransferOpen(true)} />
          )}

          {currentTab === 'people' && <People />}

          {currentTab === 'categories' && <Categories />}

          {currentTab === 'budgets' && <Budgets />}

          {currentTab === 'analytics' && <Analytics />}

          {currentTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Modals */}
      <AddBankModal
        isOpen={isAddBankOpen}
        onClose={() => setIsAddBankOpen(false)}
        onSuccess={triggerRefresh}
        initialType={addBankInitialType}
      />

      <MoneySentModal
        isOpen={isMoneySentOpen}
        onClose={() => setIsMoneySentOpen(false)}
        onSuccess={triggerRefresh}
        preselectedBankId={preselectedBankId}
      />

      <MoneyReceivedModal
        isOpen={isMoneyReceivedOpen}
        onClose={() => setIsMoneyReceivedOpen(false)}
        onSuccess={triggerRefresh}
        preselectedBankId={preselectedBankId}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onSuccess={triggerRefresh}
        preselectedFromId={preselectedBankId}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
