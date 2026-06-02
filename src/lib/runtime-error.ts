const clientLoggerState = {
  installed: false,
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name || "Runtime error";
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Runtime error";
  }
}

export function normalizeRuntimeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  const normalized = new Error(errorMessage(error));
  if (error != null && typeof error === "object" && "cause" in error) {
    normalized.cause = (error as { cause?: unknown }).cause;
  }
  return normalized;
}

export function logRuntimeError(scope: string, error: unknown): Error {
  const normalized = normalizeRuntimeError(error);
  const prefix = scope ? `[${scope}]` : "[runtime]";

  if (normalized.stack) {
    console.error(`${prefix} ${normalized.message}\n${normalized.stack}`);
  } else {
    console.error(prefix, normalized);
  }

  return normalized;
}

export function installClientRuntimeErrorLogging(): void {
  if (clientLoggerState.installed || typeof window === "undefined") {
    return;
  }

  clientLoggerState.installed = true;

  window.addEventListener("error", (event) => {
    logRuntimeError("client:error", event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    logRuntimeError("client:unhandledrejection", event.reason);
  });
}