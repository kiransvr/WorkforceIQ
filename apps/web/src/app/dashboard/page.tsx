'use client';

import React from 'react';
import StatCard from '@/components/StatCard';

export default function PayrollPage() {
  // Formatter function to convert raw numbers to clean ETB text strings
  const formatETB = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      currencyDisplay: 'code'
    }).format(amount);
  };

  // Mock results from processing a single employee via your engine
  const activeRun = {
    employeeName: "Abebe Kebede",
    basicSalary: 25000,
    taxDeduction: 7250,
    netPay: 16000
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Execute Payroll Run</h1>
        <p className="text-xs text-slate-500">Calculate active worker pay stubs</p>
      </div>

      {/* Using your exact StatCard component to show a single worker's breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          label={`Basic Salary (${activeRun.employeeName})`} 
          value={formatETB(activeRun.basicSalary)} 
          icon="wallet" 
        />
        <StatCard 
          label="Income Tax Withheld" 
          value={formatETB(activeRun.taxDeduction)} 
          icon="receipt" 
        />
        <StatCard 
          label="Net Take-Home Pay" 
          value={formatETB(activeRun.netPay)} 
          icon="trend" 
        />
      </div>
    </div>
  );
}
