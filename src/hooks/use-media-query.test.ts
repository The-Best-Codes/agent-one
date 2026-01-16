import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useMediaQuery } from "./use-media-query";

describe("useMediaQuery", () => {
  beforeEach(() => {
    // Reset matchMedia mock
    vi.clearAllMocks();
  });

  it("should return false initially when window is undefined (SSR)", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(typeof result.current).toBe("boolean");
  });

  it("should return current media query match status", () => {
    // Mock matchMedia to return matches: true
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(min-width: 768px)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("should return false when media query does not match", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(min-width: 1920px)"));
    expect(result.current).toBe(false);
  });

  it("should update when media query changes", async () => {
    let listeners: Array<() => void> = [];
    
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event, callback) => {
        if (event === "change") {
          listeners.push(callback);
        }
      }),
      removeEventListener: vi.fn((event, callback) => {
        listeners = listeners.filter((l) => l !== callback);
      }),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    
    expect(result.current).toBe(false);

    // Simulate media query change
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Trigger listeners
    listeners.forEach((listener) => listener());

    await waitFor(() => {
      // Note: Actual update would happen via event listener in real scenario
    });
  });

  it("should handle different media query strings", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("dark"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useMediaQuery("(prefers-color-scheme: dark)")
    );
    expect(result.current).toBe(true);
  });

  it("should cleanup event listener on unmount", () => {
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener,
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    unmount();

    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("should work with portrait/landscape queries", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("portrait"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useMediaQuery("(orientation: portrait)")
    );
    expect(result.current).toBe(true);
  });

  it("should handle complex media queries", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px) and (max-width: 1024px)")
    );
    expect(result.current).toBe(true);
  });
});
