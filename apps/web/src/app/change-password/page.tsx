"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import apiClient from "../../lib/api/client";

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(" ");
  }
  return "Unable to change the password. Please try again.";
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await apiClient.patch("/auth/password", { currentPassword, newPassword });
      router.replace("/dashboard");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Change your temporary password</h1>
          <p className="mt-2 text-sm text-slate-600">
            Set a private password before continuing to WorkforceIQ.
          </p>
        </div>
        <label className="block text-xs font-semibold text-slate-600">
          Temporary password
          <input
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
          />
        </label>
        <label className="block text-xs font-semibold text-slate-600">
          New password (12+ characters)
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
          />
        </label>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Updating…" : "Set new password"}
        </button>
      </form>
    </main>
  );
}
