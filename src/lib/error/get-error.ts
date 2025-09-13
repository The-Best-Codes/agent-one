export const getError = (error: Error | string | undefined): string => {
  try {
    if (error instanceof Error) {
      return error.message;
    } else if (typeof error === "string") {
      return error;
    } else {
      return "Unknown error";
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    return "Unknown error";
  }
};
