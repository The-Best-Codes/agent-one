import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import useMobileDetection from "./use-mobile-detection";

describe("useMobileDetection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should detect mobile with pointer: coarse", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(pointer: coarse)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useMobileDetection({ pointerCoarse: true, match: "any" })
    );
    
    expect(result.current).toBe(true);
  });

  it("should detect mobile with any-hover: none", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(any-hover: none)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useMobileDetection({ anyHover: true, match: "any" })
    );
    
    expect(result.current).toBe(true);
  });

  it("should detect mobile via user agent", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
    });

    const { result } = renderHook(() =>
      useMobileDetection({ userAgent: true, match: "any" })
    );
    
    expect(result.current).toBe(true);
  });

  it("should detect mobile with ontouchstart", () => {
    Object.defineProperty(window, "ontouchstart", {
      writable: true,
      value: {},
    });

    const { result } = renderHook(() =>
      useMobileDetection({ onTouchStart: true, match: "any" })
    );
    
    expect(result.current).toBe(true);
  });

  it("should use 'all' match mode correctly", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(pointer: coarse)" || query === "(any-hover: none)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useMobileDetection({
        pointerCoarse: true,
        anyHover: true,
        match: "all",
      })
    );
    
    expect(result.current).toBe(true);
  });

  it("should use 'any' match mode correctly", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(pointer: coarse)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useMobileDetection({
        pointerCoarse: true,
        anyHover: false,
        match: "any",
      })
    );
    
    expect(result.current).toBe(true);
  });

  it("should detect desktop when no mobile indicators", () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });

    const { result } = renderHook(() =>
      useMobileDetection({
        pointerCoarse: false,
        userAgent: false,
        match: "all",
      })
    );
    
    expect(result.current).toBe(true);
  });

  it("should detect Android devices", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value:
        "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
    });

    const { result } = renderHook(() =>
      useMobileDetection({ userAgent: true, match: "any" })
    );
    
    expect(result.current).toBe(true);
  });

  it("should detect iPad", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value:
        "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
    });

    const { result } = renderHook(() =>
      useMobileDetection({ userAgent: true, match: "any" })
    );
    
    expect(result.current).toBe(true);
  });

  it("should handle no checks provided", () => {
    const { result } = renderHook(() =>
      useMobileDetection({ match: "any" })
    );
    
    expect(result.current).toBe(false);
  });

  it("should handle all checks with 'all' mode", () => {
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

    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (iPhone)",
    });

    Object.defineProperty(window, "ontouchstart", {
      writable: true,
      value: {},
    });

    const { result } = renderHook(() =>
      useMobileDetection({
        pointerCoarse: true,
        anyHover: true,
        userAgent: true,
        onTouchStart: true,
        match: "all",
      })
    );
    
    expect(result.current).toBe(true);
  });
});
