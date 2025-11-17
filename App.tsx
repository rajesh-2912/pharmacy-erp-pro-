import React, { useState } from 'react';
import { InventoryProvider } from './context/InventoryContext';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import AIAssistant from './components/AIAssistant';
import Reports from './components/Reports';
import { LayoutDashboard, Pill, ShoppingCart, Bot, PackagePlus, FileDown } from 'lucide-react';

type Page = 'dashboard' | 'inventory' | 'sales' | 'ai-assistant' | 'reports';

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'bg-primary-500 text-white rounded-lg shadow-md'
        : 'text-slate-500 hover:bg-primary-100 hover:text-primary-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white rounded-lg'
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    <span className="truncate">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'sales':
        return <Sales />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <InventoryProvider>
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col p-4">
          <div className="flex items-center justify-center mb-8">
            <PackagePlus className="w-10 h-10 text-primary-500" />
            <h1 className="ml-2 text-2xl font-bold text-primary-600 dark:text-primary-400">ERP Pro</h1>
          </div>
          <nav className="flex-grow space-y-2">
            <NavItem icon={LayoutDashboard} label="Dashboard" isActive={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
            <NavItem icon={Pill} label="Inventory" isActive={currentPage === 'inventory'} onClick={() => setCurrentPage('inventory')} />
            <NavItem icon={ShoppingCart} label="Sales" isActive={currentPage === 'sales'} onClick={() => setCurrentPage('sales')} />
            <NavItem icon={Bot} label="AI Assistant" isActive={currentPage === 'ai-assistant'} onClick={() => setCurrentPage('ai-assistant')} />
            <NavItem icon={FileDown} label="Reports" isActive={currentPage === 'reports'} onClick={() => setCurrentPage('reports')} />
          </nav>
          <div className="text-center text-xs text-slate-400 mt-4">
            <p>&copy; 2024 Pharmacy ERP Pro</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </InventoryProvider>
  );
};

export default App;