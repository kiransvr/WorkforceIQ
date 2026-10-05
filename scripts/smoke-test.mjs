import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { access } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const apiDirectory = path.join(repositoryRoot, "apps", "api");
const apiEntryPoint = path.join(apiDirectory, "dist", "main.js");
const require = createRequire(path.join(apiDirectory, "package.json"));
const { Client } = require("pg");
const { parse: parseDotEnv } = require("dotenv");
const port = Number.parseInt(process.env.API_SMOKE_PORT ?? "3137", 10);
const apiUrl = `http://127.0.0.1:${port}/api/v1`;
const healthUrl = `${apiUrl}/health`;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(
    "API_SMOKE_PORT must be a valid TCP port between 1 and 65535.",
  );
}

try {
  await access(apiEntryPoint);
} catch (error) {
  if (error.code === "ENOENT") {
    throw new Error(
      "Built API not found. Run `pnpm build` before the smoke check.",
    );
  }
  throw error;
}

const portProbe = createServer();
await new Promise((resolve, reject) => {
  portProbe.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      reject(
        new Error(
          `Port ${port} is already in use. Set API_SMOKE_PORT to another free port.`,
        ),
      );
      return;
    }
    reject(error);
  });
  portProbe.listen(port, "127.0.0.1", resolve);
});
await new Promise((resolve, reject) => {
  portProbe.close((error) => (error ? reject(error) : resolve()));
});

let localEnvironment = {};
try {
  localEnvironment = parseDotEnv(
    await readFile(path.join(repositoryRoot, ".env")),
  );
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}
const environment = { ...localEnvironment, ...process.env };

const api = spawn(process.execPath, [apiEntryPoint], {
  cwd: apiDirectory,
  env: { ...environment, API_PORT: String(port) },
  stdio: "inherit",
});

let spawnError;
let exitResult;
api.once("error", (error) => {
  spawnError = error;
});
api.once("exit", (code, signal) => {
  exitResult = { code, signal };
});

try {
  const timeoutAt = Date.now() + 45_000;
  let lastError = "API did not respond.";
  let healthy = false;

  while (Date.now() < timeoutAt) {
    if (spawnError) {
      throw new Error(`Could not start the API process: ${spawnError.message}`);
    }
    if (exitResult) {
      throw new Error(
        `API exited before becoming healthy (code ${exitResult.code ?? "unknown"}, signal ${exitResult.signal ?? "none"}). Check the API logs above and confirm PostgreSQL is running.`,
      );
    }

    try {
      const response = await fetch(healthUrl, {
        signal: AbortSignal.timeout(1_000),
      });
      if (!response.ok) {
        throw new Error(`Health endpoint returned HTTP ${response.status}.`);
      }

      const body = await response.json();
      if (body.status !== "ok") {
        throw new Error("Health endpoint returned an unexpected response.");
      }

      console.log(`API smoke check passed: ${healthUrl}`);
      healthy = true;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await delay(500);
    }
  }

  if (!healthy) {
    throw new Error(
      `API did not become healthy within 45 seconds. Check that the configured PostgreSQL database is running. Last error: ${lastError}`,
    );
  }

  await runWorkflowSmokeChecks();
} finally {
  if (api.exitCode === null && api.signalCode === null) {
    api.kill();
    let stopTimer;
    const stopped = await Promise.race([
      new Promise((resolve) => api.once("exit", () => resolve(true))),
      new Promise((resolve) => {
        stopTimer = setTimeout(() => resolve(false), 5_000);
      }),
    ]);
    clearTimeout(stopTimer);
    if (!stopped) {
      api.kill("SIGKILL");
    }
  }
}

