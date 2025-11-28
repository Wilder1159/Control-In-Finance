import React from 'react';
import { X, Download, RefreshCw, Mail } from 'lucide-react';
import { Button } from './ui/button';

export default function Sidebar({ show, onClose, onReset, onExport, onEmail }) {
  if (!show) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform" data-testid="sidebar">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Menú</h2>
          <button
            data-testid="close-sidebar-button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <Button
            data-testid="export-excel-button"
            onClick={onExport}
            className="w-full justify-start space-x-3 h-14 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl"
            variant="ghost"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">Exportar a Excel</span>
          </Button>

          <Button
            data-testid="email-report-button"
            onClick={onEmail}
            className="w-full justify-start space-x-3 h-14 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl"
            variant="ghost"
          >
            <Mail className="w-5 h-5" />
            <span className="font-medium">Enviar Reporte por Email</span>
          </Button>

          <Button
            data-testid="reset-transactions-button"
            onClick={onReset}
            className="w-full justify-start space-x-3 h-14 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl"
            variant="ghost"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="font-medium">Reiniciar Transacciones</span>
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>Wallet App</p>
            <p className="text-xs mt-1">Gestiona tus finanzas de manera simple</p>
          </div>
        </div>
      </div>
    </>
  );
}