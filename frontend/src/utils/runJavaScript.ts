// Runs candidate JavaScript in a throwaway Web Worker so it can't touch the
// page (DOM, tokens, proctoring hooks) and can be killed if it loops forever.

const WORKER_SOURCE = `
self.onmessage = (event) => {
  const lines = [];
  const format = (args) => args.map((a) => {
    if (typeof a === "string") return a;
    try { return JSON.stringify(a); } catch { return String(a); }
  }).join(" ");
  const sink = (prefix) => (...args) => lines.push(prefix + format(args));
  self.console = { log: sink(""), info: sink(""), warn: sink("warn: "), error: sink("error: "), debug: sink("") };
  try {
    const result = (0, eval)(event.data);
    if (result !== undefined) lines.push("=> " + format([result]));
    self.postMessage({ ok: true, output: lines.join("\\n") });
  } catch (err) {
    lines.push("Error: " + (err && err.message ? err.message : String(err)));
    self.postMessage({ ok: false, output: lines.join("\\n") });
  }
};
`;

export const runJavaScript = (
  code: string,
  timeoutMs = 5000,
): Promise<{ ok: boolean; output: string }> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(
      new Blob([WORKER_SOURCE], { type: "text/javascript" }),
    );
    const worker = new Worker(url);
    const finish = (result: { ok: boolean; output: string }) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    };
    const timer = setTimeout(
      () =>
        finish({
          ok: false,
          output: `Error: Execution timed out after ${timeoutMs / 1000}s`,
        }),
      timeoutMs,
    );
    worker.onmessage = (event) => finish(event.data);
    worker.onerror = (event) =>
      finish({ ok: false, output: `Error: ${event.message}` });
    worker.postMessage(code);
  });
