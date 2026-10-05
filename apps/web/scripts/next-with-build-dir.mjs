import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const command = process.argv[2];
if (!["build", "start"].includes(command)) {
  throw new Error("Expected a Next.js command: build or start.");
}

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");
const next = spawn(process.execPath, [nextCli, ...process.argv.slice(2)], {
  env: { ...process.env, NEXT_DIST_DIR: ".next-build" },
  stdio: "inherit",
});

next.once("error", (error) => {
  console.error(`Could not start Next.js ${command}: ${error.message}`);
  process.exitCode = 1;
});
next.once("exit", (code, signal) => {
  if (signal) {
    console.error(`Next.js ${command} stopped by signal ${signal}.`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
