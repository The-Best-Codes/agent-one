export function createAbortError(): Error {
  const abortError = new Error("The operation was aborted.");
  abortError.name = "AbortError";
  return abortError;
}

export async function raceWithAbort<T>(promise: Promise<T>, abortSignal?: AbortSignal): Promise<T> {
  if (!abortSignal) {
    return promise;
  }

  abortSignal.throwIfAborted();

  let onAbort: (() => void) | undefined;
  const abortPromise = new Promise<never>((_, reject) => {
    onAbort = () => {
      reject(createAbortError());
    };
    abortSignal.addEventListener("abort", onAbort, { once: true });
  });

  try {
    return await Promise.race([promise, abortPromise]);
  } finally {
    if (onAbort) {
      abortSignal.removeEventListener("abort", onAbort);
    }
  }
}
