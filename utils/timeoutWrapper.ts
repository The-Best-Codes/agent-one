type AsyncFunction<T> = (...args: any[]) => Promise<T>;

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export async function withTimeout<T>(
  asyncFn: AsyncFunction<T>,
  timeoutMs: number,
  ...args: Parameters<typeof asyncFn>
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([asyncFn(...args), timeoutPromise]);
}
