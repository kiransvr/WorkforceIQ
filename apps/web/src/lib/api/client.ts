"use client";

import axios from "axios";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  organizationId: string | null;
  mustChangePassword: boolean;
}

export interface OrganizationUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Employee {
  id: string;
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  email: string;
  tinNumber: string;
  basicSalary: number | string;
  transportAllowance: number | string;
  otherAllowances: number | string;
  region: string;
  subCity: string | null;
  woreda: string | null;
  kebele: string | null;
  bankName: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployee {
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  email: string;
  tinNumber: string;
  basicSalary: number;
  transportAllowance?: number;
  otherAllowances?: number;
  region?: string;
  bankAccountNumber: string;
}

export type UpdateEmployee = Partial<
  Omit<CreateEmployee, "bankAccountNumber">
> & {
  subCity?: string;
  woreda?: string;
  kebele?: string;
  bankName?: string;
};

export interface PayrollRun {
  id: string;
  payPeriod: string;
  basicSalary: number | string;
  grossTaxableIncome: number | string;
  employmentIncomeTax: number | string;
  employeePension: number | string;
  employerPension: number | string;
  netPay: number | string;
  status: string;
  createdByUserId: string;
  approvedByUserId: string | null;
  approvedAt: string | null;
  finalizedByUserId: string | null;
  finalizedAt: string | null;
  employee: Pick<
    Employee,
    "id" | "firstName" | "fatherName" | "grandFatherName" | "email"
  >;
  createdAt: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  countryCode: string;
  currencyCode: string;
  locale: string;
  isActive: boolean;
  createdAt: string;
  employeeCount: number;
  departmentCount: number;
  branches: {
    id: string;
    name: string;
    address: string | null;
    isActive: boolean;
    departmentCount: number;
  }[];
}

export interface LoginResponse {
  user: AuthenticatedUser;
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

if (typeof window !== "undefined") {
  window.localStorage.removeItem("access_token");
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined"
    ) {
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
