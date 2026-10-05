'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import DemoShell from '../../components/DemoShell';
import { Icon } from '../../components/Icons';
import apiClient, { CreateEmployee, Employee } from '../../lib/api/client';

function requestError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(' ');
    if (!error.response) return 'Cannot reach the API. Check that it is running and try again.';
  }
  return 'The request failed. Please try again.';
}

function employeeName(employee: Employee): string {
  return [employee.firstName, employee.fatherName, employee.grandFatherName]
    .filter(Boolean)
    .join(' ');
}

function money(value: number | string): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`
    : '—';
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const { data } = await apiClient.get<Employee[]>('/employees');
      setEmployees(data);
    } catch (error) {
      setLoadError(requestError(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return employees;
    return employees.filter((employee) =>
      [employeeName(employee), employee.email, employee.tinNumber, employee.region]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [employees, query]);

  async function createEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setIsSaving(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload: CreateEmployee = {
      firstName: String(formData.get('firstName')).trim(),
      fatherName: String(formData.get('fatherName')).trim(),
      grandFatherName: String(formData.get('grandFatherName')).trim(),
      email: String(formData.get('email')).trim(),
      tinNumber: String(formData.get('tinNumber')).trim(),
      basicSalary: Number(formData.get('basicSalary')),
      bankAccountNumber: String(formData.get('bankAccountNumber')).trim(),
    };
    const transportAllowance = String(formData.get('transportAllowance')).trim();
    const otherAllowances = String(formData.get('otherAllowances')).trim();
    const region = String(formData.get('region')).trim();
    if (transportAllowance) payload.transportAllowance = Number(transportAllowance);
    if (otherAllowances) payload.otherAllowances = Number(otherAllowances);
    if (region) payload.region = region;

    try {
      await apiClient.post<Employee>('/employees', payload);
      setShowCreateForm(false);
      form.reset();
      await loadEmployees();
    } catch (error) {
      setFormError(requestError(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DemoShell title="Employees" subtitle="Manage employee records for your organization">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">
            Employees <span className="ml-1 text-sm font-normal text-slate-400">{employees.length}</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">Only employees belonging to your organization are shown.</p>
        </div>
        <button
          onClick={() => { setFormError(''); setShowCreateForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Icon name="plus" size={15} /> Add employee
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="create-employee-title" className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="create-employee-title" className="text-lg font-bold">Add employee</h2>
                <p className="mt-1 text-xs text-slate-500">Employee data is saved to your organization.</p>
              </div>
              <button type="button" onClick={() => setShowCreateForm(false)} aria-label="Close form" className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <form onSubmit={createEmployee} className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ['firstName', 'First name', 'text'],
                ['fatherName', 'Father name', 'text'],
                ['grandFatherName', 'Grandfather name', 'text'],
                ['email', 'Email', 'email'],
                ['tinNumber', 'Tax identification number', 'text'],
                ['basicSalary', 'Basic monthly salary (ETB)', 'number'],
                ['transportAllowance', 'Transport allowance (ETB)', 'number'],
                ['otherAllowances', 'Other allowances (ETB)', 'number'],
                ['region', 'Region', 'text'],
                ['bankAccountNumber', 'Bank account number', 'text'],
              ].map(([name, label, type]) => (
                <label key={name} className="text-xs font-semibold text-slate-700">
                  {label}{['transportAllowance', 'otherAllowances', 'region'].includes(name) ? ' (optional)' : ''}
                  <input
                    name={name}
                    type={type}
                    required={!['transportAllowance', 'otherAllowances', 'region'].includes(name)}
                    min={type === 'number' ? '0' : undefined}
                    step={type === 'number' ? '0.01' : undefined}
                    maxLength={type === 'number' ? undefined : 255}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500"
                  />
                </label>
              ))}
              {formError && <p role="alert" className="sm:col-span-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{formError}</p>}
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button type="button" onClick={() => setShowCreateForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Cancel</button>
                <button disabled={isSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {isSaving ? 'Saving…' : 'Save employee'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-xl">
            <Icon name="search" size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, TIN or region..."
              aria-label="Search employees"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>
        </div>
        {loadError ? (
          <div className="p-8 text-center">
            <p role="alert" className="text-sm text-rose-700">{loadError}</p>
            <button onClick={() => void loadEmployees()} className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Retry</button>
          </div>
        ) : isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading employees…</p>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-700">{employees.length ? 'No employees match your search.' : 'No employees yet.'}</p>
            <p className="mt-1 text-xs text-slate-500">{employees.length ? 'Try a different search.' : 'Add an employee to begin building your directory.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>{['Employee', 'Region', 'Basic salary', 'Created', ''].map((heading) => <th key={heading} className="px-5 py-3">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => {
                  const name = employeeName(employee);
                  return (
                    <tr key={employee.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <Link href={`/employees/${employee.id}`} className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">
                            {name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{name}</div>
                            <div className="mt-0.5 text-[10px] text-slate-400">{employee.email}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{employee.region || '—'}</td>
                      <td className="px-5 py-4 font-semibold">{money(employee.basicSalary)}</td>
                      <td className="px-5 py-4 text-slate-500">{new Date(employee.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-slate-400"><Icon name="chevron" size={16} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && !loadError && (
          <div className="border-t border-slate-100 p-4 text-[11px] text-slate-400">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        )}
      </section>
    </DemoShell>
  );
}
