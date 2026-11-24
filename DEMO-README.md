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
and organization profile use the local API. Payroll drafts must be approved by a
different authorized user before the approver can finalize and lock them. Finalizing
records the payroll result only; it does not initiate a bank payment. Time and
attendance are not implemented yet. Employee create/update and payroll preparation,
approval, and finalization actions are recorded in the append-only organization
audit log. Bank account values are never copied into audit records.
Organization admins can create organization-scoped accounts with a temporary
password; users must change it before accessing organization data. Passwords are
stored as Argon2 hashes, and admins may assign non-admin roles or deactivate
accounts from the Users screen.

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
   local `DEMO_ADMIN_PASSWORD` of at least 12 characters. Set `FIELD_ENCRYPTION_KEY`
   to a random 32-byte key encoded as 64 hexadecimal characters. Generate both keys
   with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Keep `FIELD_ENCRYPTION_KEY` backed up securely and unchanged: encrypted bank
   account data cannot be recovered without it. The migration encrypts existing
   employee bank accounts when migrations are applied.

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

## Deploy a shared test environment (Vercel + Render)

The web app can proxy API requests through its own origin. This keeps the browser's
authentication cookie same-site and lets testers use the default Vercel hostname;
a custom domain is not required.

### 1. Create a test branch

Push the code to a Git branch reserved for testing, then connect that branch to a
Vercel project and a Render API service. Do not deploy test changes to production.

### 2. Create the Render database and API service

- Create an isolated Render PostgreSQL database for test data.
- Create a Node web service from the repository root.
- Build command: `pnpm install --frozen-lockfile --prod=false && pnpm --filter api build`
- Start command: `pnpm --filter api start`
- Set `NODE_ENV=production`.
- Configure `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, and
  `POSTGRES_PASSWORD` from the Render database's internal connection settings.
- Configure `JWT_ACCESS_SECRET` with a unique random secret of at least 32
  characters and `FIELD_ENCRYPTION_KEY` with a unique random 32-byte key encoded as
  64 hexadecimal characters. Store both only in Render's environment settings and
  retain the encryption key securely; losing it makes encrypted bank-account values
  unrecoverable.
- Set `WEB_URL` to the final Vercel project origin, for example
  `https://your-project.vercel.app`.
- Set the service health-check path to `/api/v1/health`.
- Run database migrations with `pnpm --filter api db:migrate` after the API build and
  before using the test environment.

For the first test admin, set `DEMO_ADMIN_EMAIL` and a unique
`DEMO_ADMIN_PASSWORD` (12+ characters) in the Render environment. Run the seed
command once against the isolated test database with `NODE_ENV=staging`:
`pnpm --filter api db:seed`. Do not change the running API's `NODE_ENV=production`,
and do not use development seed data against production.

### 3. Configure and deploy the Vercel web app

- Import the same Git repository as a separate Vercel project and set its root
  directory to `apps/web`.
- Use the Next.js framework and the repository's pnpm lockfile/workspace
  configuration.
- Set these environment variables for the test deployment:
  - `NEXT_PUBLIC_API_URL=/api/v1`
  - `API_PROXY_TARGET=https://<your-render-api-host>` (origin only; no path)
- Deploy the same test branch. `API_PROXY_TARGET` is server-side only; never put
  secrets or credentials in `NEXT_PUBLIC_*` variables.

### 4. Verify before sharing the URL

1. Open `https://<your-render-api-host>/api/v1/health` and confirm it returns
   `{"status":"ok", ...}`.
2. Open the Vercel deployment URL and sign in with the test admin.
3. Refresh the page to confirm the session persists, then sign out and verify
   protected pages no longer load.
4. Run [MANUAL-TEST-CASES.md](./MANUAL-TEST-CASES.md) using synthetic data only.
   Share test credentials privately, not in Git or chat.

Render's free PostgreSQL databases expire after 30 days and free web services sleep
after inactivity. Choose plans that meet the test window and availability needs;
free instances are for temporary testing, not production.
