# WorkforceIQ Lite — Manual Test Cases

## Run information

| Field | Value |
|---|---|
| Tester | |
| Test date | |
| Build / branch | |
| Browser and version | |
| Environment | Local / Test |
| Overall result | Pass / Fail / Blocked |

Use a dedicated local or test environment only. Do not enter real employee, payroll, or bank information. For each case, record **Pass**, **Fail**, or **Blocked**, and include actual results or a defect ID.

## Environment setup

1. From the repository root, run `pnpm install`.
2. Confirm the root `.env` has local PostgreSQL settings and demo admin credentials. Do not include passwords or secret values in test evidence.
3. Run `pnpm db:setup`, then `pnpm dev`; leave the development terminal running.
4. Open `http://localhost:3000/login` in a current Chrome or Edge browser.
5. Sign in with the demo admin account configured in the root `.env`.
6. Use unique, synthetic names/emails/TINs for each run. Keep a note of created employee and user IDs so the environment owner can clean or reset the disposable database afterward.

**Shared test data guidance**

- Employee: names beginning `QA`, email such as `qa-<unique-id>@example.test`, synthetic TIN, non-negative salary, and a dummy bank account number.
- Payroll: use the current pay period unless the case says otherwise; ensure the employee has no existing run for that period.
- User: a unique test email and a temporary password of at least 12 characters. Share credentials only through the approved secure channel.
- Do not use the test admin account as the payroll approver; payroll requires a different user.

## Test cases

### AUTH-01 — Reject invalid login

**Priority:** High  
**Preconditions:** Application is running; tester is signed out.

| Step | Action | Expected result |
|---|---|---|
| 1 | Open `/login`; enter a valid-format email and an incorrect password. | Both fields accept input. |
| 2 | Select **Sign in to WorkforceIQ**. | An error is shown; the user remains on the login screen and is not shown protected workspace data. |
| 3 | Leave one required field empty and submit. | Browser validation prevents submission and identifies the required field. |

**Result:** Pass / Fail / Blocked — **Notes / defect ID:** |

### AUTH-02 — Sign in, refresh, and sign out

**Priority:** High  
**Preconditions:** Valid demo admin credentials are available to the tester.

| Step | Action | Expected result |
|---|---|---|
| 1 | Sign in with the configured demo admin account. | The user reaches the dashboard and sees the signed-in email/role. |
| 2 | Refresh the page. | The session is rechecked and the dashboard remains available. |
| 3 | Select **Sign out**. | The user is returned to the login screen. |
| 4 | Navigate directly to `/payroll`. | Payroll data is not displayed without an authenticated session. |

**Result:** Pass / Fail / Blocked — **Notes / defect ID:** |

### USER-01 — Create a user and require a password change

**Priority:** High  
**Preconditions:** Signed in as organization admin.

| Step | Action | Expected result |
|---|---|---|
| 1 | Open **Users** and create a user with a unique email, a temporary password of 12+ characters, and the **Payroll officer** role. | A success message appears; the account is listed with the selected role and temporary-password-pending status. |
| 2 | Check the user list and success message. | The password itself is never displayed. |
| 3 | In a separate browser profile/private window, sign in as the new user with the temporary password. | The user is routed to the change-password screen before accessing the workspace. |
| 4 | Try to submit a new password shorter than 12 characters. | The form prevents submission. |
| 5 | Change to a new password of 12+ characters and submit. | The user reaches the dashboard; the temporary-password-pending status is cleared in the admin’s user list after refresh. |
| 6 | Sign out and sign in with the new password. | Sign-in succeeds. |

**Result:** Pass / Fail / Blocked — **Notes / defect ID:** |

### USER-02 — Change role and deactivate/reactivate a user

**Priority:** High  
**Preconditions:** Signed in as organization admin; a separate test account exists.

| Step | Action | Expected result |
|---|---|---|
| 1 | Change the test account’s role to **Auditor** and save. | A success message appears and the new role remains after refresh. |
| 2 | Deactivate the test account. | The status changes to **Inactive**. |
| 3 | Attempt to sign in as that account. | Sign-in is rejected. |
| 4 | Reactivate the account from the admin’s user list. | The status changes to **Active** and the account can sign in again. |
| 5 | Inspect the admin’s own row. | The admin cannot change their own role or deactivate their own account from this screen. |

**Result:** Pass / Fail / Blocked — **Notes / defect ID:** |

### EMP-01 — Create and view an employee

**Priority:** High  
**Preconditions:** Signed in as demo admin.

| Step | Action | Expected result |
|---|---|---|
| 1 | Open **Employees** and select **Add employee**. | The employee form opens. |
| 2 | Enter unique synthetic names, email, TIN, basic salary, and dummy bank account. Optionally enter allowances and region. Save. | The form closes and the new employee appears in the directory. |
| 3 | Search for the new employee and open the profile. | The profile shows the saved name, email, TIN, and salary values. |
| 4 | Inspect the profile and directory. | The bank account number is not displayed. |
| 5 | Refresh the profile and directory. | The saved employee remains present with the same non-sensitive values. |

**Result:** Pass / Fail / Blocked — **Notes / defect ID:** |

