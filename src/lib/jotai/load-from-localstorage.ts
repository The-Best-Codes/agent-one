/**
 * If localStorage is available, evaluates the value of a given key as a boolean and return its truthiness
 * @param key The localStorage key to evaluate
 * @returns true, false, or undefined
 */
export const lsBooleanOrUndefined = (key: string): boolean | undefined => {
  try {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key) === "true";
    } else {
      return undefined;
    }
  } catch {
    return undefined;
  }
};
