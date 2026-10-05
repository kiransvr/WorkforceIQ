# WorkforceIQ Demo

The local application includes these screens:

- Login
- Dashboard
- Employees
- Employee Profile
- Payroll Runs
- Organizations

## Run locally

From the repository root:

```bash
pnpm install
pnpm db:setup
pnpm dev
```

`pnpm db:setup` starts PostgreSQL, applies migrations, and creates the local admin
account. `pnpm dev` starts both the API and web app; keep that terminal running.

Open http://localhost:3000.

## Demo behaviour

Log in with the `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD` values in the root
`.env`. The dashboard, employee directory, employee profile, payroll draft screen,
and organization profile use the local API. Payroll drafts are calculations only;
they are not approved payroll or payment instructions. Time and attendance are not
implemented yet.

## Routes

- `/login`
- `/dashboard`
- `/employees`
- `/employees/<employee-id>`
- `/payroll`
- `/organizations`

## API development setup

1. Copy `.env.example` to `.env` in the repository root.
2. Set `JWT_ACCESS_SECRET` to a random secret of at least 32 characters, and set a
   local `DEMO_ADMIN_PASSWORD` of at least 12 characters. For example, generate the
   JWT secret with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. Start PostgreSQL, run the schema migrations, and create the local organization/admin:

   ```bash
   pnpm db:setup
   ```

   This starts only the PostgreSQL service from `docker-compose.yml`; it does not start
   Redis or MinIO. Seed data is refused when `NODE_ENV=production`.

4. Start both the API and web app:

   ```bash
   pnpm dev
   ```

5. Sign in at http://localhost:3000/login with the seeded admin email/password.
   Authenticated employee, payroll, and organization requests are scoped to the
   organization assigned to that account.

## Build, tests, and workflow smoke checks

The recommended post-change check builds both apps, runs API unit tests, starts the
compiled API, checks its health endpoint, and exercises login, employee
create/edit/read, and payroll draft workflows against the configured local database.
Workflow smoke data is synthetic and removed after each run:

```bash
pnpm verify
```

For individual steps, run `pnpm build`, `pnpm --filter api test:ci`, or `pnpm smoke`.
The smoke check requires PostgreSQL, the migrations, and the seeded development admin
configured by the root `.env`; run `pnpm db:setup` if those are not ready. The default
check port is `3137`; set `API_SMOKE_PORT` if that port is already in use.

The health endpoint is `http://localhost:3137/api/v1/health` during the smoke check.