async function runWorkflowSmokeChecks() {
  const email = (environment.DEMO_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = environment.DEMO_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD in the root .env file, then run `pnpm db:setup` before workflow smoke checks.",
    );
  }

  const loginResponse = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!loginResponse.ok) {
    throw new Error(
      `Workflow smoke check could not sign in the seeded admin (HTTP ${loginResponse.status}). Confirm the root .env credentials match the seeded database by running \`pnpm db:setup\`.`,
    );
  }

  const login = await loginResponse.json();
  if (!login.accessToken || !login.user?.organizationId) {
    throw new Error(
      "Workflow smoke check received an incomplete admin login response.",
    );
  }

  const headers = {
    authorization: `Bearer ${login.accessToken}`,
    "content-type": "application/json",
  };
  const uniqueId = `${Date.now()}-${process.pid}`;
  const testEmail = `workforceiq-smoke-${uniqueId}@example.test`;
  const testTin = `SMOKE-${uniqueId}`;
  const payPeriod = new Date().toISOString().slice(0, 7);
  const database = new Client({
    host: environment.POSTGRES_HOST ?? "localhost",
    port: Number.parseInt(environment.POSTGRES_PORT ?? "5432", 10),
    database: environment.POSTGRES_DB ?? "workforceiq",
    user: environment.POSTGRES_USER ?? "workforceiq_user",
    password: environment.POSTGRES_PASSWORD,
    connectionTimeoutMillis: 10_000,
  });

  let flowError;
  let databaseConnected = false;
  try {
    await database.connect();
    databaseConnected = true;

    const employeesResponse = await requestJson(`${apiUrl}/employees`, {
      headers,
    });
    if (!Array.isArray(employeesResponse)) {
      throw new Error(
        "Employee list workflow check expected an array response.",
      );
    }

    const createdEmployee = await requestJson(`${apiUrl}/employees`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        firstName: "Workflow",
        fatherName: "Smoke",
        grandFatherName: "Test",
        email: testEmail,
        tinNumber: testTin,
        basicSalary: 25_000,
        transportAllowance: 1_000,
        otherAllowances: 500,
        bankAccountNumber: "0000000000",
      }),
    });
    if (!createdEmployee.id || "bankAccountNumber" in createdEmployee) {
      throw new Error(
        "Employee create workflow check failed its response privacy assertion.",
      );
    }

    const updatedEmployee = await requestJson(
      `${apiUrl}/employees/${createdEmployee.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          firstName: "WorkflowUpdated",
          email: testEmail,
          tinNumber: testTin,
          basicSalary: 26_000,
        }),
      },
    );
    if (
      updatedEmployee.firstName !== "WorkflowUpdated" ||
      Number(updatedEmployee.basicSalary) !== 26_000 ||
      "bankAccountNumber" in updatedEmployee
    ) {
      throw new Error(
        "Employee update workflow check failed its value or privacy assertions.",
      );
    }

    const employeeDetail = await requestJson(
      `${apiUrl}/employees/${createdEmployee.id}`,
      { headers },
    );
    if (
      employeeDetail.firstName !== "WorkflowUpdated" ||
      "bankAccountNumber" in employeeDetail
    ) {
      throw new Error(
        "Employee detail workflow check did not return the saved, redacted record.",
      );
    }

    const employeeList = await requestJson(`${apiUrl}/employees`, {
      headers,
    });
    if (
      !employeeList.some((employee) => employee.id === createdEmployee.id) ||
      employeeList.some((employee) => "bankAccountNumber" in employee)
    ) {
      throw new Error(
        "Employee list workflow check failed its organization or privacy assertions.",
      );
    }
    console.log(
      "Employee create, edit, detail, list, and bank-data redaction checks passed.",
    );

    const payrollRun = await requestJson(`${apiUrl}/payroll/process`, {
      method: "POST",
      headers,
      body: JSON.stringify({ employeeId: createdEmployee.id, payPeriod }),
    });
    if (
      payrollRun.employee?.id !== createdEmployee.id ||
      payrollRun.payPeriod !== payPeriod ||
      payrollRun.status !== "Draft" ||
      !Number.isFinite(Number(payrollRun.netPay))
    ) {
      throw new Error(
        "Payroll workflow check failed its calculation assertions.",
      );
    }

    const periodRuns = await requestJson(
      `${apiUrl}/payroll/period/${encodeURIComponent(payPeriod)}`,
      { headers },
    );
    const savedRun = periodRuns.find((run) => run.id === payrollRun.id);
    if (
      !savedRun ||
      savedRun.employee?.id !== createdEmployee.id ||
      "bankAccountNumber" in savedRun.employee
    ) {
      throw new Error(
        "Payroll period workflow check failed its persistence or privacy assertions.",
      );
    }
    console.log(
      "Payroll draft calculation and saved period lookup checks passed.",
    );
  } catch (error) {
    flowError = error;
  } finally {
    try {
      if (databaseConnected) {
        const cleanup = await database.query(
          "DELETE FROM employees WHERE email = $1 AND organization_id = $2",
          [testEmail, login.user.organizationId],
        );
        if (cleanup.rowCount > 0) {
          console.log(
            `Removed ${cleanup.rowCount} synthetic workflow test employee.`,
          );
        }
      }
    } catch (error) {
      const cleanupError = new Error(
        `Failed to clean up the synthetic workflow test employee: ${error.message}`,
      );
      if (flowError) {
        console.error(cleanupError.message);
      } else {
        flowError = cleanupError;
      }
    } finally {
      if (databaseConnected) {
        await database.end();
      }
    }
  }

  if (flowError) {
    throw flowError;
  }
}

async function requestJson(url, options) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body?.message === "string"
        ? body.message
        : Array.isArray(body?.message)
          ? body.message.join(" ")
          : response.statusText;
    throw new Error(
      `Workflow smoke request failed (HTTP ${response.status}): ${message}`,
    );
  }
  return body;
}
