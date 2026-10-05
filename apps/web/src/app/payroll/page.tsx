"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import DemoShell from "../../components/DemoShell";
import apiClient, { Employee, PayrollRun } from "../../lib/api/client";

function currentPayPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function employeeName(employee: Employee | PayrollRun["employee"]): string {
  return [employee.firstName, employee.fatherName, employee.grandFatherName]
    .filter(Boolean)
    .join(" ");
}

function money(value: number | string): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-ET", {
        style: "currency",
        currency: "ETB",
        currencyDisplay: "code",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    : "—";
}

function requestError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(" ");
    if (!error.response)
      return "Cannot reach the API. Check that it is running and try again.";
  }
  return fallback;
}

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [payPeriod, setPayPeriod] = useState(currentPayPeriod);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actingOnRunId, setActingOnRunId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [processError, setProcessError] = useState("");
  const [workflowError, setWorkflowError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPayrollData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const [employeeResponse, runsResponse, profileResponse] = await Promise.all([
        apiClient.get<Employee[]>("/employees"),
        apiClient.get<PayrollRun[]>(
          `/payroll/period/${encodeURIComponent(payPeriod)}`,
        ),
        apiClient.get<{ user: { id: string } }>("/auth/me"),
      ]);
      setEmployees(employeeResponse.data);
      setRuns(runsResponse.data);
      setCurrentUserId(profileResponse.data.user.id);
      setSelectedEmployeeId((currentId) =>
        employeeResponse.data.some(
          (employee) =>
            employee.id === currentId &&
            !runsResponse.data.some((run) => run.employee.id === currentId),
        )
          ? currentId
          : "",
      );
    } catch (error) {
      setLoadError(
        requestError(error, "Unable to load payroll data. Please try again."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [payPeriod]);

  useEffect(() => {
    void loadPayrollData();
  }, [loadPayrollData]);

  const availableEmployees = useMemo(
    () =>
      employees.filter(
        (employee) => !runs.some((run) => run.employee.id === employee.id),
      ),
    [employees, runs],
  );

  const totals = useMemo(
    () =>
      runs.reduce(
        (sum, run) => ({
          gross: sum.gross + Number(run.grossTaxableIncome),
          tax: sum.tax + Number(run.employmentIncomeTax),
          net: sum.net + Number(run.netPay),
        }),
        { gross: 0, tax: 0, net: 0 },
      ),
    [runs],
  );

  async function transitionRun(run: PayrollRun, action: "approve" | "finalize") {
    setWorkflowError("");
    setNotice("");
    setActingOnRunId(run.id);
    try {
      const { data } = await apiClient.patch<PayrollRun>(
        `/payroll/${run.id}/${action}`,
      );
      setRuns((currentRuns) =>
        currentRuns.map((currentRun) =>
          currentRun.id === data.id ? data : currentRun,
        ),
      );
      setNotice(
        action === "approve"
          ? "Payroll run approved. The approver can now finalize it."
          : "Payroll run finalized and locked. No payment was initiated.",
      );
    } catch (error) {
      setWorkflowError(
        requestError(error, `Unable to ${action} this payroll run.`),
      );
    } finally {
      setActingOnRunId("");
    }
  }

  async function processPayroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProcessError("");
    setNotice("");
    if (!selectedEmployeeId) {
      setProcessError("Choose an employee before processing payroll.");
      return;
    }

    setIsProcessing(true);
    try {
      const { data } = await apiClient.post<PayrollRun>("/payroll/process", {
        employeeId: selectedEmployeeId,
        payPeriod,
      });
      setRuns((currentRuns) => [
        data,
        ...currentRuns.filter((run) => run.employee.id !== data.employee.id),
      ]);
      setSelectedEmployeeId("");
      setNotice(
        `Payroll calculated and saved as ${data.status.toLowerCase()}.`,
      );
    } catch (error) {
      setProcessError(
        requestError(error, "Unable to process payroll. Please try again."),
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <DemoShell
      title="Payroll runs"
      subtitle="Calculate and review organization payroll drafts"
    >
      <div className="space-y-6">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Payroll calculations
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Select a pay period to review saved calculations or calculate an
              employee draft.
            </p>
          </div>
          <label className="text-xs font-semibold text-slate-600">
            Pay period
            <input
              type="month"
              value={payPeriod}
              onChange={(event) => setPayPeriod(event.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
            />
          </label>
        </section>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          A different authorized user must approve each draft. Finalization locks
          the recorded calculation; it does not initiate a bank payment.
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p role="alert" className="text-sm text-rose-700">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => void loadPayrollData()}
              className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <section
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              aria-label="Payroll period totals"
            >
              {[
                ["Employees processed", String(runs.length)],
                ["Gross taxable income", money(totals.gross)],
                ["Income tax withheld", money(totals.tax)],
                ["Calculated net pay", money(totals.net)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p
                    className="mt-2 text-lg font-bold text-slate-900"
                    aria-live="polite"
                  >
                    {isLoading ? "…" : value}
                  </p>
                </div>
              ))}
            </section>

            <form
              onSubmit={processPayroll}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-sm font-bold text-slate-900">
                Calculate employee payroll
              </h3>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="min-w-64 flex-1 text-xs font-semibold text-slate-600">
                  Employee
                  <select
                    value={selectedEmployeeId}
                    onChange={(event) =>
                      setSelectedEmployeeId(event.target.value)
                    }
                    disabled={
                      isLoading ||
                      isProcessing ||
                      availableEmployees.length === 0
                    }
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-blue-500 disabled:bg-slate-50"
                  >
                    <option value="">
                      {availableEmployees.length === 0
                        ? "No unprocessed employees for this period"
                        : "Select an employee"}
                    </option>
                    {availableEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employeeName(employee)} — {employee.email}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={isLoading || isProcessing || !selectedEmployeeId}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? "Calculating…" : "Calculate draft"}
                </button>
              </div>
              {processError && (
                <p role="alert" className="mt-3 text-sm text-rose-700">
                  {processError}
                </p>
              )}
              {notice && (
                <p role="status" className="mt-3 text-sm text-emerald-700">
                  {notice}
                </p>
              )}
            </form>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Saved payroll calculations
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Period {payPeriod}. Employee bank details are not shown.
                </p>
              </div>
              {isLoading ? (
                <p className="p-6 text-center text-sm text-slate-500">
                  Loading payroll calculations…
                </p>
              ) : runs.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">
                  No payroll calculations have been saved for this period.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Employee</th>
                        <th className="px-4 py-3 font-semibold">
                          Gross taxable
                        </th>
                        <th className="px-4 py-3 font-semibold">Income tax</th>
                        <th className="px-4 py-3 font-semibold">
                          Employee pension
                        </th>
                        <th className="px-4 py-3 font-semibold">Net pay</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Workflow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {runs.map((run) => (
                        <tr key={run.id}>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">
                              {employeeName(run.employee)}
                            </p>
                            <p className="mt-1 text-slate-500">
                              {run.employee.email}
                            </p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {money(run.grossTaxableIncome)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {money(run.employmentIncomeTax)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {money(run.employeePension)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap font-semibold">
                            {money(run.netPay)}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              run.status === "Finalized"
                                ? "bg-emerald-50 text-emerald-800"
                                : run.status === "Approved"
                                  ? "bg-blue-50 text-blue-800"
                                  : "bg-amber-50 text-amber-800"
                            }`}>
                              {run.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {run.status === "Draft" && !run.createdByUserId ? (
                              <span className="text-rose-700">
                                Legacy draft — preparer unknown
                              </span>
                            ) : run.status === "Draft" &&
                            currentUserId !== run.createdByUserId ? (
                              <button
                                type="button"
                                disabled={actingOnRunId !== ""}
                                onClick={() => void transitionRun(run, "approve")}
                                className="rounded-lg border border-blue-200 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                              >
                                {actingOnRunId === run.id ? "Approving…" : "Approve"}
                              </button>
                            ) : run.status === "Approved" &&
                              currentUserId === run.approvedByUserId ? (
                              <button
                                type="button"
                                disabled={actingOnRunId !== ""}
                                onClick={() => void transitionRun(run, "finalize")}
                                className="rounded-lg border border-emerald-200 px-3 py-2 font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                              >
                                {actingOnRunId === run.id ? "Finalizing…" : "Finalize"}
                              </button>
                            ) : run.status === "Draft" ? (
                              <span className="text-slate-500">Waiting for another user to approve</span>
                            ) : run.status === "Approved" ? (
                              <span className="text-slate-500">Waiting for the approver to finalize</span>
                            ) : (
                              <span className="text-slate-500">Locked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {workflowError && (
                <p role="alert" className="border-t border-slate-100 px-5 py-3 text-sm text-rose-700">
                  {workflowError}
                </p>
              )}
              {notice && (
                <p role="status" className="border-t border-slate-100 px-5 py-3 text-sm text-emerald-700">
                  {notice}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </DemoShell>
  );
}
