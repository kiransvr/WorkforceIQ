"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import DemoShell from "../../components/DemoShell";
import { Icon } from "../../components/Icons";
import apiClient, { Employee } from "../../lib/api/client";

function employeeName(employee: Employee): string {
  return [employee.firstName, employee.fatherName, employee.grandFatherName]
    .filter(Boolean)
    .join(" ");
}

function requestError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(" ");
    if (!error.response)
      return "Cannot reach the API. Check that it is running and try again.";
  }
  return "Unable to load dashboard data. Please try again.";
}

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await apiClient.get<Employee[]>("/employees");
      setEmployees(data);
    } catch (loadError) {
      setError(requestError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const recentEmployees = employees.slice(0, 5);

  return (
    <DemoShell title="Dashboard" subtitle="Your organization at a glance">
      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-bold text-slate-900">
            Workforce overview
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Organization-scoped information from your WorkforceIQ workspace.
          </p>
        </section>

        <section
          className="grid gap-4 md:grid-cols-3"
          aria-label="Organization metrics"
        >
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Icon name="users" size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Employees in organization
              </p>
              <p
                className="mt-1 text-2xl font-bold text-slate-900"
                aria-live="polite"
              >
                {isLoading
                  ? "…"
                  : error
                    ? "—"
                    : employees.length.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Payroll</p>
            <p className="mt-2 text-base font-semibold text-slate-700">
              No dashboard totals yet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Payroll summaries are not connected here.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Time &amp; attendance
            </p>
            <p className="mt-2 text-base font-semibold text-slate-700">
              Not available
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Attendance tracking is not connected yet.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Recently added employees
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                The latest employee records in your organization.
              </p>
            </div>
            <Link
              href="/employees"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View all employees
            </Link>
          </div>

          {error ? (
            <div className="p-6 text-center">
              <p role="alert" className="text-sm text-rose-700">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadEmployees()}
                className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Retry
              </button>
            </div>
          ) : isLoading ? (
            <p className="p-6 text-center text-sm text-slate-500">
              Loading organization employees…
            </p>
          ) : recentEmployees.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No employees added yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add an employee to start building your organization directory.
              </p>
              <Link
                href="/employees"
                className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Go to employees
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentEmployees.map((employee) => (
                <li
                  key={employee.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <Link
                      href={`/employees/${encodeURIComponent(employee.id)}`}
                      className="text-sm font-semibold text-slate-800 hover:text-blue-700"
                    >
                      {employeeName(employee)}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {employee.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-700">
                      {employee.region || "Region not set"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Added {new Date(employee.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DemoShell>
  );
}
