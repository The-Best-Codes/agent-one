import { renderHook, act } from "@testing-library/react";
import { Provider } from "jotai";
import React from "react";
import { describe, expect, it } from "vitest";
import { useTheme } from "./use-theme";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider>{children}</Provider>
);

describe("useTheme", () => {
  it("should return theme, resolvedTheme, and setTheme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current).toHaveProperty("theme");
    expect(result.current).toHaveProperty("resolvedTheme");
    expect(result.current).toHaveProperty("setTheme");
    expect(typeof result.current.setTheme).toBe("function");
  });

  it("should have default theme value", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(typeof result.current.theme).toBe("string");
    expect(typeof result.current.resolvedTheme).toBe("string");
  });

  it("should update theme when setTheme is called", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme("dark");
    });
    
    expect(result.current.theme).toBe("dark");
  });

  it("should update theme to light", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme("light");
    });
    
    expect(result.current.theme).toBe("light");
  });

  it("should resolve system theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme("system");
    });
    
    expect(result.current.theme).toBe("system");
    expect(["light", "dark"]).toContain(result.current.resolvedTheme);
  });

  it("should resolve dark theme correctly", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme("dark");
    });
    
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("should resolve light theme correctly", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme("light");
    });
    
    expect(result.current.resolvedTheme).toBe("light");
  });
});
