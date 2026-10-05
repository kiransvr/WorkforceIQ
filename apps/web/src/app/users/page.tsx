"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import DemoShell from "../../components/DemoShell";
import apiClient, { OrganizationUser } from "../../lib/api/client";

const assignableRoles = [
  ["branch_manager", "Branch manager"],
  ["payroll_officer", "Payroll officer"],
  ["employee", "Employee"],
  ["auditor", "Auditor"],
] as const;

function requestError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(" ");
    if (!error.response) {
      return "Cannot reach the API. Check that it is running and try again.";
    }
  }
  return fallback;
}

function roleLabel(role: string): string {
  return role.replaceAll("_", " ");
}

export default function UsersPage() {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [role, setRole] = useState<string>("payroll_officer");
  const [pendingRole, setPendingRole] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [usersResponse, profileResponse] = await Promise.all([
        apiClient.get<OrganizationUser[]>("/organization-users"),
        apiClient.get<{ user: { id: string } }>("/auth/me"),
      ]);
      setUsers(usersResponse.data);
      setCurrentUserId(profileResponse.data.user.id);
      setPendingRole(
        Object.fromEntries(
          usersResponse.data.map((user) => [user.id, user.role]),
        ),
      );
    } catch (loadError) {
      setError(requestError(loadError, "Unable to load organization users."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsCreating(true);
    try {
      const { data } = await apiClient.post<OrganizationUser>(
        "/organization-users",
        { email, temporaryPassword, role },
      );
      setUsers((currentUsers) => [...currentUsers, data]);
      setPendingRole((currentRoles) => ({ ...currentRoles, [data.id]: data.role }));
      setNotice(
        `${data.email} was created as a ${roleLabel(data.role)}. They must change the temporary password at first sign-in.`,
      );
      setEmail("");
      setTemporaryPassword("");
    } catch (createError) {
      setError(requestError(createError, "Unable to create the user."));
    } finally {
      setIsCreating(false);
    }
  }

  async function updateUser(user: OrganizationUser, update: { role?: string; isActive?: boolean }) {
    setError("");
    setNotice("");
    setUpdatingUserId(user.id);
    try {
      const { data } = await apiClient.patch<OrganizationUser>(
        `/organization-users/${user.id}`,
        update,
      );
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === data.id ? data : currentUser,
        ),
      );
      setPendingRole((currentRoles) => ({ ...currentRoles, [data.id]: data.role }));
      setNotice(`${data.email}'s account was updated.`);
    } catch (updateError) {
      setError(requestError(updateError, "Unable to update the user."));
    } finally {
      setUpdatingUserId("");
    }
  }

  return (
    <DemoShell title="Organization users" subtitle="Manage access for your organization">
      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-bold text-slate-900">User access</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add teammates to this organization, assign a least-privilege role,
            and deactivate accounts that should no longer sign in.
          </p>
        </section>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          New users must change their temporary password at first sign-in.
          Passwords are stored as one-way Argon2 hashes and are never shown here.
          Payroll officers can independently approve payroll drafts.
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        <form onSubmit={createUser} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Add an organization user</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              Email address
              <input
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Temporary password (12+ characters)
              <input
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                value={temporaryPassword}
                onChange={(event) => setTemporaryPassword(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Role
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-900"
              >
                {assignableRoles.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? "Creating…" : "Create user"}
          </button>
        </form>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold text-slate-900">Organization accounts</h3>
          </div>
          {isLoading ? (
            <p className="p-6 text-center text-sm text-slate-500">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">No users are assigned to this organization.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((user) => {
                const isManaged = assignableRoles.some(([value]) => value === user.role);
                const isSelf = user.id === currentUserId;
                return (
                  <div key={user.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{user.email}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {user.lastLoginAt
                          ? `Last sign-in ${new Date(user.lastLoginAt).toLocaleString()}`
                          : "Has not signed in"}
                        {user.mustChangePassword ? " · Temporary password pending" : ""}
                      </p>
                    </div>
                    <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Role for ${user.email}`}
                        value={pendingRole[user.id] ?? user.role}
                        disabled={!isManaged || isSelf || updatingUserId === user.id}
                        onChange={(event) =>
                          setPendingRole((currentRoles) => ({
                            ...currentRoles,
                            [user.id]: event.target.value,
                          }))
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs capitalize text-slate-700 disabled:bg-slate-50"
                      >
                        {isManaged ? assignableRoles.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        )) : <option value={user.role}>{roleLabel(user.role)}</option>}
                      </select>
                      {isManaged && !isSelf && pendingRole[user.id] !== user.role && (
                        <button
                          type="button"
                          disabled={updatingUserId === user.id}
                          onClick={() => void updateUser(user, { role: pendingRole[user.id] })}
                          className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50"
                        >
                          Save role
                        </button>
                      )}
                      {isManaged && !isSelf && (
                        <button
                          type="button"
                          disabled={updatingUserId === user.id}
                          onClick={() => void updateUser(user, { isActive: !user.isActive })}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${user.isActive ? "border-rose-200 text-rose-700" : "border-emerald-200 text-emerald-700"}`}
                        >
                          {updatingUserId === user.id ? "Saving…" : user.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      )}
                      {isSelf && <span className="text-xs text-slate-500">You</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </DemoShell>
  );
}
