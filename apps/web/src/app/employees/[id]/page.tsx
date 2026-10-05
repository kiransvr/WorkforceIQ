'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import DemoShell from '../../../components/DemoShell';
import apiClient, { Employee, UpdateEmployee } from '../../../lib/api/client';

interface EmployeeEditForm {
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  email: string;
  tinNumber: string;
  basicSalary: string;
  transportAllowance: string;
  otherAllowances: string;
  region: string;
  subCity: string;
  woreda: string;
  kebele: string;
  bankName: string;
}

const editFields: {
  key: keyof EmployeeEditForm;
  label: string;
  type: 'text' | 'email' | 'number';
  required?: boolean;
}[] = [
  { key: 'firstName', label: 'First name', type: 'text', required: true },
  { key: 'fatherName', label: 'Father name', type: 'text', required: true },
  { key: 'grandFatherName', label: 'Grandfather name', type: 'text', required: true },
  { key: 'email', label: 'Email address', type: 'email', required: true },
  { key: 'tinNumber', label: 'Tax identification number', type: 'text', required: true },
  { key: 'basicSalary', label: 'Monthly basic salary', type: 'number', required: true },
  { key: 'transportAllowance', label: 'Transport allowance', type: 'number' },
  { key: 'otherAllowances', label: 'Other allowances', type: 'number' },
  { key: 'region', label: 'Region', type: 'text' },
  { key: 'subCity', label: 'Sub-city', type: 'text' },
  { key: 'woreda', label: 'Woreda', type: 'text' },
  { key: 'kebele', label: 'Kebele', type: 'text' },
  { key: 'bankName', label: 'Bank', type: 'text' },
];

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

function requestError(error: unknown, fallback = 'Unable to load this employee.'): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(' ');
    if (!error.response) return 'Cannot reach the API. Check that it is running and try again.';
  }
  return fallback;
}

function editableValues(employee: Employee): EmployeeEditForm {
  return {
    firstName: employee.firstName,
    fatherName: employee.fatherName,
    grandFatherName: employee.grandFatherName,
    email: employee.email,
    tinNumber: employee.tinNumber,
    basicSalary: String(employee.basicSalary),
    transportAllowance: String(employee.transportAllowance),
    otherAllowances: String(employee.otherAllowances),
    region: employee.region,
    subCity: employee.subCity ?? '',
    woreda: employee.woreda ?? '',
    kebele: employee.kebele ?? '',
    bankName: employee.bankName,
  };
}

export default function EmployeeProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<EmployeeEditForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const loadEmployee = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get<Employee>(`/employees/${encodeURIComponent(id)}`);
      setEmployee(data);
    } catch (loadError) {
      setError(requestError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadEmployee();
  }, [loadEmployee]);

  function beginEditing() {
    if (!employee) return;
    setDraft(editableValues(employee));
    setSaveError('');
    setSaveMessage('');
    setIsEditing(true);
  }

  async function saveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;

    const payload: UpdateEmployee = {
      firstName: draft.firstName.trim(),
      fatherName: draft.fatherName.trim(),
      grandFatherName: draft.grandFatherName.trim(),
      email: draft.email.trim(),
      tinNumber: draft.tinNumber.trim(),
      basicSalary: Number(draft.basicSalary),
    };

    if (draft.transportAllowance !== '') {
      payload.transportAllowance = Number(draft.transportAllowance);
    }
    if (draft.otherAllowances !== '') {
      payload.otherAllowances = Number(draft.otherAllowances);
    }
    payload.region = draft.region.trim();
    payload.subCity = draft.subCity.trim();
    payload.woreda = draft.woreda.trim();
    payload.kebele = draft.kebele.trim();
    payload.bankName = draft.bankName.trim();

    setIsSaving(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const { data } = await apiClient.patch<Employee>(
        `/employees/${encodeURIComponent(id)}`,
        payload,
      );
      setEmployee(data);
      setIsEditing(false);
      setDraft(null);
      setSaveMessage('Employee details saved.');
    } catch (saveError) {
      setSaveError(requestError(saveError, 'Unable to save employee changes.'));
    } finally {
      setIsSaving(false);
    }
  }

  const name = employee ? employeeName(employee) : 'Employee profile';
  return (
    <DemoShell title="Employee profile" subtitle="Organization employee record">
      <Link href="/employees" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600">
        ← Back to employees
      </Link>
      {isLoading ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading employee…</p>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p role="alert" className="text-sm text-rose-700">{error}</p>
          <button onClick={() => void loadEmployee()} className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">Retry</button>
        </div>
      ) : employee ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-700">
                  {name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{name}</h2>
                  <p className="mt-1 text-xs text-slate-500">{employee.email}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Employee ID: {employee.id}</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={beginEditing}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit employee
                </button>
              )}
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Monthly basic salary</div>
                <div className="mt-2 text-lg font-bold">{money(employee.basicSalary)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Transport allowance</div>
                <div className="mt-2 text-lg font-bold">{money(employee.transportAllowance)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Other allowances</div>
                <div className="mt-2 text-lg font-bold">{money(employee.otherAllowances)}</div>
              </div>
            </div>
          </section>

          {saveMessage && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{saveMessage}</p>}

          {isEditing && draft && (
            <form onSubmit={saveEmployee} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold">Edit employee information</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {editFields.map((field) => (
                  <label key={field.key} className="text-xs font-semibold text-slate-600">
                    {field.label}
                    <input
                      type={field.type}
                      name={field.key}
                      value={draft[field.key]}
                      onChange={(event) =>
                        setDraft((current) =>
                          current ? { ...current, [field.key]: event.target.value } : current,
                        )
                      }
                      required={field.required}
                      min={field.type === 'number' ? 0 : undefined}
                      step={field.type === 'number' ? '0.01' : undefined}
                      maxLength={field.type !== 'number' ? 255 : undefined}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Bank account details are not shown or changed here.
              </p>
              {saveError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{saveError}</p>}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setIsEditing(false);
                    setDraft(null);
                    setSaveError('');
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold">Employee information</h3>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['First name', employee.firstName],
                ['Father name', employee.fatherName],
                ['Grandfather name', employee.grandFatherName],
                ['Tax identification number', employee.tinNumber],
                ['Region', employee.region],
                ['Sub-city', employee.subCity],
                ['Woreda', employee.woreda],
                ['Kebele', employee.kebele],
                ['Bank', employee.bankName],
                ['Created', new Date(employee.createdAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] uppercase tracking-wider text-slate-400">{label}</dt>
                  <dd className="mt-1 break-words text-xs font-semibold">{value || '—'}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              Bank account details are intentionally not displayed.
            </p>
          </section>
        </>
      ) : null}
    </DemoShell>
  );
}
