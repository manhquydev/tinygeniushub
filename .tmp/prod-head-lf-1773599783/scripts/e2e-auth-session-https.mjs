import { spawn } from "node:child_process";
import { createServer } from "node:net";

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Cannot resolve free port"));
        return;
      }

      const { port } = address;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

async function run() {
  const port = Number(process.env.E2E_PORT ?? (await getFreePort()));
  const httpsOrigin = `https://127.0.0.1:${port}`;
  const env = {
    ...process.env,
    E2E_PORT: String(port),
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? httpsOrigin,
    E2E_REQUEST_ORIGIN: process.env.E2E_REQUEST_ORIGIN ?? httpsOrigin,
    E2E_EXPECT_SECURE_COOKIE: "1",
    RATE_LIMIT_TRUST_PROXY: process.env.RATE_LIMIT_TRUST_PROXY ?? "true",
  };

  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/e2e-auth-session-lifecycle.mjs"], {
      stdio: "inherit",
      env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }
      reject(new Error(`HTTPS auth session lifecycle failed with exit code ${code}`));
    });
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
