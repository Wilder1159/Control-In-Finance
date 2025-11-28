import React from 'react';
import { Trash2, Calendar } from 'lucide-react';
import { Button } from './ui/button';

const CATEGORY_ICONS = {
  'Comida': '🍔',
  'Transporte': '🚗',
  'Entretenimiento': '🎬',
  'Salud': '⚕️',
  'Salario': '💰',
  'Inversiones': '📈',
  'Otros': '📦'
};

export default function TransactionList({ transactions, onDelete, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="text-gray-400">Cargando transacciones...</div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center" data-testid="empty-transactions">
        <div className="text-gray-400 text-lg">No hay transacciones aún</div>
        <p className="text-gray-400 text-sm mt-2">Agrega tu primera transacción usando el botón +</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100" data-testid="transactions-list">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Transacciones Recientes</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {transactions.map((tx) => (
          <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors" data-testid={`transaction-${tx.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                  {CATEGORY_ICONS[tx.category] || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-800">{tx.category}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{tx.description}</p>
                  <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{tx.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`text-xl font-bold ${
                  tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                </div>
                <Button
                  data-testid={`delete-transaction-${tx.id}`}
                  onClick={() => onDelete(tx.id)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}