### EMP-02 — Validate required and invalid employee input

**Priority:** Medium  
**Preconditions:** Signed in as demo admin; employee form is open.

| Step | Action | Expected result |
|---|---|---|
| 1 | Leave required fields empty and try to save. | Browser validation identifies missing required fields; no employee is created. |
| 2 | Enter an invalid email address and otherwise valid values. | The browser prevents submission or the application displays a validation error; no employee is created. |
| 3 | Enter a negative value for basic salary. | The form prevents submission or displays a validation error; no employee is created. |
| 4 | Correct the invalid values and submit. | The employee is created successfully. |

**Result:** Pass / Fail / Blocked — **Notes / defect ID:** |

### EMP-03 — Search, edit, cancel, and save employee changes

**Priority:** Medium  
**Preconditions:** A test employee exists.

| Step | Action | Expected result |
|---|---|---|
| 1 | Search by the employee’s name, email, TIN, and region (one search at a time). | Matching employees appear; unrelated employees are filtered out. Search is case-insensitive. |
| 2 | Clear the search. | The full employee list returns. |
| 3 | Open the employee profile, select **Edit employee**, change a field, then select **Cancel**. | The edit form closes and the unsaved value is discarded. |
| 4 | Edit the employee again, change a non-sensitive field (for example, region or salary), and save. | A success message appears and the changed value is shown. |
| 5 | Refresh the profile. | The saved value persists. Bank-account details remain unavailable for viewing or editing. |

**Result:** Pass / Fail / Blocked — **Notes / defect ID:** |

### PAY-01 — Calculate and retrieve a payroll draft

**Priority:** High  
**Preconditions:** Signed in as an authorized payroll user; a test employee exists and has no payroll run for the selected period.

| Step | Action | Expected result |
|---|---|---|
| 1 | Open **Payroll Runs** and select the intended pay period. | The page shows that period and its saved calculations (or an empty state). |
| 2 | Select the test employee and choose **Calculate draft**. | A draft is saved and appears in the saved calculations table. |
| 3 | Review gross taxable income, tax, pension, net pay, and status. | Values are displayed as ETB; status is **Draft**. Validate amounts against the approved test data/rules for this environment. |
| 4 | Refresh the page with the same period selected. | The saved draft and totals remain. |
| 5 | Check the employee selector for the same period. | The already processed employee is no longer available for another run in that period. |
| 6 | Review the table. | Bank account details are not shown; no payment is initiated. |

**Result:** Pass / Fail / Blocked — **Notes / defect ID:** |

### PAY-02 — Enforce maker-checker approval and finalization

**Priority:** Critical  
**Preconditions:** A draft exists from **PAY-01**; a separate payroll officer account has completed **USER-01** and changed its temporary password.

| Step | Action | Expected result |
|---|---|---|
| 1 | As the user who created the draft, open the same payroll period. | The draft shows that it is waiting for another user; the preparer is not offered an approval action. |
| 2 | Sign in as the separate payroll officer and open the same period. | The draft has an **Approve** action. |
| 3 | Approve the draft. | Status becomes **Approved** and the page confirms it can now be finalized. |
| 4 | Sign in as the preparer and refresh. | The run remains **Approved**; the preparer cannot finalize it. |
| 5 | Sign back in as the approver and finalize the run. | Status becomes **Finalized**; the run is locked and no further action is offered. |
| 6 | Refresh the page and review the run. | **Finalized** status persists. The UI confirms finalization records/locks the calculation and does not make a bank payment. |

**Result:** Pass / Fail / Blocked — **Notes / defect ID:** |

### ORG-01 — Verify dashboard summary and navigation

**Priority:** Medium  
**Preconditions:** Signed in as demo admin; at least one test employee exists.

| Step | Action | Expected result |
|---|---|---|
| 1 | Open **Dashboard**. | Employee count matches the organization’s employee directory count. |
| 2 | Review recently added employees. | Recent employee names and emails are visible and link to their profiles. |
| 3 | Review payroll and attendance cards. | The page clearly indicates that dashboard payroll totals are not connected and attendance is not available; do not expect values for these features. |
| 4 | Select **View all employees**. | The employee directory opens. |

**Result:** Pass / Fail / Blocked — **Notes / defect ID:** |

### ORG-02 — View organization profile and search branches

**Priority:** Low  
**Preconditions:** Signed in as demo admin; organization has seeded branch data if branch search is to be exercised.

| Step | Action | Expected result |
|---|---|---|
| 1 | Open **Organizations**. | The signed-in user’s organization, country, currency, locale, counts, and branch list load. |
| 2 | Search for a known branch name or address. | Matching branches are shown. Clearing the search restores the list. |
| 3 | Check the page for branch or organization edit controls. | The page is read-only; it states that creating or editing organizations/branches is not available. |

**Result:** Pass / Fail / Blocked — **Notes / defect ID:** |

## Not included in this manual pass

The current demo does not implement attendance/time tracking, leave workflows, AI assistant, payslip/document generation, reporting exports, or organization/branch editing. Record requests for these as **not implemented / out of scope**, not as failed tests.
