'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Building2, 
  CreditCard, 
  FileSpreadsheet, 
  Clock, 
  Settings, 
  Bell, 
  LogOut 
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Navigation Links Definition Array
  const navigationItems = [
    { id: 'overview', name: 'Overview', icon: Building2 },
    { id: 'employees', name: 'Employees', icon: Users },
    { id: 'payroll', name: 'Payroll & Tax', icon: CreditCard },
    { id: 'attendance', name: 'Time & Attendance', icon: Clock },
    { id: 'reports', name: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* 1. Left Side Navigation Frame */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between">
        <div>
          {/* Brand/Product Identity Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              WorkforceIQ
            </span>
            <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded">Lite</span>
          </div>

          {/* Navigation Links List */}
          <nav className="p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Identity Signout Context Section */}
        <div className="p-4 border-t border-slate-100">
          <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main System Layout Frame */}
      <div className="flex-1 flex flex-col">
        
        {/* Global Toolbar Header Component */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8">
          <div>
            <h2 className="text-sm font-medium text-slate-500 capitalize">Workspace / {activeTab}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-blue-600 rounded-full" />
            </button>
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-between text-white font-semibold text-sm justify-center">
              AD
            </div>
          </div>
        </header>

        {/* Core Component Canvas Slot */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Metrics Overview</h1>
                <p className="text-slate-500 text-sm">Real-time breakdown of operational workforce vectors</p>
              </div>

              {/* Data Summary Grid */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users className="h-6 w-6" /></div>
                  <div>
                    <span className="text-sm font-medium text-slate-500">Total Active Employees</span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-0.5">1,248</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CreditCard className="h-6 w-6" /></div>
                  <div>
                    <span className="text-sm font-medium text-slate-500">Monthly Payroll Run</span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-0.5">ETB 452,800.00</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock className="h-6 w-6" /></div>
                  <div>
                    <span className="text-sm font-medium text-slate-500">Avg. Attendance Rate</span>
                    <h3 className="text-2xl font-bold text-slate-900 mt-0.5">94.2%</h3>
                  </div>
                </div>
              </div>

              {/* Functional Placeholder Data Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900">Recent Employee Onboarding Status</h3>
                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All</button>
                </div>
                <div className="p-6 text-center text-slate-400 text-sm">
                  Connect your NestJS backend modules to feed active database records here.
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'overview' && (
            <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center">
              <h2 className="text-lg font-semibold text-slate-800 capitalize">Manage {activeTab} Domain</h2>
              <p className="text-slate-400 text-sm mt-1">This context block maps straight down to your nested workspace component routes.</p>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
