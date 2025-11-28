import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X } from 'lucide-react';

const CATEGORIES = [
  'Comida',
  'Transporte',
  'Entretenimiento',
  'Salud',
  'Salario',
  'Inversiones',
  'Otros'
];

export default function TransactionModal({ show, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()} data-testid="transaction-modal">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Nueva Transacción</h2>
          <button
            data-testid="close-modal-button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Tipo</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                data-testid="type-income-button"
                type="button"
                onClick={() => setFormData({ ...formData, type: 'income' })}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  formData.type === 'income'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ingreso
              </button>
              <button
                data-testid="type-expense-button"
                type="button"
                onClick={() => setFormData({ ...formData, type: 'expense' })}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  formData.type === 'expense'
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Gasto
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-gray-700 font-medium">Monto (USD)</Label>
            <Input
              id="amount"
              data-testid="amount-input"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="h-12 border-gray-200 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-gray-700 font-medium">Categoría</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
              <SelectTrigger data-testid="category-select" className="h-12 border-gray-200 rounded-xl">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700 font-medium">Descripción</Label>
            <Textarea
              id="description"
              data-testid="description-input"
              placeholder="Detalles de la transacción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="border-gray-200 rounded-xl resize-none"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-gray-700 font-medium">Fecha</Label>
            <Input
              id="date"
              data-testid="date-input"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="h-12 border-gray-200 rounded-xl"
              required
            />
          </div>

          <Button
            data-testid="submit-transaction-button"
            type="submit"
            className="w-full h-12 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Agregar Transacción
          </Button>
        </form>
      </div>
    </div>
  );
}