"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import DemoShell from "../../components/DemoShell";
import { Icon } from "../../components/Icons";
import apiClient, { OrganizationSummary } from "../../lib/api/client";

function requestError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(" ");
    if (!error.response)
      return "Cannot reach the API. Check that it is running and try again.";
  }
  return "Unable to load organization details. Please try again.";
}

export default function OrganizationsPage() {
  const [organization, setOrganization] = useState<OrganizationSummary | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrganization = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } =
        await apiClient.get<OrganizationSummary>("/organizations/me");
      setOrganization(data);
    } catch (loadError) {
      setError(requestError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrganization();
  }, [loadOrganization]);

  const branches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!organization || !normalizedQuery) return organization?.branches ?? [];
    return organization.branches.filter((branch) =>
      [
        branch.name,
        branch.address ?? "",
        branch.isActive ? "active" : "inactive",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [organization, query]);

  return (
    <DemoShell
      title="Organization"
      subtitle="Organization profile and locations"
    >
      <div className="space-y-6">
        <section className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Your organization
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Organization details are scoped to the account you signed in with.
            </p>
          </div>
          {organization && (
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                organization.isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {organization.isActive ? "Active" : "Inactive"}
            </span>
          )}
        </section>

        {error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void loadOrganization()}
              className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading organization details…
          </p>
        ) : organization ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon name="building" size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="break-words text-base font-bold text-slate-900">
                    {organization.name}
                  </h3>
                  <p className="mt-1 break-all text-xs text-slate-500">
                    Organization ID: {organization.id}
                  </p>
                </div>
              </div>
              <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-slate-400">
                    Country
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {organization.countryCode}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-slate-400">
                    Currency
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {organization.currencyCode}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-wider text-slate-400">
                    Locale
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {organization.locale}
                  </dd>
                </div>
              </dl>
            </section>

            <section
              className="grid gap-4 sm:grid-cols-3"
              aria-label="Organization totals"
            >
              {[
                {
                  label: "Employees",
                  value: organization.employeeCount,
                  icon: "users",
                },
                {
                  label: "Departments",
                  value: organization.departmentCount,
                  icon: "grid",
                },
                {
                  label: "Locations",
                  value: organization.branches.length,
                  icon: "building",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Icon name={metric.icon} size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {metric.label}
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {metric.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Branches and locations
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {organization.branches.length} location
                    {organization.branches.length === 1 ? "" : "s"} in this
                    organization.
                  </p>
                </div>
                {organization.branches.length > 0 && (
                  <div className="relative w-full sm:max-w-xs">
                    <Icon
                      name="search"
                      size={16}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      aria-label="Search branches"
                      placeholder="Search branches…"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {branches.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">
                  {organization.branches.length === 0
                    ? "No branches or locations have been added yet."
                    : "No branches match your search."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px] text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Branch</th>
                        <th className="px-5 py-3 font-semibold">Address</th>
                        <th className="px-5 py-3 font-semibold">Departments</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {branches.map((branch) => (
                        <tr key={branch.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4 font-semibold text-slate-800">
                            {branch.name}
                          </td>
                          <td className="px-5 py-4 text-slate-500">
                            {branch.address || "—"}
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {branch.departmentCount.toLocaleString()}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                branch.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {branch.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <p className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
              Organization and branch creation or editing are not available in
              this workspace yet.
            </p>
          </>
        ) : null}
      </div>
    </DemoShell>
  );
}
