# WorkforceIQ Demo

This version adds the six-screen demo experience:

- Login
- Dashboard
- Employees
- Employee Profile
- Payroll Runs
- Organizations

## Run locally

From the repository root:

```bash
npm install
npm run dev --workspace=web
```

Or from `apps/web`:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Demo behaviour

The Login page is intentionally demo-only: submitting the form opens `/dashboard`. The six screens use realistic sample data and do not require the API/database to demonstrate the UI.

## Routes

- `/login`
- `/dashboard`
- `/employees`
- `/employees/EMP-1024`
- `/payroll`
- `/organizations`

The existing NestJS API and database architecture are retained for the next integration phase.
