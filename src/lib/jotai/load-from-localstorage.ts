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

/**
 * If localStorage is available, evaluates the value of a given key as a string and return its value
 * @param key The localStorage key to evaluate
 * @returns string or undefined
 */
export const lsStringOrUndefined = (key: string): string | undefined => {
  try {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key) ?? undefined;
    } else {
      return undefined;
    }
  } catch {
    return undefined;
  }
};

/**
 * If localStorage is available, parses the value of a given key as JSON and returns it
 * @param key The localStorage key to evaluate
 * @returns Parsed JSON value or undefined
 */
export const lsJSONOrUndefined = <T>(key: string): T | undefined => {
  try {
    if (typeof window !== "undefined") {
      const value = localStorage.getItem(key);
      if (value === null) return undefined;
      return JSON.parse(value) as T;
    } else {
      return undefined;
    }
  } catch {
    return undefined;
  }
};
