const net = require("net");
const { spawn, exec } = require("child_process");

const port = Number(process.env.PORT || 5000);

function isPortInUse(targetPort) {
  if (process.platform === "win32") {
    return new Promise((resolve) => {
      exec("netstat -ano -p tcp", (err, stdout = "") => {
        if (err) {
          resolve(false);
          return;
        }

        const inUse = stdout
          .split(/\r?\n/)
          .some(
            (line) =>
              line.includes(`:${targetPort}`) &&
              line.toUpperCase().includes("LISTENING")
          );

        resolve(inUse);
      });
    });
  }

  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", (err) => {
        if (err && err.code === "EADDRINUSE") {
          resolve(true);
          return;
        }
        resolve(false);
      })
      .once("listening", () => {
        tester.close(() => resolve(false));
      })
      .listen(targetPort, "0.0.0.0");
  });
}

async function startDev() {
  const inUse = await isPortInUse(port);

  if (inUse) {
    console.log(
      `[dev-start] Port ${port} is already in use. Backend is likely already running in another terminal.`
    );
    console.log("[dev-start] Reuse that terminal, or stop it before starting a new one.");
    process.exit(0);
  }

  const command = process.platform === "win32" ? "npx nodemon server.js" : "npx nodemon server.js";
  const child = spawn(command, {
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code || 0);
  });
}

startDev().catch((err) => {
  console.error("[dev-start] Failed to start backend:", err.message);
  process.exit(1);
});
