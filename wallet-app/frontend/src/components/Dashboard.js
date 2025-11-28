import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Plus, Menu, X, Download, RefreshCw, Mail, LogOut, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import TransactionModal from './TransactionModal';
import TransactionList from './TransactionList';
import Sidebar from './Sidebar';

export default function Dashboard({ user, token, onLogout, API }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [showModal, setShowModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions`, axiosConfig);
      setTransactions(response.data);
    } catch (error) {
      toast.error('Error al cargar transacciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/transactions/summary`, axiosConfig);
      setSummary(response.data);
    } catch (error) {
      console.error('Error al cargar resumen');
    }
  };

  const handleAddTransaction = async (transaction) => {
    try {
      await axios.post(`${API}/transactions`, transaction, axiosConfig);
      toast.success('Transacción agregada');
      fetchTransactions();
      fetchSummary();
      setShowModal(false);
    } catch (error) {
      toast.error('Error al agregar transacción');
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await axios.delete(`${API}/transactions/${id}`, axiosConfig);
      toast.success('Transacción eliminada');
      fetchTransactions();
      fetchSummary();
    } catch (error) {
      toast.error('Error al eliminar transacción');
    }
  };

  const handleResetTransactions = async () => {
    if (window.confirm('¿Estás seguro de eliminar todas las transacciones?')) {
      try {
        await axios.delete(`${API}/transactions/reset/all`, axiosConfig);
        toast.success('Todas las transacciones eliminadas');
        fetchTransactions();
        fetchSummary();
        setShowSidebar(false);
      } catch (error) {
        toast.error('Error al reiniciar transacciones');
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await axios.get(`${API}/transactions/export`, {
        ...axiosConfig,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transacciones.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel descargado');
      setShowSidebar(false);
    } catch (error) {
      toast.error('Error al exportar');
    }
  };

  const handleEmailReport = async () => {
    try {
      await axios.post(`${API}/transactions/email-report`, 
        { email: user.email }, 
        axiosConfig
      );
      toast.success('Reporte enviado a tu email');
      setShowSidebar(false);
    } catch (error) {
      toast.error('Error al enviar el reporte');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40" style={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.95)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              data-testid="sidebar-toggle-button"
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Wallet</h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
            <Button
              data-testid="logout-button"
              onClick={onLogout}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        show={showSidebar}
        onClose={() => setShowSidebar(false)}
        onReset={handleResetTransactions}
        onExport={handleExportExcel}
        onEmail={handleEmailReport}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100" data-testid="balance-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm font-medium">Balance Total</span>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              ${summary.balance.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100" data-testid="income-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm font-medium">Ingresos</span>
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-600">
              ${summary.total_income.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100" data-testid="expense-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm font-medium">Gastos</span>
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-red-600">
              ${summary.total_expense.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <TransactionList 
          transactions={transactions}
          onDelete={handleDeleteTransaction}
          loading={loading}
        />
      </main>

      {/* Floating Add Button */}
      <button
        data-testid="add-transaction-button"
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
        style={{ boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)' }}
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Transaction Modal */}
      <TransactionModal 
        show={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddTransaction}
      />
    </div>
  );
}