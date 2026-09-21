import { Injectable } from '@nestjs/common';

export interface TaxBracket {
  rate: number;
  threshold_min: number;
  threshold_max: number | null;
  deduction_constant: number;
}

export interface PayrollInput {
  basicSalary: number;
  transportAllowance: number;
  otherAllowances: number;
}

export interface PayrollResult {
  basicSalary: number;
  grossTaxableIncome: number;
  employmentIncomeTax: number;
  employeePension: number;
  employerPension: number;
  netPay: number;
}

@Injectable()
export class PayrollRulesEngine {
  // Ethiopian progressive income tax brackets (Source: Proclamation No. 979/2016)
  private readonly taxBrackets: TaxBracket[] = [
    { rate: 0.00, threshold_min: 0, threshold_max: 600, deduction_constant: 0 },
    { rate: 0.10, threshold_min: 601, threshold_max: 1650, deduction_constant: 60 },
    { rate: 0.15, threshold_min: 1651, threshold_max: 3200, deduction_constant: 142.5 },
    { rate: 0.20, threshold_min: 3201, threshold_max: 5250, deduction_constant: 302.5 },
    { rate: 0.25, threshold_min: 5251, threshold_max: 7800, deduction_constant: 565 },
    { rate: 0.30, threshold_min: 7801, threshold_max: 10900, deduction_constant: 955 },
    { rate: 0.35, threshold_min: 10901, threshold_max: null, deduction_constant: 1500 },
  ];

  private readonly PENSION_EMPLOYEE_RATE = 0.07; // 7% Employee Share
  private readonly PENSION_EMPLOYER_RATE = 0.11; // 11% Employer Share
  private readonly TRANSPORT_TAX_EXEMPT_LIMIT = 600; // Up to 600 ETB is tax-free

  /**
   * Evaluates and computes Ethiopian payroll lines natively in ETB.
   */
  public calculatePayroll(input: PayrollInput): PayrollResult {
    const { basicSalary, transportAllowance, otherAllowances } = input;

    // 1. Core Statutory Pension Deductions (Calculated strictly off Basic Salary)
    const employeePension = basicSalary * this.PENSION_EMPLOYEE_RATE;
    const employerPension = basicSalary * this.PENSION_EMPLOYER_RATE;

    // 2. Transport Allowance Tax Exemption processing
    const taxableTransport = Math.max(0, transportAllowance - this.TRANSPORT_TAX_EXEMPT_LIMIT);

    // 3. Compile Total Gross Taxable Income Pool
    const grossTaxableIncome = basicSalary + taxableTransport + otherAllowances;

    // 4. Run progressive tax evaluation mapping
    const employmentIncomeTax = this.calculateIncomeTax(grossTaxableIncome);

    // 5. Final Net Take-Home Calculation
    const totalGrossEarnings = basicSalary + transportAllowance + otherAllowances;
    const netPay = totalGrossEarnings - employmentIncomeTax - employeePension;

    return {
      basicSalary,
      grossTaxableIncome: this.roundToCent(grossTaxableIncome),
      employmentIncomeTax: this.roundToCent(employmentIncomeTax),
      employeePension: this.roundToCent(employeePension),
      employerPension: this.roundToCent(employerPension),
      netPay: this.roundToCent(netPay),
    };
  }

  private calculateIncomeTax(taxableIncome: number): number {
    const matchedBracket = this.taxBrackets.find((bracket) => {
      if (bracket.threshold_max === null) return taxableIncome >= bracket.threshold_min;
      return taxableIncome >= bracket.threshold_min && taxableIncome <= bracket.threshold_max;
    });

    if (!matchedBracket) return 0;

    const tax = (taxableIncome * matchedBracket.rate) - matchedBracket.deduction_constant;
    return Math.max(0, tax);
  }

  private roundToCent(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
